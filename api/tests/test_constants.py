"""Tests for the constants module and its unit helpers."""

import math

from orbital import constants


def test_si_gravitational_parameters():
    assert constants.MU_SUN == 1.32712440018e20
    assert constants.MU_EARTH == 3.986004418e14
    assert constants.AU == 1.495978707e11


def test_leo_radius_is_earth_radius_plus_altitude():
    # 6378 km + 400 km = 6778 km.
    assert constants.LEO_RADIUS == 6778.0e3


def test_orbit_radii_in_au():
    assert math.isclose(constants.m_to_au(constants.EARTH_ORBIT_RADIUS), 1.000)
    assert math.isclose(constants.m_to_au(constants.MARS_ORBIT_RADIUS), 1.524)
    assert math.isclose(constants.m_to_au(constants.VENUS_ORBIT_RADIUS), 0.723)


def test_moon_orbit_radius_km():
    assert constants.MOON_ORBIT_RADIUS == 384400.0e3


def test_unit_conversions_roundtrip():
    assert math.isclose(constants.mps_to_kmps(29780.0), 29.78)
    assert math.isclose(constants.seconds_to_days(constants.days_to_seconds(259.0)), 259.0)
    assert math.isclose(constants.au_to_m(constants.m_to_au(1.234e11)), 1.234e11)


def test_circular_orbit_period_matches_earth_year():
    # Earth's heliocentric circular period should be close to 365.25 days.
    t_s = constants.circular_orbit_period(constants.EARTH_ORBIT_RADIUS, constants.MU_SUN)
    t_days = constants.seconds_to_days(t_s)
    assert math.isclose(t_days, 365.25, rel_tol=0.01)
