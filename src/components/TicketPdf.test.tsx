import { describe, expect, it } from 'vitest'
import { pdf } from '@react-pdf/renderer'
import type { ExtrasState, Quote, SeatDef } from '../types'
import { computeBreakdown } from '../lib/pricing'
import { assembleTicket } from '../lib/ticket'
import { TicketPdf } from './TicketPdf'

// Smoke test: render the e-ticket to a real PDF and confirm it is well-formed.
// Exercises the heaviest config (cupola seat + every extra + round-trip) so a
// broken style prop or layout surfaces here rather than in the browser.
describe('TicketPdf', () => {
  it('renders to a valid PDF document', async () => {
    const quote: Quote = {
      destination: { id: 'mars', name: 'Mars', central_body: 'Sun' },
      total_dv_kms: 5.6,
      departure_burn_kms: 2.9,
      arrival_burn_kms: 2.7,
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
        fare_cost_per_kg_usd: 18408,
      },
      assumptions: 'Idealized coplanar two-impulse Hohmann transfer.',
    }
    const extras: ExtrasState = {
      cryo: true,
      radiation: true,
      baggageKg: 25,
      habitat: 'dome',
      roundTrip: true,
    }
    const seat: SeatDef = { id: 'P1', row: 0, col: 'P1', type: 'cupola', occupied: false }
    const breakdown = computeBreakdown(quote, seat, extras)
    const data = assembleTicket({
      quote,
      breakdown,
      seat,
      extras,
      passenger: { name: 'Ada Lovelace', email: 'ada@orbit.vacations' },
      bookingRef: 'OV-MARS-7K3Q',
    })

    const blob = await pdf(<TicketPdf data={data} />).toBlob()
    const bytes = new Uint8Array(await blob.arrayBuffer())
    expect(bytes.length).toBeGreaterThan(1000)
    expect(String.fromCharCode(...bytes.subarray(0, 5))).toBe('%PDF-')
  }, 20000)
})
