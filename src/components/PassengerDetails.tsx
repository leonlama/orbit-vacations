import type { FareBreakdown, Passenger, Quote } from '../types'
import { BookingShell } from './BookingShell'
import { FareSummary } from './FareSummary'

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function PassengerDetails({
  quote,
  breakdown,
  passenger,
  onChange,
  onBack,
  onContinue,
}: {
  quote: Quote
  breakdown: FareBreakdown
  passenger: Passenger
  onChange: (next: Passenger) => void
  onBack: () => void
  onContinue: () => void
}) {
  const nameOk = passenger.name.trim().length >= 2
  const emailOk = isValidEmail(passenger.email)
  const ready = nameOk && emailOk

  return (
    <BookingShell
      eyebrow="Step 06 — Passenger manifest"
      title="Who's flying?"
      subtitle="Printed on your ticket only. No account is created — this is a guest booking."
      onBack={onBack}
      backLabel="← Extras"
      onContinue={onContinue}
      continueLabel="Continue to checkout →"
      continueDisabled={!ready}
      aside={<FareSummary quote={quote} breakdown={breakdown} />}
    >
      <div className="rounded-2xl border border-cream/12 bg-space-850/50 p-6 sm:p-8">
        <Field
          label="Full name"
          hint="As it should appear on the boarding pass"
          value={passenger.name}
          onChange={(v) => onChange({ ...passenger, name: v })}
          placeholder="Ada Lovelace"
          autoComplete="name"
          invalid={passenger.name.length > 0 && !nameOk}
          invalidText="Enter at least two characters."
        />
        <Field
          label="Email"
          hint="For your confirmation — we won't spam the asteroid belt"
          value={passenger.email}
          onChange={(v) => onChange({ ...passenger, email: v })}
          placeholder="ada@orbit.vacations"
          type="email"
          autoComplete="email"
          invalid={passenger.email.length > 0 && !emailOk}
          invalidText="Enter a valid email address."
        />

        <p className="mt-2 flex items-center gap-2 font-mono text-[0.62rem] uppercase tracking-[0.15em] text-cream-dim/70">
          <span className="text-teal">●</span> Guest checkout — no password, no login.
        </p>
      </div>
    </BookingShell>
  )
}

function Field({
  label,
  hint,
  value,
  onChange,
  placeholder,
  type = 'text',
  autoComplete,
  invalid,
  invalidText,
}: {
  label: string
  hint?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  autoComplete?: string
  invalid?: boolean
  invalidText?: string
}) {
  return (
    <label className="mb-5 block">
      <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-amber">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`mt-1.5 w-full rounded-lg border bg-space-950/50 px-4 py-3 font-sans text-cream placeholder:text-cream-dim/40 focus:outline-none focus:ring-2 ${
          invalid
            ? 'border-coral/60 focus:ring-coral/40'
            : 'border-cream/15 focus:border-amber/60 focus:ring-amber/30'
        }`}
      />
      {invalid && invalidText ? (
        <span className="mt-1 block text-xs text-rose">{invalidText}</span>
      ) : (
        hint && <span className="mt-1 block text-xs text-cream-dim/70">{hint}</span>
      )}
    </label>
  )
}
