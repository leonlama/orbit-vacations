import { useMemo } from 'react'
import type { FareBreakdown, Quote, SeatDef } from '../types'
import {
  CABIN_COLUMNS,
  SEAT_TYPE_LABEL,
  SEAT_UPCHARGE,
  buildCabin,
} from '../lib/pricing'
import { formatMoney } from '../lib/format'
import { BookingShell } from './BookingShell'
import { FareSummary } from './FareSummary'

export function SeatSelect({
  quote,
  breakdown,
  selected,
  onSelect,
  onBack,
  onContinue,
}: {
  quote: Quote
  breakdown: FareBreakdown
  selected: SeatDef | null
  onSelect: (seat: SeatDef) => void
  onBack: () => void
  onContinue: () => void
}) {
  const cabin = useMemo(() => buildCabin(), [])

  return (
    <BookingShell
      eyebrow="Step 04 — Choose your seat"
      title="Pick where you'll ride"
      subtitle="Window seats see the cosmos; cupola pods are wrapped in glass."
      onBack={onBack}
      backLabel="← Itinerary"
      onContinue={onContinue}
      continueLabel="Continue to extras →"
      continueDisabled={!selected}
      aside={<FareSummary quote={quote} breakdown={breakdown} />}
    >
      <div className="rounded-2xl border border-cream/12 bg-space-850/50 p-5 sm:p-7">
        {/* nose cone */}
        <div className="mx-auto mb-2 h-10 w-2/3 rounded-t-full border border-b-0 border-cream/15 bg-gradient-to-b from-space-700/40 to-transparent" />

        {/* observation deck */}
        <Deck label="Observation Deck">
          <div className="flex justify-center gap-3">
            {cabin.cupola.map((s) => (
              <Seat key={s.id} seat={s} selected={selected?.id === s.id} onSelect={onSelect} />
            ))}
          </div>
        </Deck>

        {/* main cabin */}
        <Deck label="Main Cabin">
          <div className="space-y-2.5">
            {cabin.rows.map((row) => (
              <div key={row[0].row} className="flex items-center justify-center gap-2">
                <span className="w-5 text-center font-mono text-[0.6rem] text-cream-dim/50">
                  {row[0].row}
                </span>
                {row.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-2">
                    <Seat seat={s} selected={selected?.id === s.id} onSelect={onSelect} />
                    {/* aisle gap between columns B and C */}
                    {CABIN_COLUMNS[i] === 'B' && <span className="w-5" />}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Deck>
      </div>

      {/* legend */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs">
        <LegendSwatch className="border-cream/30 bg-space-700" label="Standard" />
        <LegendSwatch className="border-teal/50 bg-teal/15" label={`Window +${formatMoney(SEAT_UPCHARGE.window)}`} />
        <LegendSwatch className="border-amber/60 bg-amber/15" label={`Cupola +${formatMoney(SEAT_UPCHARGE.cupola)}`} />
        <LegendSwatch className="border-cream/10 bg-space-900" label="Taken" muted />
        <LegendSwatch className="border-amber bg-amber" label="Selected" solid />
      </div>

      {selected && (
        <p className="mt-4 text-center text-sm text-cream-dim">
          Seat <span className="font-mono text-cream">{selected.id}</span> ·{' '}
          {SEAT_TYPE_LABEL[selected.type]}
          {SEAT_UPCHARGE[selected.type] > 0
            ? ` · +${formatMoney(SEAT_UPCHARGE[selected.type])}`
            : ' · included'}
        </p>
      )}
    </BookingShell>
  )
}

function Deck({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="my-4">
      <div className="rule-diamond mb-3">
        <span className="font-mono text-[0.56rem] uppercase tracking-[0.25em]">{label}</span>
      </div>
      {children}
    </div>
  )
}

function Seat({
  seat,
  selected,
  onSelect,
}: {
  seat: SeatDef
  selected: boolean
  onSelect: (s: SeatDef) => void
}) {
  const isCupola = seat.type === 'cupola'
  const base =
    'flex items-center justify-center rounded-md border font-mono transition-all duration-150'
  const size = isCupola ? 'h-11 w-16 text-[0.62rem]' : 'h-9 w-9 text-[0.6rem]'

  if (seat.occupied) {
    return (
      <span
        className={`${base} ${size} cursor-not-allowed border-cream/10 bg-space-900 text-cream-dim/30`}
        aria-label={`Seat ${seat.id}, taken`}
      >
        ✕
      </span>
    )
  }

  const tone = selected
    ? 'border-amber bg-amber text-space-950 shadow-[0_0_0_3px_rgba(233,162,59,0.25)]'
    : seat.type === 'cupola'
      ? 'border-amber/55 bg-amber/10 text-amber hover:bg-amber/20'
      : seat.type === 'window'
        ? 'border-teal/50 bg-teal/12 text-teal hover:bg-teal/20'
        : 'border-cream/30 bg-space-700 text-cream hover:border-amber/50'

  return (
    <button
      onClick={() => onSelect(seat)}
      className={`${base} ${size} ${tone}`}
      aria-pressed={selected}
      aria-label={`Seat ${seat.id}, ${seat.type}`}
      title={`${seat.id} · ${SEAT_TYPE_LABEL[seat.type]}`}
    >
      {isCupola ? '◎' : seat.col}
    </button>
  )
}

function LegendSwatch({
  className,
  label,
  muted,
  solid,
}: {
  className: string
  label: string
  muted?: boolean
  solid?: boolean
}) {
  return (
    <span className="flex items-center gap-2">
      <span className={`h-4 w-4 rounded border ${className}`} />
      <span className={solid ? 'text-cream' : muted ? 'text-cream-dim/60' : 'text-cream-dim'}>
        {label}
      </span>
    </span>
  )
}
