"""Tests for the /api/quote endpoint."""

import pytest

import quote


# ---------------------------------------------------------------------------
# build_quote (pure function) behavior.
# ---------------------------------------------------------------------------
def test_mars_quote_keys_and_values():
    q = quote.build_quote("mars", "falcon-9")
    assert set(q) >= {
        "destination", "total_dv_kms", "departure_burn_kms", "arrival_burn_kms",
        "transfer_time_days", "next_window", "next_window_note", "rocket",
        "assumptions",
    }
    assert q["destination"]["name"] == "Mars"
    assert q["destination"]["central_body"] == "Sun"

    # Textbook-ish sanity: ~5.6 km/s total, ~259 days, positive burns.
    assert q["total_dv_kms"] == pytest.approx(5.6, rel=0.05)
    assert q["transfer_time_days"] == pytest.approx(259.0, rel=0.05)
    assert q["departure_burn_kms"] > 0
    assert q["arrival_burn_kms"] > 0

    # Falcon 9 has a published trans-Mars payload.
    assert q["rocket"]["name"] == "Falcon 9"
    assert q["rocket"]["feasible"] is True
    assert q["rocket"]["payload_basis"] == "published"
    assert q["rocket"]["deliverable_payload_kg"] == 4020
    assert q["rocket"]["fare_cost_per_kg_usd"] > 0

    # Interplanetary -> a real ISO launch window, no cadence note.
    assert q["next_window"] is not None
    assert q["next_window_note"] is None
    # Synodic period exposed for the "every ~26 months" cadence text (~779.9 d).
    assert q["synodic_period_days"] == pytest.approx(779.9, rel=0.05)
    assert q["assumptions"]  # non-empty disclaimer


def test_moon_quote_uses_cadence_not_synodic_date():
    q = quote.build_quote("moon", "saturn-v")
    assert q["destination"]["central_body"] == "Earth"
    # Moon: no single synodic date; null window + human cadence string.
    assert q["next_window"] is None
    assert q["next_window_note"] == "≈ monthly"
    # No meaningful synodic date for the Moon.
    assert q["synodic_period_days"] is None
    # Saturn V TLI is a published figure.
    assert q["rocket"]["payload_basis"] == "published"
    assert q["rocket"]["deliverable_payload_kg"] == 43500
    # TLI departure burn ~3.0-3.2 km/s.
    assert 3.0 <= q["departure_burn_kms"] <= 3.2


def test_estimate_basis_when_no_published_figure():
    # Delta IV Heavy has no published Mars figure -> estimate.
    q = quote.build_quote("mars", "delta-iv-heavy")
    assert q["rocket"]["payload_basis"] == "estimate"
    assert q["rocket"]["deliverable_payload_kg"] > 0


def test_missing_params_raise():
    with pytest.raises(quote.QuoteError) as e:
        quote.build_quote("", "falcon-9")
    assert e.value.status == 400

    with pytest.raises(quote.QuoteError) as e:
        quote.build_quote("mars", "")
    assert e.value.status == 400


def test_unknown_destination_raises():
    with pytest.raises(quote.QuoteError) as e:
        quote.build_quote("pluto", "falcon-9")
    assert e.value.status == 400


def test_unknown_rocket_raises():
    with pytest.raises(quote.QuoteError) as e:
        quote.build_quote("mars", "bfg-9000")
    assert e.value.status == 400


# ---------------------------------------------------------------------------
# Full HTTP behavior.
# ---------------------------------------------------------------------------
def test_get_valid_quote_200(serve):
    with serve(quote.handler) as client:
        resp = client("GET", "/api/quote?destination=mars&rocket=falcon-9")
    assert resp.status == 200
    assert resp.headers.get("Access-Control-Allow-Origin") == "*"
    body = resp.json()
    assert body["destination"]["name"] == "Mars"
    assert body["total_dv_kms"] > 0


def test_post_json_valid_quote_200(serve):
    with serve(quote.handler) as client:
        resp = client(
            "POST", "/api/quote",
            data={"destination": "venus", "rocket": "falcon-9"},
        )
    assert resp.status == 200
    body = resp.json()
    assert body["destination"]["name"] == "Venus"
    assert body["next_window"] is not None  # interplanetary window


def test_get_invalid_destination_400(serve):
    with serve(quote.handler) as client:
        resp = client("GET", "/api/quote?destination=jupiter&rocket=falcon-9")
    assert resp.status == 400
    assert "error" in resp.json()


def test_get_missing_rocket_400(serve):
    with serve(quote.handler) as client:
        resp = client("GET", "/api/quote?destination=mars")
    assert resp.status == 400
    assert "error" in resp.json()


def test_options_preflight(serve):
    with serve(quote.handler) as client:
        resp = client("OPTIONS", "/api/quote")
    assert resp.status == 204
    assert resp.headers.get("Access-Control-Allow-Methods")
