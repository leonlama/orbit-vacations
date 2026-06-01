"""Idealized coplanar Hohmann-transfer calculations.

MODELING ASSUMPTIONS (important — read before trusting any number):
---------------------------------------------------------------------------
This engine models an *idealized* two-impulse Hohmann transfer and makes
the following simplifying assumptions:

  1. Coplanar orbits.  Departure and destination orbits lie in the same
     plane, so no plane-change (inclination) delta-v is included.  Real
     Mars/Venus/Moon transfers require plane changes that add delta-v.
  2. Circular orbits.  Both the starting and target orbits are treated as
     perfect circles at the radii in constants.py (real planetary orbits
     are eccentric — Mars notably so).
  3. Two-body patched math only.  Each leg is a pure two-body problem about
     a single central mass.  We do NOT model the patched-conic hyperbolic
     escape/capture phases, gravity losses, or the gravity of the departure
     and arrival bodies during the heliocentric legs.  As a result the
     heliocentric delta-v figures are the classic "textbook" Hohmann values
     (e.g. Earth->Mars ~5.6 km/s), not the larger real mission budgets.
  4. Impulsive burns.  Burns are instantaneous; no finite-burn or
     gravity-loss penalty is applied.
  5. Instantaneous, idealized launch windows.  The launch-window date is
     advanced by exactly one synodic period from the base epoch; real
     windows depend on true anomalies and phase angles.

These assumptions make the results match standard astrodynamics textbook
values to within a few percent, which is the intended use here.

CORE EQUATIONS:
  vis-viva:                 v = sqrt(mu * (2/r - 1/a))
  transfer semi-major axis: a = (r1 + r2) / 2
  departure burn:           dv1 = sqrt(mu/r1) * (sqrt(2*r2/(r1+r2)) - 1)
  arrival burn:             dv2 = sqrt(mu/r2) * (1 - sqrt(2*r1/(r1+r2)))
  total delta-v:            dv  = |dv1| + |dv2|
  transfer time (half      t   = pi * sqrt(a^3 / mu)
    ellipse period):
  synodic period:           T_syn = T1*T2 / |T1 - T2|
"""

import math
from datetime import date, timedelta

from . import constants


def vis_viva(mu, r, a):
    """Orbital speed (m/s) from the vis-viva equation.

    v = sqrt(mu * (2/r - 1/a))

    mu : standard gravitational parameter of the central body (m^3/s^2)
    r  : current radius from the central body (m)
    a  : semi-major axis of the orbit (m)
    """
    return math.sqrt(mu * (2.0 / r - 1.0 / a))


def circular_speed(mu, r):
    """Speed (m/s) of a circular orbit of radius r:  v = sqrt(mu / r)."""
    return math.sqrt(mu / r)


def transfer_semi_major_axis(r1, r2):
    """Semi-major axis (m) of the Hohmann transfer ellipse: a = (r1 + r2)/2."""
    return (r1 + r2) / 2.0


def departure_burn(mu, r1, r2):
    """Delta-v (m/s) of the departure (periapsis-raising) burn.

    dv1 = sqrt(mu/r1) * (sqrt(2*r2/(r1+r2)) - 1)
    """
    return math.sqrt(mu / r1) * (math.sqrt(2.0 * r2 / (r1 + r2)) - 1.0)


def arrival_burn(mu, r1, r2):
    """Delta-v (m/s) of the arrival (circularization) burn.

    dv2 = sqrt(mu/r2) * (1 - sqrt(2*r1/(r1+r2)))
    """
    return math.sqrt(mu / r2) * (1.0 - math.sqrt(2.0 * r1 / (r1 + r2)))


def transfer_time(mu, r1, r2):
    """Time (seconds) for the transfer: half the period of the transfer ellipse.

    t = pi * sqrt(a^3 / mu),  with a = (r1 + r2)/2
    """
    a = transfer_semi_major_axis(r1, r2)
    return math.pi * math.sqrt(a ** 3 / mu)


def synodic_period_days(period1_days, period2_days):
    """Synodic period (days) between two orbits given their periods.

    T_syn = T1 * T2 / |T1 - T2|

    This is the cadence at which the same relative geometry (and hence the
    same launch window) recurs.
    """
    return (period1_days * period2_days) / abs(period1_days - period2_days)


def next_launch_window(synodic_days, base_epoch=None):
    """Return the next idealized launch-window date.

    Advances one synodic period from the base epoch.  See the module-level
    assumptions: this is an idealized cadence, not a true ephemeris-derived
    window.
    """
    if base_epoch is None:
        base_epoch = constants.BASE_EPOCH
    epoch = date.fromisoformat(base_epoch)
    return epoch + timedelta(days=synodic_days)


