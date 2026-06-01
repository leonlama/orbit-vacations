"""Vercel serverless endpoint: GET /api/catalog.

Returns the destination and rocket catalogs used to populate the frontend
menus.  Pure standard library; the data comes from the `orbital` engine
package.

Import path note
----------------
This file is imported in two contexts:
  * `vercel dev` / production, where it lives at /api/catalog.py and the
    sibling `orbital` package is at /api/orbital; and
  * pytest run from /api, where it is imported as the top-level module
    `catalog`.
In both cases the directory containing this file (the `api` root) must be on
sys.path so that `from orbital import ...` resolves.  We insert it
defensively below (pytest's conftest also does this, so the insert is a
harmless no-op there).
"""

import json
import os
import sys
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from orbital import hohmann, rockets  # noqa: E402


def build_catalog():
    """Build the catalog payload (pure function, easy to unit-test)."""
    destinations = [
        {
            "id": meta["id"],
            "name": meta["name"],
            "central_body": meta["central_body"],
            "description": meta["description"],
        }
        # Preserve a stable, intentional order for the menus.
        for meta in (
            hohmann.DESTINATION_META["mars"],
            hohmann.DESTINATION_META["venus"],
            hohmann.DESTINATION_META["moon"],
        )
    ]

    rocket_list = []
    for rocket in (
        rockets.FALCON_9,
        rockets.SATURN_V,
        rockets.DELTA_IV_HEAVY,
        rockets.STARSHIP,
    ):
        rocket_list.append(
            {
                "id": rocket.id,
                "name": rocket.name,
                "payload_leo_kg": rocket.payloads.get("leo"),
                # Starship's LEO figure is a design target, not flight-proven.
                # Surface that explicitly so the menu can flag it.
                "payload_demonstrated": rocket.demonstrated,
                "payload_basis": "demonstrated" if rocket.demonstrated else "target",
                "cost_usd": rocket.cost_usd,
                "notes": rocket.notes,
            }
        )

    return {"destinations": destinations, "rockets": rocket_list}


# ---------------------------------------------------------------------------
# HTTP handler.
# ---------------------------------------------------------------------------
def _apply_cors(resp):
    resp.send_header("Access-Control-Allow-Origin", "*")
    resp.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
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

    def do_OPTIONS(self):  # CORS preflight.
        self.send_response(204)
        _apply_cors(self)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_GET(self):
        self._send_json(200, build_catalog())

    # Keep test output quiet.
    def log_message(self, *args):
        pass
