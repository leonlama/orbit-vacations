import type { Quote } from '../types'
import {
  cadenceMonths,
  formatDays,
  formatKg,
  formatKms,
  formatPerKg,
  formatUSD,
  formatWindowDate,
} from '../lib/format'
import { PayloadBadge } from './ui'

export function BoardingPass({
  quote,
  onRebook,
  onChangeRocket,
}: {
  quote: Quote
  onRebook: () => void
  onChangeRocket: () => void
}) {
  const { rocket } = quote
  const flightNo = makeFlightNo(quote)

  return (
    <section className="mx-auto max-w-4xl px-6 animate-rise">
      <header className="mb-8 text-center">
        <p className="eyebrow mb-3">Step 03 — Your itinerary</p>
        <h2 className="font-display text-4xl font-semibold tracking-tight text-cream sm:text-5xl">
          You're cleared for departure
        </h2>
      </header>

      {/* ---- The boarding pass ---- */}
      <div className="relative grid grid-cols-1 overflow-hidden rounded-[--radius-poster] border border-cream/15 bg-gradient-to-br from-space-850 to-space-900 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)] md:grid-cols-[1.7fr_1fr]">
        {/* MAIN */}
        <div className="relative p-7 sm:p-9">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.3em] text-amber">
              Boarding Pass
            </span>
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-cream-dim">
              {flightNo}
            </span>
          </div>

          {/* route */}
          <div className="mt-6 flex items-center gap-4">
            <Node label="From" place="Earth" sub="LEO / Earth orbit" />
            <Route feasible={rocket.feasible} />
            <Node
              label="To"
              place={quote.destination.name}
              sub={`orbits the ${quote.destination.central_body}`}
              alignRight
            />
          </div>

          {/* headline travel time */}
          <div className="mt-8 rounded-xl border border-cream/10 bg-space-950/40 p-5">
            <div className="font-mono text-[0.6rem] uppercase tracking-[0.25em] text-cream-dim">
              Travel time (one way)
            </div>
            <div className="mt-1 font-display text-3xl font-semibold text-cream">
              {formatDays(quote.transfer_time_days)}
            </div>
          </div>

          {/* the "fare" = delta-v budget */}
          <div className="mt-6">
            <div className="rule-diamond mb-4">
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.25em]">
                Your fare · paid in Δv
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Fare label="Departure burn" value={formatKms(quote.departure_burn_kms)} />
              <Fare label="Arrival burn" value={formatKms(quote.arrival_burn_kms)} />
              <Fare label="Total Δv" value={formatKms(quote.total_dv_kms)} total />
            </div>
            <p className="mt-3 font-mono text-[0.62rem] leading-relaxed text-cream-dim/80">
              Δv is the real price of admission — the change in velocity your
              rocket must buy. No frequent-flyer miles accepted.
            </p>
          </div>
        </div>

        {/* PERFORATION */}
        <div className="relative">
          <div
            className="absolute inset-y-0 left-0 hidden w-px md:block"
            style={{
              backgroundImage:
                'repeating-linear-gradient(to bottom, rgba(243,232,210,0.45) 0 6px, transparent 6px 14px)',
            }}
          />
          {/* notches */}
          <div className="absolute -left-3 -top-3 hidden h-6 w-6 rounded-full bg-space-950 md:block" />
          <div className="absolute -bottom-3 -left-3 hidden h-6 w-6 rounded-full bg-space-950 md:block" />

          {/* STUB */}
          <div className="flex h-full flex-col gap-4 bg-space-900/60 p-7 sm:p-8">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[0.62rem] uppercase tracking-[0.25em] text-amber">
                Stub
              </span>
              <FeasibilityChip feasible={rocket.feasible} />
            </div>

            <StubRow label="Rocket" value={rocket.name} />
            <StubRow
              label="Deliverable payload"
              value={formatKg(rocket.deliverable_payload_kg)}
              badge={<PayloadBadge basis={rocket.payload_basis} />}
            />
            <StubRow label="Cost / kg delivered" value={formatPerKg(rocket.fare_cost_per_kg_usd)} />
            <StubRow label="Total launch cost" value={formatUSD(rocket.total_cost_usd)} accent />

            <div className="mt-auto rounded-lg border border-amber/25 bg-amber/[0.06] p-3">
              <div className="font-mono text-[0.56rem] uppercase tracking-[0.22em] text-amber">
                Departures
              </div>
              <p className="mt-1 text-sm leading-snug text-cream">
                {windowText(quote)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* actions */}
      <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <button onClick={onChangeRocket} className="btn-ghost rounded-full px-6 py-2.5 text-sm">
          ← Change rocket
        </button>
        <button onClick={onRebook} className="btn-amber rounded-full px-7 py-2.5 text-sm">
          Book another voyage
        </button>
      </div>
    </section>
  )
}

