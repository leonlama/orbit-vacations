"""Tests for the rocket model and trip-feasibility / fare logic."""

import pytest

from orbital import rockets


def test_catalog_has_all_rockets():
    for name in ("falcon 9", "saturn v", "delta iv heavy", "starship"):
        assert name in rockets.ROCKETS


def test_published_payload_figures():
    assert rockets.FALCON_9.payloads["leo"] == 22800
    assert rockets.FALCON_9.payloads["mars"] == 4020
    assert rockets.SATURN_V.payloads["leo"] == 140000
    assert rockets.SATURN_V.payloads["tli"] == 43500
    assert rockets.DELTA_IV_HEAVY.payloads["leo"] == 28790
    assert rockets.STARSHIP.payloads["leo"] == 100000


def test_starship_labeled_not_demonstrated():
    assert rockets.STARSHIP.demonstrated is False
    assert "target" in rockets.STARSHIP.notes.lower()


def test_demonstrated_rockets_flagged_true():
    for r in (rockets.FALCON_9, rockets.SATURN_V, rockets.DELTA_IV_HEAVY):
        assert r.demonstrated is True


def test_get_rocket_case_insensitive():
    assert rockets.get_rocket("FALCON 9") is rockets.FALCON_9


def test_get_rocket_unknown_raises():
    with pytest.raises(ValueError):
        rockets.get_rocket("BFG 9000")


def test_falcon9_to_mars_uses_published_payload():
    result = rockets.trip_feasibility("mars", "Falcon 9")
    assert result["feasible"] is True
    assert result["payload_kg"] == 4020
    assert result["payload_source"] == "published"
    # Fare = $74M / 4020 kg.
    assert result["fare_usd_per_kg"] == pytest.approx(74_000_000 / 4020)


def test_saturn_v_to_moon_uses_published_tli():
    result = rockets.trip_feasibility("moon", "Saturn V")
    assert result["feasible"] is True
    assert result["payload_kg"] == 43500
    assert result["payload_source"] == "published"
    assert result["fare_usd_per_kg"] == pytest.approx(185_000_000 / 43500)


def test_delta_iv_to_mars_is_estimated():
    # No published Mars figure for Delta IV Heavy -> estimate from LEO.
    result = rockets.trip_feasibility("mars", "Delta IV Heavy")
    assert result["payload_source"] == "estimate"
    assert result["feasible"] is True
    assert result["payload_kg"] > 0
    assert "estimate" in result["notes"].lower()


def test_starship_fare_unavailable_but_feasible():
    result = rockets.trip_feasibility("mars", "Starship")
    assert result["feasible"] is True
    assert result["cost_usd"] is None
    assert result["fare_usd_per_kg"] is None
    assert "design target" in result["notes"].lower()


def test_trip_includes_transfer_summary():
    result = rockets.trip_feasibility("mars", "Falcon 9")
    assert "transfer" in result
    assert result["transfer"]["total_dv_kmps"] > 0


def test_venus_estimate_for_falcon9():
    # No Venus key; falls back to the Mars-class published figure.
    result = rockets.trip_feasibility("venus", "Falcon 9")
    assert result["feasible"] is True
    assert result["payload_kg"] > 0


def test_all_fares_positive_when_available():
    for rocket_name in ("Falcon 9", "Saturn V", "Delta IV Heavy"):
        for dest in ("mars", "venus", "moon"):
            result = rockets.trip_feasibility(dest, rocket_name)
            if result["fare_usd_per_kg"] is not None:
                assert result["fare_usd_per_kg"] > 0
