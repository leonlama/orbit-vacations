"""Launch-vehicle data and trip-feasibility / fare modeling.

Payload and cost figures are stored as data.  Each figure is annotated in
the comments as *published* (vendor/agency stated capability) or *target*
(design goal not yet demonstrated in flight).  Numbers are approximate and
intended for back-of-the-envelope mission planning, not procurement.

Sources (approximate, rounded as commonly published):
  - Falcon 9 (SpaceX, expendable/reusable):
        ~22,800 kg to LEO        (published)
        ~4,020 kg to Mars        (published trans-Mars capability)
        ~$67-74M / launch        (published list price; using $74M)
  - Saturn V (NASA, historical):
        ~140,000 kg to LEO       (published)
        ~43,500 kg to TLI        (published trans-lunar injection)
        ~$185M / launch          (period-cost figure, not inflation-adjusted)
  - Delta IV Heavy (ULA):
        ~28,790 kg to LEO        (published)
        ~$164M / launch          (published)
  - Starship (SpaceX):
        ~100,000 kg to LEO       (DESIGN TARGET — NOT yet demonstrated)
        cost not used for fares (no reliable published per-launch price)
"""

from . import hohmann


class Rocket:
    """A launch vehicle with payload capacities to named destinations.

    payloads : dict mapping a capacity key -> kg.  Recognized keys:
        "leo"  : low Earth orbit
        "mars" : trans-Mars injection capability
        "tli"  : trans-lunar injection capability (used for the Moon)
    cost_usd : per-launch cost in US dollars, or None if not modeled.
    demonstrated : False if the headline payload is a design target that has
        not yet flown (e.g. Starship); True for flight-proven vehicles.
    """

    def __init__(self, name, payloads, cost_usd, demonstrated=True, notes="",
                 id=None):
        self.name = name
        self.payloads = payloads
        self.cost_usd = cost_usd
        self.demonstrated = demonstrated
        self.notes = notes
        # Stable, URL-safe identifier (e.g. "falcon-9") used by the API layer.
        self.id = id if id is not None else name.lower().replace(" ", "-")

    def __repr__(self):
        return f"Rocket({self.name!r})"


# ---------------------------------------------------------------------------
# Rocket catalog.  All payloads in kg, costs in USD.
# ---------------------------------------------------------------------------
FALCON_9 = Rocket(
    name="Falcon 9",
    payloads={
        "leo": 22800,    # published
        "mars": 4020,    # published trans-Mars capability
    },
    cost_usd=74_000_000,  # published list price (~$67-74M); using $74M
    demonstrated=True,
    notes="SpaceX. Figures published.",
)

SATURN_V = Rocket(
    name="Saturn V",
    payloads={
        "leo": 140000,   # published
        "tli": 43500,    # published trans-lunar injection
    },
    cost_usd=185_000_000,  # period per-launch figure (not inflation-adjusted)
    demonstrated=True,
    notes="NASA, historical. Figures published.",
)

DELTA_IV_HEAVY = Rocket(
    name="Delta IV Heavy",
    payloads={
        "leo": 28790,    # published
    },
    cost_usd=164_000_000,  # published
    demonstrated=True,
    notes="ULA. Figures published.",
)

STARSHIP = Rocket(
    name="Starship",
    payloads={
        "leo": 100000,   # DESIGN TARGET — NOT yet demonstrated
    },
    cost_usd=None,  # no reliable published per-launch price
    demonstrated=False,
    notes="SpaceX. DESIGN TARGET ~100 t to LEO — NOT yet flight-demonstrated.",
)

ROCKETS = {
    "falcon 9": FALCON_9,
    "saturn v": SATURN_V,
    "delta iv heavy": DELTA_IV_HEAVY,
    "starship": STARSHIP,
}


# Secondary index by URL-safe id (e.g. "falcon-9") so callers may use either
# the spaced display name or the slug id.
ROCKETS_BY_ID = {r.id: r for r in ROCKETS.values()}


