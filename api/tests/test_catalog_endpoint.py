"""Tests for the /api/catalog endpoint."""

import catalog


def test_build_catalog_shape():
    cat = catalog.build_catalog()
    assert set(cat) == {"destinations", "rockets"}

    dest_ids = {d["id"] for d in cat["destinations"]}
    assert dest_ids == {"mars", "venus", "moon"}
    for d in cat["destinations"]:
        assert set(d) >= {"id", "name", "central_body", "description"}

    # Central bodies are correct: planets orbit the Sun, the Moon orbits Earth.
    by_id = {d["id"]: d for d in cat["destinations"]}
    assert by_id["mars"]["central_body"] == "Sun"
    assert by_id["venus"]["central_body"] == "Sun"
    assert by_id["moon"]["central_body"] == "Earth"


def test_catalog_rockets_have_expected_keys():
    cat = catalog.build_catalog()
    rocket_ids = {r["id"] for r in cat["rockets"]}
    assert {"falcon-9", "saturn-v", "delta-iv-heavy", "starship"} <= rocket_ids
    for r in cat["rockets"]:
        assert set(r) >= {
            "id", "name", "payload_leo_kg", "cost_usd", "notes",
        }
        assert r["payload_leo_kg"] > 0


def test_starship_payload_flagged_as_target():
    cat = catalog.build_catalog()
    starship = next(r for r in cat["rockets"] if r["id"] == "starship")
    assert starship["payload_demonstrated"] is False
    assert starship["payload_basis"] == "target"
    assert "target" in starship["notes"].lower()


def test_demonstrated_rockets_flagged():
    cat = catalog.build_catalog()
    falcon = next(r for r in cat["rockets"] if r["id"] == "falcon-9")
    assert falcon["payload_demonstrated"] is True
    assert falcon["payload_basis"] == "demonstrated"


def test_get_returns_200_json_with_cors(serve):
    with serve(catalog.handler) as client:
        resp = client("GET", "/api/catalog")
    assert resp.status == 200
    assert resp.headers.get("Access-Control-Allow-Origin") == "*"
    body = resp.json()
    assert "destinations" in body and "rockets" in body


def test_options_preflight(serve):
    with serve(catalog.handler) as client:
        resp = client("OPTIONS", "/api/catalog")
    assert resp.status == 204
    assert resp.headers.get("Access-Control-Allow-Origin") == "*"
