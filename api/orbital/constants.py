"""Physical constants and unit helpers for the orbital-mechanics engine.

All quantities are stored in SI base units: meters (m), seconds (s),
and kilograms (kg).  Helper functions are provided to convert derived
results into the units astrodynamics tables conventionally use
(km/s for delta-v, days for durations).

Sources for the gravitational parameters and astronomical unit are the
IAU / JPL published values (mu = G*M):
    mu_sun   = 1.32712440018e20  m^3/s^2   (heliocentric)
    mu_earth = 3.986004418e14    m^3/s^2   (geocentric)
    AU       = 1.495978707e11    m         (IAU 2012 definition)
"""

import math

# ---------------------------------------------------------------------------
# Gravitational parameters (standard gravitational parameter mu = G * M).
# Units: m^3 / s^2.
# ---------------------------------------------------------------------------
MU_SUN = 1.32712440018e20
MU_EARTH = 3.986004418e14

# Astronomical unit, meters (IAU 2012 exact definition).
AU = 1.495978707e11

# ---------------------------------------------------------------------------
# Time unit conversions.
# ---------------------------------------------------------------------------
SECONDS_PER_DAY = 86400.0

# ---------------------------------------------------------------------------
# Orbital radii and periods of the bodies we model.
#
# Heliocentric orbits use semi-major axes in AU (converted to meters here)
# and sidereal orbital periods in days (published values).  We treat the
# planetary orbits as circular and coplanar for the idealized Hohmann
# analysis (see hohmann.py for the full statement of assumptions).
# ---------------------------------------------------------------------------

# Earth (heliocentric reference orbit).
EARTH_ORBIT_RADIUS = 1.000 * AU          # m
EARTH_PERIOD_DAYS = 365.25               # d (sidereal ~365.256; using 365.25)

# Mars (heliocentric).
MARS_ORBIT_RADIUS = 1.524 * AU           # m
MARS_PERIOD_DAYS = 686.98                # d

# Venus (heliocentric).
VENUS_ORBIT_RADIUS = 0.723 * AU          # m
VENUS_PERIOD_DAYS = 224.70               # d

# Moon (geocentric).  Mean orbital radius; uses MU_EARTH as the central body.
MOON_ORBIT_RADIUS = 384400.0e3           # m  (384,400 km)

# Low Earth Orbit: Earth's mean equatorial radius + 400 km altitude.
EARTH_RADIUS = 6378.0e3                  # m  (equatorial)
LEO_ALTITUDE = 400.0e3                   # m
LEO_RADIUS = EARTH_RADIUS + LEO_ALTITUDE  # m  (6,778 km)

# Base epoch for launch-window calculations: 2026-06-01 (ISO date).
BASE_EPOCH = "2026-06-01"


# ---------------------------------------------------------------------------
# Unit-conversion helpers.
# ---------------------------------------------------------------------------
def mps_to_kmps(v_mps):
    """Convert a speed in meters/second to kilometers/second."""
    return v_mps / 1000.0


def seconds_to_days(t_seconds):
    """Convert a duration in seconds to days."""
    return t_seconds / SECONDS_PER_DAY


def days_to_seconds(t_days):
    """Convert a duration in days to seconds."""
    return t_days * SECONDS_PER_DAY


def au_to_m(value_au):
    """Convert a distance in astronomical units to meters."""
    return value_au * AU


def m_to_au(value_m):
    """Convert a distance in meters to astronomical units."""
    return value_m / AU


def circular_orbit_period(radius_m, mu):
    """Period (seconds) of a circular orbit of given radius about a body.

    T = 2*pi*sqrt(r^3 / mu)
    """
    return 2.0 * math.pi * math.sqrt(radius_m ** 3 / mu)