def hohmann_transfer(mu, r1, r2, period1_days, period2_days, base_epoch=None):
    """Compute a full idealized Hohmann transfer summary.

    Parameters
    ----------
    mu : float
        Standard gravitational parameter of the central body (m^3/s^2).
    r1 : float
        Radius of the departure (starting) orbit (m).
    r2 : float
        Radius of the destination orbit (m).
    period1_days, period2_days : float
        Orbital periods of the two orbits (days), used for the synodic
        period and launch-window cadence.
    base_epoch : str, optional
        ISO date string for the launch-window base epoch.

    Returns
    -------
    dict with SI values plus convenience-unit fields:
        dv1_mps, dv2_mps, total_dv_mps        - delta-v in m/s
        dv1_kmps, dv2_kmps, total_dv_kmps     - delta-v in km/s
        transfer_time_s, transfer_time_days   - transfer duration
        synodic_period_days                   - launch-window cadence
        next_launch_window                    - datetime.date
    """
    dv1 = departure_burn(mu, r1, r2)
    dv2 = arrival_burn(mu, r1, r2)
    # Magnitudes: dv2 is negative when r2 > r1 (the arrival burn slows the
    # craft down relative to circular at r2 only in sign convention); the
    # propellant cost is the magnitude of each burn.
    total_dv = abs(dv1) + abs(dv2)

    t_s = transfer_time(mu, r1, r2)
    t_syn = synodic_period_days(period1_days, period2_days)

    return {
        "dv1_mps": abs(dv1),
        "dv2_mps": abs(dv2),
        "total_dv_mps": total_dv,
        "dv1_kmps": constants.mps_to_kmps(abs(dv1)),
        "dv2_kmps": constants.mps_to_kmps(abs(dv2)),
        "total_dv_kmps": constants.mps_to_kmps(total_dv),
        "transfer_time_s": t_s,
        "transfer_time_days": constants.seconds_to_days(t_s),
        "synodic_period_days": t_syn,
        "next_launch_window": next_launch_window(t_syn, base_epoch),
    }


# ---------------------------------------------------------------------------
# Pre-configured destinations.
# ---------------------------------------------------------------------------
def transfer_to_mars(base_epoch=None):
    """Heliocentric Earth->Mars Hohmann transfer (idealized, coplanar)."""
    return hohmann_transfer(
        constants.MU_SUN,
        constants.EARTH_ORBIT_RADIUS,
        constants.MARS_ORBIT_RADIUS,
        constants.EARTH_PERIOD_DAYS,
        constants.MARS_PERIOD_DAYS,
        base_epoch,
    )


def transfer_to_venus(base_epoch=None):
    """Heliocentric Earth->Venus Hohmann transfer (idealized, coplanar).

    Venus is an inferior planet (r2 < r1), so the departure burn lowers the
    orbit; the equations and magnitudes handle this sign automatically.
    """
    return hohmann_transfer(
        constants.MU_SUN,
        constants.EARTH_ORBIT_RADIUS,
        constants.VENUS_ORBIT_RADIUS,
        constants.EARTH_PERIOD_DAYS,
        constants.VENUS_PERIOD_DAYS,
        base_epoch,
    )


def transfer_to_moon(base_epoch=None):
    """Geocentric LEO->Moon Hohmann transfer (idealized, coplanar).

    Central body is Earth (MU_EARTH).  The departure burn from LEO is the
    classic trans-lunar injection (TLI) burn (~3.1 km/s).
    """
    # LEO period and Moon period about the Earth (sidereal-ish), in days.
    leo_period_days = constants.seconds_to_days(
        constants.circular_orbit_period(constants.LEO_RADIUS, constants.MU_EARTH)
    )
    moon_period_days = constants.seconds_to_days(
        constants.circular_orbit_period(constants.MOON_ORBIT_RADIUS, constants.MU_EARTH)
    )
    return hohmann_transfer(
        constants.MU_EARTH,
        constants.LEO_RADIUS,
        constants.MOON_ORBIT_RADIUS,
        leo_period_days,
        moon_period_days,
        base_epoch,
    )


# Registry of modeled destinations, keyed by lowercase name.
DESTINATIONS = {
    "mars": transfer_to_mars,
    "venus": transfer_to_venus,
    "moon": transfer_to_moon,
}


def get_transfer(destination, base_epoch=None):
    """Look up and compute the transfer for a named destination.

    destination : one of "mars", "venus", "moon" (case-insensitive).
    """
    key = destination.strip().lower()
    if key not in DESTINATIONS:
        raise ValueError(
            f"Unknown destination {destination!r}; "
            f"choose from {sorted(DESTINATIONS)}"
        )
    return DESTINATIONS[key](base_epoch)