// "departs ~every 26 months — next modeled window: <date>" for Mars/Venus;
// the human cadence note ("≈ monthly") when the API returns no single date.
function windowText(quote: Quote): string {
  if (quote.next_window === null) {
    const note = quote.next_window_note ?? 'frequently'
    return `Departs ${note} — lunar windows recur far too often to print one date.`
  }
  const cadence =
    quote.synodic_period_days !== null
      ? `~every ${cadenceMonths(quote.synodic_period_days)} months`
      : 'periodically'
  return `Departs ${cadence} — next modeled window: ${formatWindowDate(quote.next_window)}.`
}

function makeFlightNo(quote: Quote): string {
  const d = quote.destination.id.slice(0, 2).toUpperCase()
  const r = quote.rocket.name.replace(/[^0-9]/g, '') || '00'
  const dv = Math.round(quote.total_dv_kms * 100)
  return `OV-${d}${r.padStart(2, '0')}·${dv}`
}

function Node({
  label,
  place,
  sub,
  alignRight,
}: {
  label: string
  place: string
  sub: string
  alignRight?: boolean
}) {
  return (
    <div className={alignRight ? 'text-right' : ''}>
      <div className="font-mono text-[0.58rem] uppercase tracking-[0.25em] text-cream-dim">
        {label}
      </div>
      <div className="font-display text-2xl font-semibold leading-tight text-cream sm:text-3xl">
        {place}
      </div>
      <div className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-cream-dim/70">
        {sub}
      </div>
    </div>
  )
}

function Route({ feasible }: { feasible: boolean }) {
  return (
    <div className="flex flex-1 flex-col items-center">
      <svg viewBox="0 0 120 24" className="w-full" aria-hidden>
        <line x1="4" y1="12" x2="116" y2="12" stroke="rgba(243,232,210,0.25)" strokeWidth="1" strokeDasharray="3 4" />
        <path
          d="M4 12 q56 -16 100 0"
          fill="none"
          stroke={feasible ? 'var(--color-amber)' : 'var(--color-coral)'}
          strokeWidth="1.5"
        />
        <g transform="translate(104 12)" fill={feasible ? 'var(--color-amber)' : 'var(--color-coral)'}>
          <path d="M-6 -4 L4 0 L-6 4 L-3 0 Z" />
        </g>
        <circle cx="4" cy="12" r="2.5" fill="var(--color-cream)" />
      </svg>
      <span className="font-mono text-[0.55rem] uppercase tracking-[0.2em] text-cream-dim/70">
        Hohmann transfer
      </span>
    </div>
  )
}

function Fare({ label, value, total }: { label: string; value: string; total?: boolean }) {
  return (
    <div
      className={`rounded-lg border p-3 text-center ${
        total ? 'border-amber/50 bg-amber/[0.08]' : 'border-cream/10 bg-space-950/30'
      }`}
    >
      <div className="font-mono text-[0.55rem] uppercase tracking-[0.16em] text-cream-dim">
        {label}
      </div>
      <div className={`mt-1 font-mono text-base font-bold ${total ? 'text-amber' : 'text-cream'}`}>
        {value}
      </div>
    </div>
  )
}

function StubRow({
  label,
  value,
  accent,
  badge,
}: {
  label: string
  value: string
  accent?: boolean
  badge?: React.ReactNode
}) {
  return (
    <div className="border-b border-cream/8 pb-2">
      <div className="font-mono text-[0.56rem] uppercase tracking-[0.2em] text-cream-dim/70">
        {label}
      </div>
      <div className={`font-mono text-sm font-bold ${accent ? 'text-amber' : 'text-cream'}`}>
        {value}
      </div>
      {badge && <div className="mt-1">{badge}</div>}
    </div>
  )
}

function FeasibilityChip({ feasible }: { feasible: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[0.58rem] uppercase tracking-[0.18em] ${
        feasible
          ? 'border-teal/50 bg-teal/10 text-teal'
          : 'border-coral/50 bg-coral/10 text-rose'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${feasible ? 'bg-teal' : 'bg-coral'}`} />
      {feasible ? 'Cleared' : 'Not feasible'}
    </span>
  )
}
