import type { ExtrasState, FareBreakdown, Quote } from '../types'
import {
  BAGGAGE_TIERS,
  CRYO_SLEEP_PRICE,
  HABITAT_TIERS,
  RADIATION_PRICE,
  baggagePrice,
} from '../lib/pricing'
import { formatMoney } from '../lib/format'
import { BookingShell } from './BookingShell'
import { FareSummary } from './FareSummary'

export function ExtrasSelect({
  quote,
  breakdown,
  extras,
  onChange,
  onBack,
  onContinue,
}: {
  quote: Quote
  breakdown: FareBreakdown
  extras: ExtrasState
  onChange: (next: ExtrasState) => void
  onBack: () => void
  onContinue: () => void
}) {
  const set = (patch: Partial<ExtrasState>) => onChange({ ...extras, ...patch })
  const days = Math.round(quote.transfer_time_days)

  return (
    <BookingShell
      eyebrow="Step 05 — Enhance your voyage"
      title="Extras & comforts"
      subtitle="Everything here is priced data — tweak freely and watch the fare update."
      onBack={onBack}
      backLabel="← Seats"
      onContinue={onContinue}
      continueLabel="Continue to passenger →"
      aside={<FareSummary quote={quote} breakdown={breakdown} />}
    >
      {/* Cryo-sleep — surfaced prominently for long hauls. */}
      <FeatureToggle
        featured
        active={extras.cryo}
        onToggle={() => set({ cryo: !extras.cryo })}
        title="Cryo-sleep pod"
        price={CRYO_SLEEP_PRICE}
        badge={days >= 60 ? `Recommended · ${days}-day transfer` : undefined}
      >
        Why endure the <span className="text-cream">{days}-day journey</span> awake?
        Sleep through it in a temperature-controlled cryo pod and wake on
        approach, refreshed and {days >= 60 ? 'several months' : 'days'} younger
        in subjective time.
      </FeatureToggle>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FeatureToggle
          active={extras.radiation}
          onToggle={() => set({ radiation: !extras.radiation })}
          title="Radiation insurance"
          price={RADIATION_PRICE}
        >
          Cosmic-ray and solar-event coverage for the deep-space legs. Peace of
          mind, fully underwritten.
        </FeatureToggle>

        {/* Extra baggage = payload allowance */}
        <div className="rounded-2xl border border-cream/12 bg-space-850/50 p-5">
          <div className="flex items-baseline justify-between">
            <h3 className="font-display text-lg font-semibold text-cream">Extra baggage</h3>
            <span className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-amber">
              = payload allowance
            </span>
          </div>
          <p className="mt-1 text-xs text-cream-dim">
            Priced at the rocket's marginal cost-per-kg — every gram rides real
            propellant.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {BAGGAGE_TIERS.map((t) => {
              const active = extras.baggageKg === t.kg
              return (
                <button
                  key={t.kg}
                  onClick={() => set({ baggageKg: t.kg })}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    active
                      ? 'border-amber bg-amber/15 text-amber'
                      : 'border-cream/20 text-cream-dim hover:border-amber/50'
                  }`}
                >
                  {t.label}
                  {t.kg > 0 && (
                    <span className="ml-1.5 font-mono text-[0.6rem] text-cream-dim/70">
                      {formatMoney(baggagePrice(quote, t.kg))}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Habitat stay */}
      <div className="mt-6">
        <div className="rule-diamond mb-4">
          <span className="font-mono text-[0.58rem] uppercase tracking-[0.25em]">
            Stay at {quote.destination.name}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {HABITAT_TIERS.map((h) => {
            const active = extras.habitat === h.id
            return (
              <button
                key={h.id}
                onClick={() => set({ habitat: active ? null : h.id })}
                className={`flex flex-col rounded-xl border p-4 text-left transition-all ${
                  active
                    ? 'border-amber bg-amber/[0.07] shadow-[0_0_0_1px_var(--color-amber)]'
                    : 'border-cream/12 bg-space-850/50 hover:border-amber/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-display text-base font-semibold text-cream">{h.name}</h4>
                  <span className={`text-xs ${active ? 'text-amber' : 'text-cream-dim'}`}>
                    {active ? '✓' : '+'}
                  </span>
                </div>
                <p className="mt-1.5 flex-1 text-xs leading-relaxed text-cream-dim">{h.blurb}</p>
                <span className="mt-3 font-mono text-sm font-bold text-amber">
                  {formatMoney(h.price)}
                </span>
              </button>
            )
          })}
        </div>
        {extras.habitat && (
          <button
            onClick={() => set({ habitat: null })}
            className="mt-2 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-cream-dim hover:text-amber"
          >
            Clear habitat selection
          </button>
        )}
      </div>

      {/* Round-trip toggle */}
      <button
        onClick={() => set({ roundTrip: !extras.roundTrip })}
        className={`mt-6 flex w-full items-center justify-between rounded-2xl border p-5 text-left transition-all ${
          extras.roundTrip
            ? 'border-amber bg-amber/[0.07] shadow-[0_0_0_1px_var(--color-amber)]'
            : 'border-cream/12 bg-space-850/50 hover:border-amber/50'
        }`}
      >
        <div>
          <h3 className="font-display text-lg font-semibold text-cream">Round-trip</h3>
          <p className="mt-1 text-xs text-cream-dim">
            Add the return leg — doubles the per-leg fare items (the habitat stay
            is charged once).
          </p>
        </div>
        <Switch on={extras.roundTrip} />
      </button>
    </BookingShell>
  )
}

function FeatureToggle({
  active,
  onToggle,
  title,
  price,
  badge,
  featured,
  children,
}: {
  active: boolean
  onToggle: () => void
  title: string
  price: number
  badge?: string
  featured?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onToggle}
      className={`flex w-full flex-col gap-3 rounded-2xl border p-5 text-left transition-all sm:flex-row sm:items-center sm:justify-between ${
        active
          ? 'border-amber bg-amber/[0.07] shadow-[0_0_0_1px_var(--color-amber)]'
          : 'border-cream/12 bg-space-850/50 hover:border-amber/50'
      } ${featured ? 'sm:p-6' : ''}`}
    >
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className={`font-display font-semibold text-cream ${featured ? 'text-xl' : 'text-lg'}`}>
            {title}
          </h3>
          {badge && (
            <span className="rounded-full border border-coral/50 bg-coral/10 px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.15em] text-rose">
              {badge}
            </span>
          )}
        </div>
        <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-cream-dim">{children}</p>
      </div>
      <div className="flex items-center gap-4">
        <span className="font-mono text-sm font-bold text-amber">{formatMoney(price)}</span>
        <Switch on={active} />
      </div>
    </button>
  )
}

function Switch({ on }: { on: boolean }) {
  return (
    <span
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors ${
        on ? 'border-amber bg-amber/30' : 'border-cream/25 bg-space-900'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
          on ? 'translate-x-6 bg-amber' : 'translate-x-1 bg-cream-dim'
        }`}
      />
    </span>
  )
}
