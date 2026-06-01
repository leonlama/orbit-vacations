// Shapes mirror the Python API responses (/api/catalog, /api/quote).

export interface Destination {
  id: string
  name: string
  central_body: string
  description: string
}

export type PayloadBasis = 'demonstrated' | 'target' | 'published' | 'estimate'

export interface Rocket {
  id: string
  name: string
  payload_leo_kg: number
  payload_demonstrated: boolean
  payload_basis: PayloadBasis
  cost_usd: number | null
  notes: string
}

export interface Catalog {
  destinations: Destination[]
  rockets: Rocket[]
}

export interface QuoteRocket {
  name: string
  feasible: boolean
  deliverable_payload_kg: number | null
  payload_basis: 'published' | 'estimate'
  demonstrated: boolean
  total_cost_usd: number | null
  fare_cost_per_kg_usd: number | null
}

export interface Quote {
  destination: { id: string; name: string; central_body: string }
  total_dv_kms: number
  departure_burn_kms: number
  arrival_burn_kms: number
  transfer_time_days: number
  next_window: string | null
  next_window_note: string | null
  synodic_period_days: number | null
  rocket: QuoteRocket
  assumptions: string
}

export type Step =
  | 'hero'
  | 'destination'
  | 'rocket'
  | 'itinerary'
  | 'seats'
  | 'extras'
  | 'passenger'
  | 'checkout'
  | 'confirmation'

// ---- Booking selections ------------------------------------------------

export type SeatType = 'standard' | 'window' | 'cupola'

export interface SeatDef {
  id: string // e.g. "3A" or "P1"
  row: number
  col: string
  type: SeatType
  occupied: boolean
}

export interface ExtrasState {
  cryo: boolean
  radiation: boolean
  baggageKg: number
  habitat: string | null // habitat tier id
  roundTrip: boolean
}

export interface Passenger {
  name: string
  email: string
}

// ---- Fare breakdown ----------------------------------------------------

export interface FareLine {
  id: string
  label: string
  detail?: string
  amount: number // per-leg unit amount (USD)
  perLeg: boolean // doubled when round-trip
}

export interface FareBreakdown {
  lines: FareLine[]
  legs: number // 1 (one-way) or 2 (round-trip)
  total: number
  baseFareEstimated: boolean // true when the engine had no published $/kg
}
