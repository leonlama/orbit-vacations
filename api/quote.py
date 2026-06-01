"""Vercel serverless endpoint: /api/quote.

GET  /api/quote?destination=mars&rocket=falcon-9
POST /api/quote   with JSON body {"destination": "...", "rocket": "..."}

Returns a full idealized-Hohmann travel quote for a destination/rocket
pair: delta-v breakdown, transfer time, the next launch window, and the
rocket's payload/fare economics.

Pure standard library; all physics and rocket data come from the `orbital`
engine package.  See catalog.py for the import-path rationale (the `api`
root is inserted onto sys.path so `from orbital import ...` resolves under
both `vercel dev` and pytest).
"""

import json
import os
import sys
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from orbital import hohmann, rockets  # noqa: E402


class QuoteError(Exception):
    """Raised for bad input; carries an HTTP status and message."""

    def __init__(self, status, message):
        super().__init__(message)
        self.status = status
        self.message = message


def build_quote(destination, rocket_name, base_epoch=None):
    """Build the full quote payload for a destination/rocket pair.

    Raises QuoteError(400, ...) for missing or unknown inputs.
    """
    if not destination:
        raise QuoteError(400, "Missing required parameter 'destination'.")
    if not rocket_name:
        raise QuoteError(400, "Missing required parameter 'rocket'.")

    dest_key = destination.strip().lower()
    if dest_key not in hohmann.DESTINATION_META:
        raise QuoteError(
            400,
            f"Unknown destination {destination!r}; choose from "
            f"{sorted(hohmann.DESTINATION_META)}.",
        )

    # trip_feasibility computes the transfer and the rocket economics in one
    # call; it raises ValueError for an unknown rocket name.
    try:
        trip = rockets.trip_feasibility(dest_key, rocket_name, base_epoch)
    except ValueError as exc:
        raise QuoteError(400, str(exc))

    transfer = trip["transfer"]
    meta = hohmann.DESTINATION_META[dest_key]

    # Launch window.  For Mars/Venus the heliocentric synodic period gives a
    # meaningful ISO date.  For the Moon the LEO-vs-Moon synodic period
    # collapses to ~0 (LEO laps the Moon every ~90 min), which is physically
    # "departures are available almost continuously" rather than a single
    # date -- so we report null + a human cadence instead.
    if dest_key == "moon":
        next_window = None
        next_window_note = "≈ monthly"
    else:
        next_window = transfer["next_launch_window"].isoformat()
        next_window_note = None

    # Normalize payload basis to the documented values.
    payload_basis = "published" if trip["payload_source"] == "published" else "estimate"

    return {
        "destination": {
            "id": meta["id"],
            "name": meta["name"],
            "central_body": meta["central_body"],
        },
        "total_dv_kms": transfer["total_dv_kmps"],
        "departure_burn_kms": transfer["dv1_kmps"],
        "arrival_burn_kms": transfer["dv2_kmps"],
        "transfer_time_days": transfer["transfer_time_days"],
        "next_window": next_window,
        "next_window_note": next_window_note,
        "rocket": {
            "name": trip["rocket"],
            "feasible": trip["feasible"],
            "deliverable_payload_kg": trip["payload_kg"],
            "payload_basis": payload_basis,
            "demonstrated": trip["demonstrated"],
            "total_cost_usd": trip["cost_usd"],
            "fare_cost_per_kg_usd": trip["fare_usd_per_kg"],
        },
        "assumptions": hohmann.ASSUMPTIONS,
    }


# ---------------------------------------------------------------------------
# HTTP handler.
# ---------------------------------------------------------------------------
def _apply_cors(resp):
    resp.send_header("Access-Control-Allow-Origin", "*")
    resp.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    resp.send_header("Access-Control-Allow-Headers", "Content-Type")


class handler(BaseHTTPRequestHandler):
    def _send_json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        _apply_cors(self)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _respond(self, destination, rocket_name):
        try:
            payload = build_quote(destination, rocket_name)
        except QuoteError as exc:
            self._send_json(exc.status, {"error": exc.message})
            return
        self._send_json(200, payload)

    def do_OPTIONS(self):  # CORS preflight.
        self.send_response(204)
        _apply_cors(self)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_GET(self):
        params = parse_qs(urlparse(self.path).query)
        destination = (params.get("destination") or [None])[0]
        rocket_name = (params.get("rocket") or [None])[0]
        self._respond(destination, rocket_name)

    def do_POST(self):
        length = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(length) if length else b""
        try:
            data = json.loads(raw or b"{}")
            if not isinstance(data, dict):
                raise ValueError("JSON body must be an object")
        except (ValueError, json.JSONDecodeError):
            self._send_json(400, {"error": "Request body must be valid JSON object."})
            return
        self._respond(data.get("destination"), data.get("rocket"))

    # Keep test output quiet.
    def log_message(self, *args):
        pass
