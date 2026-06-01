import { useState } from 'react'
import type { FareBreakdown, Passenger, Quote } from '../types'
import { formatMoney } from '../lib/format'
import { BookingShell } from './BookingShell'
import { FareSummary } from './FareSummary'
import { OrbitSpinner } from './ui'

// Formatting helpers for the (entirely simulated) card fields.
function formatCardNumber(v: string): string {
  return v
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim()
}
function formatExpiry(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 4)
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
}

export function Checkout({
  quote,
  breakdown,
  passenger,
  onBack,
  onConfirm,
}: {
  quote: Quote
  breakdown: FareBreakdown
  passenger: Passenger
  onBack: () => void
  onConfirm: () => void
}) {
  const [card, setCard] = useState('4242 4242 4242 4242')
  const [expiry, setExpiry] = useState('04/29')
  const [cvc, setCvc] = useState('123')
  const [name, setName] = useState(passenger.name)
  const [processing, setProcessing] = useState(false)

  const ready =
    card.replace(/\s/g, '').length >= 15 &&
    /^\d{2}\/\d{2}$/.test(expiry) &&
    cvc.length >= 3 &&
    name.trim().length >= 2

  const submit = () => {
    if (!ready || processing) return
    setProcessing(true)
    // Simulated processing delay — no real network/charge.
    window.setTimeout(() => onConfirm(), 1400)
  }

  if (processing) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-6">
        <div className="text-center">
          <OrbitSpinner label="Authorizing (simulated)" />
          <p className="mt-4 text-sm text-cream-dim">
            Reticulating splines · clearing the launch range…
          </p>
        </div>
      </div>
    )
  }

  return (
    <BookingShell
      eyebrow="Step 07 — Checkout"
      title="Confirm & pay"
      onBack={onBack}
      backLabel="← Passenger"
      aside={<FareSummary quote={quote} breakdown={breakdown} title="Billing summary" />}
    >
      {/* clearly-simulated notice */}
      <div className="mb-5 flex items-center gap-3 rounded-xl border border-teal/40 bg-teal/[0.07] px-4 py-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-teal/50 text-teal">
          ✦
        </span>
        <p className="text-xs leading-relaxed text-cream-dim">
          <span className="font-semibold text-teal">Demo only — no real charge.</span>{' '}
          This is a simulated payment step. Card details are never sent anywhere;
          a test card is pre-filled for you.
        </p>
      </div>

      <div className="rounded-2xl border border-cream/12 bg-space-850/50 p-6 sm:p-8">
        <CardField label="Cardholder name" value={name} onChange={setName} placeholder="Ada Lovelace" />
        <CardField
          label="Card number"
          value={card}
          onChange={(v) => setCard(formatCardNumber(v))}
          placeholder="4242 4242 4242 4242"
          mono
          inputMode="numeric"
        />
        <div className="grid grid-cols-2 gap-4">
          <CardField
            label="Expiry"
            value={expiry}
            onChange={(v) => setExpiry(formatExpiry(v))}
            placeholder="MM/YY"
            mono
            inputMode="numeric"
          />
          <CardField
            label="CVC"
            value={cvc}
            onChange={(v) => setCvc(v.replace(/\D/g, '').slice(0, 4))}
            placeholder="123"
            mono
            inputMode="numeric"
          />
        </div>

        <button
          onClick={submit}
          disabled={!ready}
          className="btn-amber mt-4 w-full rounded-full py-3.5 text-base disabled:cursor-not-allowed disabled:opacity-40"
        >
          Pay {formatMoney(breakdown.total)} (simulated)
        </button>
        <p className="mt-3 text-center font-mono text-[0.58rem] uppercase tracking-[0.18em] text-cream-dim/60">
          🔒 No processor · no card stored · purely a demo
        </p>
      </div>
    </BookingShell>
  )
}

function CardField({
  label,
  value,
  onChange,
  placeholder,
  mono,
  inputMode,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  mono?: boolean
  inputMode?: 'numeric' | 'text'
}) {
  return (
    <label className="mb-4 block">
      <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-amber">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className={`mt-1.5 w-full rounded-lg border border-cream/15 bg-space-950/50 px-4 py-3 text-cream placeholder:text-cream-dim/40 focus:border-amber/60 focus:outline-none focus:ring-2 focus:ring-amber/30 ${
          mono ? 'font-mono tracking-wider' : 'font-sans'
        }`}
      />
    </label>
  )
}
