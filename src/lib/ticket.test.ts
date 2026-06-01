import { describe, expect, it } from 'vitest'
import type { ExtrasState, Quote, SeatDef } from '../types'
import { computeBreakdown } from './pricing'
import { assembleTicket, barcodeBars } from './ticket'

function makeQuote(): Quote {
  return {
    destination: { id: 'mars', name: 'Mars', central_body: 'Sun' },
    total_dv_kms: 5.596,
    departure_burn_kms: 2.946,
    arrival_burn_kms: 2.65,
    transfer_time_days: 258.9,
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
      fare_cost_per_kg_usd: 18408,
    },
    assumptions: 'Idealized coplanar two-impulse Hohmann transfer.',
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

const passenger = { name: '  Ada Lovelace  ', email: 'ada@orbit.vacations' }

describe('assembleTicket', () => {
  it('assembles route, passenger, rocket and seat fields', () => {
    const q = makeQuote()
    const b = computeBreakdown(q, windowSeat, NO_EXTRAS)
    const t = assembleTicket({
      quote: q,
      breakdown: b,
      seat: windowSeat,
      extras: NO_EXTRAS,
      passenger,
      bookingRef: 'OV-MARS-7K3Q',
    })

    expect(t.passengerName).toBe('Ada Lovelace') // trimmed
    expect(t.route).toEqual({ from: 'Earth · LEO', to: 'Mars', centralBody: 'Sun' })
    expect(t.rocketName).toBe('Falcon 9')
    expect(t.seatLabel).toBe('3A · Window')
    expect(t.tripType).toBe('One-way')
    expect(t.totalDvKms).toBe('5.60 km/s')
    expect(t.windowText).toContain('next modeled window')
  })

  it('derives a filename from the booking reference', () => {
    const q = makeQuote()
    const b = computeBreakdown(q, null, NO_EXTRAS)
    const t = assembleTicket({
      quote: q,
      breakdown: b,
      seat: null,
      extras: NO_EXTRAS,
      passenger,
      bookingRef: 'OV-MARS-ABCDE',
    })
    expect(t.filename).toBe('orbit-vacations-ticket-OV-MARS-ABCDE.pdf')
    expect(t.seatLabel).toBe('Unassigned')
  })

  it('mirrors the fare breakdown lines and total', () => {
    const q = makeQuote()
    const extras: ExtrasState = { ...NO_EXTRAS, cryo: true, roundTrip: true }
    const b = computeBreakdown(q, windowSeat, extras)
    const t = assembleTicket({
      quote: q,
      breakdown: b,
      seat: windowSeat,
      extras,
      passenger,
      bookingRef: 'OV-MARS-RT',
    })

    expect(t.fareLines).toHaveLength(b.lines.length)
    expect(t.tripType).toBe('Round-trip')
    expect(t.travelTime).toContain('each way')
    // Round-trip per-leg lines are tagged ×2.
    expect(t.fareLines.some((l) => l.label.includes('×2'))).toBe(true)
    // Total string is the formatted breakdown total.
    expect(t.totalFare).toBe(`$${Math.round(b.total).toLocaleString('en-US')}`)
  })
})

describe('barcodeBars', () => {
  it('is deterministic for a given seed', () => {
    expect(barcodeBars('OV-MARS-7K3Q')).toEqual(barcodeBars('OV-MARS-7K3Q'))
  })

  it('differs for different seeds', () => {
    expect(barcodeBars('OV-MARS-7K3Q')).not.toEqual(barcodeBars('OV-MOON-7K3Q'))
  })

  it('produces three bars per character, each width 1–3', () => {
    const bars = barcodeBars('ABCD')
    expect(bars).toHaveLength(12)
    expect(bars.every((w) => w >= 1 && w <= 3)).toBe(true)
  })
})
