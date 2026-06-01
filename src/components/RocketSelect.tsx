import type { Destination, Rocket } from '../types'
import { formatKg, formatUSD } from '../lib/format'
import { PayloadBadge } from './ui'

export function RocketSelect({
  rockets,
  destination,
  selectedId,
  onSelect,
  onBack,
}: {
  rockets: Rocket[]
  destination: Destination
  selectedId: string | null
  onSelect: (r: Rocket) => void
  onBack: () => void
}) {
  return (
    <section className="mx-auto max-w-4xl px-6 animate-rise">
      <header className="mb-8 text-center">
        <p className="eyebrow mb-3">Step 02 — Select your fare class</p>
        <h2 className="font-display text-4xl font-semibold tracking-tight text-cream sm:text-5xl">
          How would you like to fly to{' '}
          <span className="text-amber">{destination.name}</span>?
        </h2>
        <p className="mt-3 text-cream-dim">
          Each rocket is a fare class. We quote payload-to-LEO and sticker price;
          your boarding pass works out the rest.
        </p>
      </header>

      <ul className="flex flex-col gap-4">
        {rockets.map((r, i) => {
          const selected = r.id === selectedId
          return (
            <li key={r.id} style={{ animationDelay: `${i * 70}ms` }} className="animate-rise">
              <button
                onClick={() => onSelect(r)}
                className={`group flex w-full flex-col gap-4 rounded-2xl border p-5 text-left transition-all duration-200 sm:flex-row sm:items-center sm:justify-between ${
                  selected
                    ? 'border-amber bg-amber/[0.06] shadow-[0_0_0_1px_var(--color-amber)]'
                    : 'border-cream/12 bg-space-850/60 hover:border-amber/50 hover:bg-space-800/60'
                }`}
              >
                {/* identity */}
                <div className="flex items-center gap-4">
                  <RocketGlyph active={selected} />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-xl font-semibold text-cream">
                        {r.name}
                      </h3>
                      {!r.payload_demonstrated && <PayloadBadge basis="target" />}
                    </div>
                    <p className="mt-0.5 text-xs text-cream-dim">{r.notes}</p>
                  </div>
                </div>

                {/* fare metrics — airline-style columns */}
                <div className="flex items-center gap-6 sm:gap-8">
                  <Metric label="To LEO" value={formatKg(r.payload_leo_kg)} />
                  <Metric label="Per launch" value={formatUSD(r.cost_usd)} accent />
                  <span
                    className={`hidden font-mono text-[0.65rem] uppercase tracking-[0.18em] sm:inline ${
                      selected ? 'text-amber' : 'text-cream-dim group-hover:text-amber'
                    }`}
                  >
                    {selected ? '✓' : 'Pick →'}
                  </span>
                </div>
              </button>
            </li>
          )
        })}
      </ul>

      <div className="mt-8 flex justify-center">
        <button onClick={onBack} className="btn-ghost rounded-full px-6 py-2.5 text-sm">
          ← Change destination
        </button>
      </div>
    </section>
  )
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="text-right">
      <div className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-cream-dim/70">
        {label}
      </div>
      <div className={`font-mono text-sm font-bold ${accent ? 'text-amber' : 'text-cream'}`}>
        {value}
      </div>
    </div>
  )
}

function RocketGlyph({ active }: { active: boolean }) {
  return (
    <span
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border ${
        active ? 'border-amber bg-amber/15' : 'border-cream/20 bg-space-900'
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke={active ? 'var(--color-amber)' : 'var(--color-cream)'} strokeWidth="1.6">
        <path d="M12 2c3 2.2 4.5 5.5 4.5 9.5L12 16l-4.5-4.5C7.5 7.5 9 4.2 12 2Z" strokeLinejoin="round" />
        <circle cx="12" cy="9" r="1.6" />
        <path d="M9 15l-2.5 4M15 15l2.5 4M12 16v4" strokeLinecap="round" />
      </svg>
    </span>
  )
}