def get_rocket(name):
    """Look up a rocket by display name or id (both case-insensitive).

    Accepts e.g. "Falcon 9", "falcon 9", or "falcon-9".
    """
    key = name.strip().lower()
    if key in ROCKETS:
        return ROCKETS[key]
    if key in ROCKETS_BY_ID:
        return ROCKETS_BY_ID[key]
    raise ValueError(
        f"Unknown rocket {name!r}; choose from {sorted(ROCKETS_BY_ID)}"
    )


# Which published payload capacity key best matches each destination, and
# a fallback ratio used to *estimate* a deliverable payload from the LEO
# figure when no destination-specific number is published.  The ratio is a
# clearly-labeled rough estimate (LEO capacity scaled down for the energy
# of the escape/transfer), not a measured value.
_DESTINATION_PAYLOAD_KEY = {
    "mars": "mars",
    "venus": "mars",   # no published Venus figure; Venus injection energy is
                       # similar order to Mars, so we reuse the Mars-class key
                       # or estimate from LEO (see below).
    "moon": "tli",
}

# Rough LEO-fraction estimates when a destination-specific payload is not
# published for a given rocket.  CLEARLY an estimate.
_ESTIMATE_LEO_FRACTION = {
    "mars": 0.18,   # ~ trans-Mars payload tends to be ~15-20% of LEO mass
    "venus": 0.20,  # ~ trans-Venus is a touch easier than Mars
    "moon": 0.30,   # ~ trans-lunar injection is ~25-35% of LEO mass
}


def deliverable_payload(rocket, destination):
    """Estimate the deliverable payload (kg) for a rocket to a destination.

    Returns a tuple (payload_kg, source) where source is one of:
        "published" - a vendor/agency-stated destination capability was used
        "estimate"  - derived by scaling the published LEO figure (rough)

    Returns (None, "none") if the rocket has no usable capacity figure.
    """
    dest = destination.strip().lower()
    key = _DESTINATION_PAYLOAD_KEY.get(dest)

    # Prefer a published destination-specific figure.
    if key is not None and key in rocket.payloads:
        return rocket.payloads[key], "published"

    # Otherwise estimate from the published LEO capacity.
    if "leo" in rocket.payloads:
        fraction = _ESTIMATE_LEO_FRACTION.get(dest, 0.2)
        return rocket.payloads["leo"] * fraction, "estimate"

    return None, "none"


def trip_feasibility(destination, rocket_name, base_epoch=None):
    """Assess whether a rocket can serve a destination, with payload and fare.

    Parameters
    ----------
    destination : "mars", "venus", or "moon" (case-insensitive).
    rocket_name : a key into ROCKETS (case-insensitive).
    base_epoch : optional ISO date for the launch window.

    Returns
    -------
    dict with:
        destination, rocket            - echoed names
        feasible                       - bool (can deliver positive payload)
        payload_kg                     - deliverable payload (kg) or None
        payload_source                 - "published" | "estimate" | "none"
        demonstrated                   - bool, False if payload is a target
        cost_usd                       - per-launch cost or None
        fare_usd_per_kg                - cost / payload, or None
        transfer                       - the Hohmann transfer summary dict
        notes                          - caveats string
    """
    rocket = get_rocket(rocket_name)
    transfer = hohmann.get_transfer(destination, base_epoch)

    payload_kg, source = deliverable_payload(rocket, destination)
    feasible = payload_kg is not None and payload_kg > 0

    fare = None
    if feasible and rocket.cost_usd is not None and payload_kg > 0:
        fare = rocket.cost_usd / payload_kg

    notes = []
    if not rocket.demonstrated:
        notes.append(
            f"{rocket.name} headline payload is a DESIGN TARGET, "
            "not yet flight-demonstrated."
        )
    if source == "estimate":
        notes.append(
            "Deliverable payload is a ROUGH ESTIMATE scaled from the "
            "published LEO capacity (no destination-specific figure published)."
        )
    if rocket.cost_usd is None:
        notes.append("No reliable per-launch cost published; fare unavailable.")

    return {
        "destination": destination,
        "rocket": rocket.name,
        "feasible": feasible,
        "payload_kg": payload_kg,
        "payload_source": source,
        "demonstrated": rocket.demonstrated,
        "cost_usd": rocket.cost_usd,
        "fare_usd_per_kg": fare,
        "transfer": transfer,
        "notes": " ".join(notes),
    }
