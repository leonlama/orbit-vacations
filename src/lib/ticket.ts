// Pure assembly of the data that gets printed on the PDF e-ticket.
//
// Kept free of @react-pdf/renderer so it is trivially unit-testable and so the
// heavy PDF library only loads when the user actually downloads a ticket
// (see components/TicketPdf.tsx, which is imported dynamically).

import type {
  ExtrasState,
  FareBreakdown,
  Passenger,
  Quote,
  SeatDef,
} from '../types'
import { describeWindow, formatDays, formatMoney } from './format'
import { SEAT_TYPE_LABEL } from './pricing'

export interface TicketFareLine {
  label: string
  amount: string
}

export interface TicketData {
  bookingRef: string
  passengerName: string
  passengerEmail: string
  route: { from: string; to: string; centralBody: string }
  rocketName: string
  seatLabel: string
  travelTime: string
  tripType: string
  windowText: string
  totalDvKms: string
  fareLines: TicketFareLine[]
  totalFare: string
  legs: number
  barcode: number[] // bar widths (points) for the faux barcode
  assumptions: string
  filename: string
}

export interface TicketInput {
  quote: Quote
  breakdown: FareBreakdown
  seat: SeatDef | null
  extras: ExtrasState
  passenger: Passenger
  bookingRef: string
}

/**
 * Deterministic faux barcode: expand a seed string into a run of vertical bar
 * widths (1–3 pt). Same seed → same bars, so it is stable and testable.
 */
export function barcodeBars(seed: string): number[] {
  const bars: number[] = []
  for (let i = 0; i < seed.length; i++) {
    const c = seed.charCodeAt(i)
    // Three bars per character, widths cycled from the char code.
    bars.push(((c + 0) % 3) + 1)
    bars.push(((c >> 2) % 3) + 1)
    bars.push(((c >> 4) % 3) + 1)
  }
  return bars
}

export function assembleTicket(input: TicketInput): TicketData {
  const { quote, breakdown, seat, extras, passenger, bookingRef } = input
  const legs = breakdown.legs

  const fareLines: TicketFareLine[] = breakdown.lines.map((l) => ({
    label: l.label + (l.perLeg && legs === 2 ? ' (×2)' : ''),
    amount: formatMoney(l.amount * (l.perLeg ? legs : 1)),
  }))

  return {
    bookingRef,
    passengerName: passenger.name.trim() || '—',
    passengerEmail: passenger.email.trim(),
    route: {
      from: 'Earth · LEO',
      to: quote.destination.name,
      centralBody: quote.destination.central_body,
    },
    rocketName: quote.rocket.name,
    seatLabel: seat ? `${seat.id} · ${SEAT_TYPE_LABEL[seat.type]}` : 'Unassigned',
    travelTime: formatDays(quote.transfer_time_days) + (legs === 2 ? ' each way' : ''),
    tripType: legs === 2 ? 'Round-trip' : 'One-way',
    windowText: describeWindow(quote),
    totalDvKms: `${quote.total_dv_kms.toFixed(2)} km/s`,
    fareLines,
    totalFare: formatMoney(breakdown.total),
    legs,
    barcode: barcodeBars(`${bookingRef}:${breakdown.total}:${extras.roundTrip}`),
    assumptions: quote.assumptions,
    filename: `orbit-vacations-ticket-${bookingRef}.pdf`,
  }
}
