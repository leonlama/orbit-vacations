// ---------------------------------------------------------------------------
// Single source of truth for all booking pricing + the cabin layout.
// Everything here is a tunable constant; the UI only reads from this module.
//
// The "base fare" is grounded in the engine's real economics: it is the
// per-passenger share of launch cost, i.e. the rocket's cost-per-kg delivered
// times a passenger allowance. When the rocket has no published cost (e.g.
// Starship), we fall back to a clearly-labeled demo rate.
// ---------------------------------------------------------------------------

import type {
  ExtrasState,
  FareBreakdown,
  FareLine,
  Quote,
  SeatDef,
  SeatType,
} from '../types'

// Mass (kg) a single passenger ticket buys: body + suit + basic life support.
export const PASSENGER_ALLOWANCE_KG = 100

// Used only when the rocket has no published $/kg (keeps the demo bookable).
export const FALLBACK_FARE_PER_KG = 24_000
export const FALLBACK_BASE_FARE = PASSENGER_ALLOWANCE_KG * FALLBACK_FARE_PER_KG

// Seat upcharges (USD), added on top of the base fare.
export const SEAT_UPCHARGE: Record<SeatType, number> = {
  standard: 0,
  window: 85_000,
  cupola: 320_000,
}

export const SEAT_TYPE_LABEL: Record<SeatType, string> = {
  standard: 'Standard cabin',
  window: 'Window',
  cupola: 'Cupola observation pod',
}

// ---- Add-ons / extras -----------------------------------------------------

export const CRYO_SLEEP_PRICE = 480_000
export const RADIATION_PRICE = 60_000

export interface BaggageTier {
  kg: number
  label: string
}
// Extra baggage is literally extra payload allowance — its price is the
// rocket's marginal $/kg (so it scales with the chosen vehicle/destination).
export const BAGGAGE_TIERS: BaggageTier[] = [
  { kg: 0, label: 'Carry-on only' },
  { kg: 25, label: '+25 kg' },
  { kg: 50, label: '+50 kg' },
  { kg: 100, label: '+100 kg' },
]

export interface HabitatTier {
  id: string
  name: string
  blurb: string
  price: number
}
// Destination "habitat" stay — booked once (not per leg).
export const HABITAT_TIERS: HabitatTier[] = [
  {
    id: 'pod',
    name: 'Orbital sleep pod',
    blurb: 'A cozy berth with a porthole and recycled-air ambience.',
    price: 38_000,
  },
  {
    id: 'dome',
    name: 'Surface dome suite',
    blurb: 'Pressurized regolith-brick dome, two rooms, panoramic visor.',
    price: 145_000,
  },
  {
    id: 'villa',
    name: 'Panorama villa',
    blurb: 'Cliffside villa, private airlock, and a guided EVA package.',
    price: 420_000,
  },
]

export function habitatById(id: string | null): HabitatTier | null {
  if (!id) return null
  return HABITAT_TIERS.find((h) => h.id === id) ?? null
}

// ---- Fare math ------------------------------------------------------------

export function farePerKg(quote: Quote): number {
  return quote.rocket.fare_cost_per_kg_usd ?? FALLBACK_FARE_PER_KG
}

export function baseFare(quote: Quote): number {
  return Math.round(farePerKg(quote) * PASSENGER_ALLOWANCE_KG)
}

export function baggagePrice(quote: Quote, kg: number): number {
  return Math.round(farePerKg(quote) * kg)
}

/**
 * Build the full fare breakdown from the engine quote + the traveler's
 * selections. Per-leg items (the flight itself, seat, cryo, radiation,
 * baggage) double on a round-trip; the destination habitat stay does not.
 */
export function computeBreakdown(
  quote: Quote,
  seat: SeatDef | null,
  extras: ExtrasState,
): FareBreakdown {
  const legs = extras.roundTrip ? 2 : 1
  const lines: FareLine[] = []

  lines.push({
    id: 'base',
    label: 'Base fare',
    detail: `${PASSENGER_ALLOWANCE_KG} kg allowance @ ${
      quote.rocket.fare_cost_per_kg_usd !== null
        ? `$${Math.round(farePerKg(quote)).toLocaleString('en-US')}/kg`
        : 'demo rate'
    }`,
    amount: baseFare(quote),
    perLeg: true,
  })

  if (seat && SEAT_UPCHARGE[seat.type] > 0) {
    lines.push({
      id: 'seat',
      label: `${SEAT_TYPE_LABEL[seat.type]} seat`,
      detail: `Seat ${seat.id}`,
      amount: SEAT_UPCHARGE[seat.type],
      perLeg: true,
    })
  }

  if (extras.cryo) {
    lines.push({
      id: 'cryo',
      label: 'Cryo-sleep pod',
      detail: `Skip the ${Math.round(quote.transfer_time_days)}-day journey`,
      amount: CRYO_SLEEP_PRICE,
      perLeg: true,
    })
  }

  if (extras.radiation) {
    lines.push({
      id: 'radiation',
      label: 'Radiation insurance',
      detail: 'Cosmic-ray & solar-event coverage',
      amount: RADIATION_PRICE,
      perLeg: true,
    })
  }

  if (extras.baggageKg > 0) {
    lines.push({
      id: 'baggage',
      label: 'Extra baggage',
      detail: `+${extras.baggageKg} kg payload allowance`,
      amount: baggagePrice(quote, extras.baggageKg),
      perLeg: true,
    })
  }

  const habitat = habitatById(extras.habitat)
  if (habitat) {
    lines.push({
      id: 'habitat',
      label: `Habitat — ${habitat.name}`,
      detail: 'Destination stay (booked once)',
      amount: habitat.price,
      perLeg: false,
    })
  }

  const total = lines.reduce(
    (sum, l) => sum + l.amount * (l.perLeg ? legs : 1),
    0,
  )

  return {
    lines,
    legs,
    total,
    baseFareEstimated: quote.rocket.fare_cost_per_kg_usd === null,
  }
}

// ---- Cabin layout ---------------------------------------------------------

// Front observation deck (cupola pods) + a standard cabin. Window seats are
// the outer columns. A fixed set of seats is pre-booked for realism.
const OCCUPIED = new Set(['P2', '2A', '3C', '4D', '6B', '5A'])
export const CABIN_COLUMNS = ['A', 'B', 'C', 'D'] // aisle sits between B and C
const CABIN_ROWS = 6
const CUPOLA_PODS = 3

export interface Cabin {
  cupola: SeatDef[]
  rows: SeatDef[][]
}

export function buildCabin(): Cabin {
  const cupola: SeatDef[] = Array.from({ length: CUPOLA_PODS }, (_, i) => {
    const id = `P${i + 1}`
    return { id, row: 0, col: id, type: 'cupola', occupied: OCCUPIED.has(id) }
  })

  const rows: SeatDef[][] = Array.from({ length: CABIN_ROWS }, (_, r) => {
    const row = r + 1
    return CABIN_COLUMNS.map((col) => {
      const id = `${row}${col}`
      const type: SeatType = col === 'A' || col === 'D' ? 'window' : 'standard'
      return { id, row, col, type, occupied: OCCUPIED.has(id) }
    })
  })

  return { cupola, rows }
}

// ---- Booking reference ----------------------------------------------------

// e.g. "OV-MARS-7K3Q" — deterministic format, random suffix.
export function makeBookingRef(destinationId: string): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let suffix = ''
  for (let i = 0; i < 5; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)]
  }
  return `OV-${destinationId.toUpperCase()}-${suffix}`
}
