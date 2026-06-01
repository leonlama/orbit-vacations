import { describe, expect, it } from 'vitest'
import type { ExtrasState, Quote, SeatDef } from '../types'
import {
  CRYO_SLEEP_PRICE,
  FALLBACK_BASE_FARE,
  HABITAT_TIERS,
  PASSENGER_ALLOWANCE_KG,
  RADIATION_PRICE,
  SEAT_UPCHARGE,
  baggagePrice,
  baseFare,
  buildCabin,
  computeBreakdown,
  makeBookingRef,
} from './pricing'

// A minimal Mars/Falcon-9-shaped quote (published $/kg).
function makeQuote(farePerKg: number | null = 18408): Quote {
  return {
    destination: { id: 'mars', name: 'Mars', central_body: 'Sun' },
    total_dv_kms: 5.6,
    departure_burn_kms: 2.95,
    arrival_burn_kms: 2.65,
    transfer_time_days: 259,
    next_window: '2028-07-19',
    next_window_note: null,
    synodic_period_days: 779.9,
    rocket: {
      name: 'Falcon 9',
      feasible: true,
      deliverable_payload_kg: 4020,
      payload_basis: 'published',
      demonstrated: true,
      total_cost_usd: 74_000_000,
      fare_cost_per_kg_usd: farePerKg,
    },
    assumptions: 'idealized',
  }
}

const NO_EXTRAS: ExtrasState = {
  cryo: false,
  radiation: false,
  baggageKg: 0,
  habitat: null,
  roundTrip: false,
}

const windowSeat: SeatDef = { id: '3A', row: 3, col: 'A', type: 'window', occupied: false }

describe('base fare', () => {
  it('is cost-per-kg times the passenger allowance', () => {
    const q = makeQuote(18408)
    expect(baseFare(q)).toBe(Math.round(18408 * PASSENGER_ALLOWANCE_KG))
  })

  it('falls back to the demo base fare when $/kg is null', () => {
    const q = makeQuote(null)
    expect(baseFare(q)).toBe(FALLBACK_BASE_FARE)
  })
})

describe('computeBreakdown', () => {
  it('one-way with no extras is just the base fare', () => {
    const b = computeBreakdown(makeQuote(), null, NO_EXTRAS)
    expect(b.legs).toBe(1)
    expect(b.lines).toHaveLength(1)
    expect(b.total).toBe(baseFare(makeQuote()))
    expect(b.baseFareEstimated).toBe(false)
  })

  it('adds the seat upcharge for a window seat', () => {
    const q = makeQuote()
    const b = computeBreakdown(q, windowSeat, NO_EXTRAS)
    expect(b.total).toBe(baseFare(q) + SEAT_UPCHARGE.window)
  })

  it('does not charge for an included standard seat', () => {
    const q = makeQuote()
    const std: SeatDef = { id: '3B', row: 3, col: 'B', type: 'standard', occupied: false }
    const b = computeBreakdown(q, std, NO_EXTRAS)
    expect(b.lines.find((l) => l.id === 'seat')).toBeUndefined()
    expect(b.total).toBe(baseFare(q))
  })

  it('sums cryo, radiation and baggage extras', () => {
    const q = makeQuote()
    const extras: ExtrasState = { ...NO_EXTRAS, cryo: true, radiation: true, baggageKg: 25 }
    const b = computeBreakdown(q, null, extras)
    expect(b.total).toBe(
      baseFare(q) + CRYO_SLEEP_PRICE + RADIATION_PRICE + baggagePrice(q, 25),
    )
  })

  it('round-trip doubles per-leg items but not the habitat stay', () => {
    const q = makeQuote()
    const habitat = HABITAT_TIERS[0]
    const oneWay: ExtrasState = { ...NO_EXTRAS, cryo: true, habitat: habitat.id }
    const roundTrip: ExtrasState = { ...oneWay, roundTrip: true }

    const single = computeBreakdown(q, windowSeat, oneWay)
    const double = computeBreakdown(q, windowSeat, roundTrip)

    // Per-leg portion = base + seat + cryo; habitat is one-time.
    const perLeg = baseFare(q) + SEAT_UPCHARGE.window + CRYO_SLEEP_PRICE
    expect(single.total).toBe(perLeg + habitat.price)
    expect(double.total).toBe(perLeg * 2 + habitat.price)
    expect(double.legs).toBe(2)
  })

  it('flags an estimated base fare when the rocket has no published cost', () => {
    const b = computeBreakdown(makeQuote(null), null, NO_EXTRAS)
    expect(b.baseFareEstimated).toBe(true)
  })
})

describe('baggagePrice', () => {
  it('is cost-per-kg times kilograms', () => {
    expect(baggagePrice(makeQuote(18408), 50)).toBe(Math.round(18408 * 50))
  })
})

describe('buildCabin', () => {
  it('builds cupola pods and a grid of standard/window seats', () => {
    const cabin = buildCabin()
    expect(cabin.cupola.every((s) => s.type === 'cupola')).toBe(true)
    const flat = cabin.rows.flat()
    // Outer columns (A, D) are window seats; inner (B, C) are standard.
    expect(flat.filter((s) => s.col === 'A').every((s) => s.type === 'window')).toBe(true)
    expect(flat.filter((s) => s.col === 'B').every((s) => s.type === 'standard')).toBe(true)
    // Some seats are pre-booked.
    expect(flat.some((s) => s.occupied)).toBe(true)
  })
})

describe('makeBookingRef', () => {
  it('formats as OV-<DEST>-<5 chars>', () => {
    expect(makeBookingRef('mars')).toMatch(/^OV-MARS-[A-Z2-9]{5}$/)
  })
})
