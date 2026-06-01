"""Tests for the Hohmann-transfer engine.

Reference values are textbook idealized-Hohmann figures; assertions use a
~5% relative tolerance to accommodate the coplanar/circular idealization.
"""

from datetime import date

import pytest

from orbital import constants, hohmann

TOL = 0.05  # 5% relative tolerance


def test_earth_heliocentric_circular_speed():
    # Earth's mean orbital speed ~29.78 km/s.
    v = hohmann.circular_speed(constants.MU_SUN, constants.EARTH_ORBIT_RADIUS)
    assert v / 1000.0 == pytest.approx(29.78, rel=TOL)


def test_vis_viva_reduces_to_circular_speed():
    # For a circular orbit a == r, so vis-viva v == sqrt(mu/r).
    r = constants.EARTH_ORBIT_RADIUS
    assert hohmann.vis_viva(constants.MU_SUN, r, r) == pytest.approx(
        hohmann.circular_speed(constants.MU_SUN, r)
    )


def test_transfer_semi_major_axis():
    a = hohmann.transfer_semi_major_axis(2.0, 4.0)
    assert a == 3.0


def test_earth_to_mars_total_dv():
    t = hohmann.transfer_to_mars()
    # Textbook Earth->Mars heliocentric Hohmann total dv ~5.6 km/s.
    assert t["total_dv_kmps"] == pytest.approx(5.6, rel=TOL)


def test_earth_to_mars_transfer_time():
    t = hohmann.transfer_to_mars()
    # ~259 days.
    assert t["transfer_time_days"] == pytest.approx(259.0, rel=TOL)


def test_earth_mars_synodic_period():
    t = hohmann.transfer_to_mars()
    # ~779.9 days.
    assert t["synodic_period_days"] == pytest.approx(779.9, rel=TOL)


def test_earth_mars_both_burns_positive():
    t = hohmann.transfer_to_mars()
    assert t["dv1_mps"] > 0
    assert t["dv2_mps"] > 0
    assert t["total_dv_mps"] == pytest.approx(t["dv1_mps"] + t["dv2_mps"])


def test_venus_transfer_all_dv_positive():
    t = hohmann.transfer_to_venus()
    assert t["dv1_mps"] > 0
    assert t["dv2_mps"] > 0
    assert t["total_dv_kmps"] > 0


def test_venus_synodic_period():
    t = hohmann.transfer_to_venus()
    # Earth-Venus synodic period ~583.9 days.
    assert t["synodic_period_days"] == pytest.approx(583.9, rel=TOL)


def test_moon_tli_dv_in_expected_range():
    t = hohmann.transfer_to_moon()
    # The LEO departure burn is the trans-lunar injection (~3.1 km/s).
    assert 3.0 <= t["dv1_kmps"] <= 3.2


def test_moon_all_dv_positive():
    t = hohmann.transfer_to_moon()
    assert t["dv1_mps"] > 0
    assert t["dv2_mps"] > 0
    assert t["total_dv_mps"] > 0


def test_synodic_period_formula():
    # T_syn = T1*T2/|T1-T2|.
    assert hohmann.synodic_period_days(365.25, 686.98) == pytest.approx(779.9, rel=TOL)


def test_next_launch_window_advances_one_synodic_period():
    t = hohmann.transfer_to_mars()
    epoch = date.fromisoformat(constants.BASE_EPOCH)
    delta_days = (t["next_launch_window"] - epoch).days
    # Should be roughly one synodic period after the base epoch.
    assert delta_days == pytest.approx(t["synodic_period_days"], abs=1.0)
    assert t["next_launch_window"] > epoch


def test_all_destinations_have_positive_total_dv():
    for dest in ("mars", "venus", "moon"):
        t = hohmann.get_transfer(dest)
        assert t["total_dv_mps"] > 0, dest


def test_unknown_destination_raises():
    with pytest.raises(ValueError):
        hohmann.get_transfer("pluto")
