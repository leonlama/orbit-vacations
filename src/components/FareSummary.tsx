import type { FareBreakdown, Quote } from '../types'
import { formatMoney } from '../lib/format'

export function FareSummary({
  quote,
  breakdown,
  className = '',
  title = 'Fare summary',
}: {
  quote: Quote
  breakdown: FareBreakdown
  className?: string
  title?: string
}) {
  const { lines, legs, total } = breakdown
  return (
    <aside
      className={`rounded-2xl border border-cream/12 bg-space-850/70 p-5 backdrop-blur ${className}`}
    >
      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-lg font-semibold text-cream">{title}</h3>
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-amber">
          {quote.destination.name}
          {legs === 2 ? ' · round-trip' : ' · one-way'}
        </span>
      </div>

      <dl className="mt-4 space-y-2.5">
        {lines.map((l) => (
          <div key={l.id} className="flex items-start justify-between gap-3 text-sm">
            <dt className="text-cream-dim">
              <span className="text-cream">{l.label}</span>
              {l.perLeg && legs === 2 && (
                <span className="ml-1.5 font-mono text-[0.6rem] text-amber">×2</span>
              )}
              {l.detail && (
                <span className="block font-mono text-[0.6rem] uppercase tracking-[0.12em] text-cream-dim/60">
                  {l.detail}
                </span>
              )}
            </dt>
            <dd className="shrink-0 font-mono text-sm text-cream">
              {formatMoney(l.amount * (l.perLeg ? legs : 1))}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 flex items-baseline justify-between border-t border-cream/12 pt-4">
        <span className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-cream-dim">
          Total fare
        </span>
        <span className="font-display text-2xl font-semibold text-amber">
          {formatMoney(total)}
        </span>
      </div>

      {breakdown.baseFareEstimated && (
        <p className="mt-3 font-mono text-[0.58rem] leading-relaxed text-cream-dim/70">
          * Base fare is a demo estimate — this vehicle has no published
          per-launch cost.
        </p>
      )}
    </aside>
  )
}
