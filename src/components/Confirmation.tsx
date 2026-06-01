import { useState } from 'react'
import type {
  ExtrasState,
  FareBreakdown,
  Passenger,
  Quote,
  SeatDef,
} from '../types'
import { describeWindow, formatDays, formatMoney } from '../lib/format'
import { SEAT_TYPE_LABEL } from '../lib/pricing'
import { assembleTicket } from '../lib/ticket'
import { Brand } from './ui'
import { FinePrint } from './FinePrint'

type PdfState = 'idle' | 'working' | 'done' | 'error'

export function Confirmation({
  quote,
  breakdown,
  seat,
  extras,
  passenger,
  bookingRef,
  onBookAnother,
}: {
  quote: Quote
  breakdown: FareBreakdown
  seat: SeatDef | null
  extras: ExtrasState
  passenger: Passenger
  bookingRef: string
  onBookAnother: () => void
}) {
  const [pdf, setPdf] = useState<PdfState>('idle')

  const downloadTicket = async () => {
    if (pdf === 'working') return
    setPdf('working')
    try {
      const data = assembleTicket({ quote, breakdown, seat, extras, passenger, bookingRef })
      // Lazy-load the PDF engine only when actually downloading.
      const { downloadTicketPdf } = await import('./TicketPdf')
      await downloadTicketPdf(data)
      setPdf('done')
    } catch (err) {
      console.error('Ticket PDF generation failed:', err)
      setPdf('error')
    }
  }

  return (
    <section className="mx-auto max-w-4xl px-6 animate-rise">
      <header className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-teal/50 bg-teal/10 text-2xl text-teal">
          ✓
        </div>
        <p className="eyebrow mb-3">Booking confirmed</p>
        <h2 className="font-display text-4xl font-semibold tracking-tight text-cream sm:text-5xl">
          You're going to {quote.destination.name}
        </h2>
        <p className="mt-3 text-cream-dim">
          A confirmation has been "sent" to{' '}
          <span className="text-cream">{passenger.email}</span> (simulated).
        </p>
      </header>

      {/* booking reference banner */}
      <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-amber/40 bg-amber/[0.06] px-6 py-4 sm:flex-row">
        <div>
          <div className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-amber">
            Booking reference
          </div>
          <div className="font-mono text-2xl font-bold tracking-[0.15em] text-cream">
            {bookingRef}
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-cream-dim">
            Passenger
          </div>
          <div className="font-display text-lg text-cream">
            {passenger.name || '—'}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* itinerary recap */}
        <div className="rounded-2xl border border-cream/12 bg-space-850/60 p-6">
          <div className="rule-diamond mb-4">
            <span className="font-mono text-[0.58rem] uppercase tracking-[0.25em]">
              Itinerary
            </span>
          </div>
          <Recap label="Route" value={`Earth → ${quote.destination.name}`} />
          <Recap label="Central body" value={quote.destination.central_body} />
          <Recap label="Vehicle" value={quote.rocket.name} />
          <Recap
            label="Trip type"
            value={extras.roundTrip ? 'Round-trip' : 'One-way'}
          />
          <Recap
            label="Travel time"
            value={`${formatDays(quote.transfer_time_days)}${
              extras.roundTrip ? ' each way' : ''
            }`}
          />
          <Recap
            label="Seat"
            value={seat ? `${seat.id} · ${SEAT_TYPE_LABEL[seat.type]}` : '—'}
          />
          <Recap label="Total Δv" value={`${quote.total_dv_kms.toFixed(2)} km/s`} />
          <div className="mt-4 rounded-lg border border-amber/25 bg-amber/[0.05] p-3">
            <div className="font-mono text-[0.55rem] uppercase tracking-[0.2em] text-amber">
              Departures
            </div>
            <p className="mt-1 text-sm text-cream">{describeWindow(quote)}</p>
          </div>
        </div>

        {/* fare breakdown */}
        <div className="rounded-2xl border border-cream/12 bg-space-850/60 p-6">
          <div className="rule-diamond mb-4">
            <span className="font-mono text-[0.58rem] uppercase tracking-[0.25em]">
              Fare breakdown
            </span>
          </div>
          <dl className="space-y-2.5">
            {breakdown.lines.map((l) => (
              <div key={l.id} className="flex items-start justify-between gap-3 text-sm">
                <dt className="text-cream-dim">
                  <span className="text-cream">{l.label}</span>
                  {l.perLeg && breakdown.legs === 2 && (
                    <span className="ml-1.5 font-mono text-[0.6rem] text-amber">×2</span>
                  )}
                  {l.detail && (
                    <span className="block font-mono text-[0.58rem] uppercase tracking-[0.12em] text-cream-dim/60">
                      {l.detail}
                    </span>
                  )}
                </dt>
                <dd className="shrink-0 font-mono text-sm text-cream">
                  {formatMoney(l.amount * (l.perLeg ? breakdown.legs : 1))}
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 flex items-baseline justify-between border-t border-cream/12 pt-4">
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-cream-dim">
              Total paid (simulated)
            </span>
            <span className="font-display text-2xl font-semibold text-amber">
              {formatMoney(breakdown.total)}
            </span>
          </div>
          <p className="mt-2 font-mono text-[0.56rem] uppercase tracking-[0.15em] text-cream-dim/60">
            Base fare from the orbital engine · seat & extras from the fare table
          </p>
        </div>
      </div>

      {/* actions */}
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <button
          onClick={downloadTicket}
          disabled={pdf === 'working'}
          className="btn-amber rounded-full px-7 py-3 text-sm disabled:cursor-wait disabled:opacity-60"
        >
          {pdf === 'working' ? 'Generating PDF…' : '⬇ Download ticket (PDF)'}
        </button>
        <button onClick={onBookAnother} className="btn-ghost rounded-full px-6 py-3 text-sm">
          Book another voyage
        </button>
      </div>
      {pdf === 'done' && (
        <p className="mt-3 text-center text-xs text-teal animate-rise">
          ✓ Your e-ticket{' '}
          <span className="font-mono text-cream">orbit-vacations-ticket-{bookingRef}.pdf</span>{' '}
          has been downloaded.
        </p>
      )}
      {pdf === 'error' && (
        <p className="mt-3 text-center text-xs text-rose animate-rise">
          Something went wrong generating the PDF.{' '}
          <button onClick={downloadTicket} className="underline hover:text-amber">
            Try again
          </button>
          .
        </p>
      )}

      <p className="mt-10 text-center font-mono text-[0.6rem] uppercase tracking-[0.3em] text-cream-dim/50">
        <Brand /> · bon voyage
      </p>

      <FinePrint assumptions={quote.assumptions} />
    </section>
  )
}

function Recap({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-cream/8 py-1.5">
      <span className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-cream-dim/70">
        {label}
      </span>
      <span className="text-right text-sm text-cream">{value}</span>
    </div>
  )
}
