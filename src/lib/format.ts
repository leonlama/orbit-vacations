// Presentation helpers — keep formatting out of the components.

import type { Quote } from '../types'

export function formatUSD(value: number | null): string {
  if (value === null) return '—'
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toLocaleString('en-US', {
      maximumFractionDigits: 1,
    })}M`
  }
  return `$${Math.round(value).toLocaleString('en-US')}`
}

// Exact dollars with thousands separators — for billing summaries where a
// "$1,840,796" reads more like a real invoice than "$1.8M".
export function formatMoney(value: number | null): string {
  if (value === null) return '—'
  return `$${Math.round(value).toLocaleString('en-US')}`
}

export function formatPerKg(value: number | null): string {
  if (value === null) return '—'
  return `$${Math.round(value).toLocaleString('en-US')}/kg`
}

export function formatKg(value: number | null): string {
  if (value === null) return '—'
  if (value >= 1000) {
    return `${(value / 1000).toLocaleString('en-US', {
      maximumFractionDigits: 1,
    })} t`
  }
  return `${Math.round(value).toLocaleString('en-US')} kg`
}

export function formatKms(value: number): string {
  return `${value.toFixed(2)} km/s`
}

export function formatDays(value: number): string {
  const rounded = Math.round(value)
  if (rounded >= 30) {
    const months = value / 30.44
    return `${rounded} days · ~${months.toFixed(1)} months`
  }
  return `${rounded} day${rounded === 1 ? '' : 's'}`
}

// "departs ~every 26 months" from a synodic period in days.
export function cadenceMonths(synodicDays: number): number {
  return Math.round(synodicDays / 30.44)
}

export function formatWindowDate(iso: string): string {
  // Parse as a plain calendar date (avoid TZ drift).
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

// "departs ~every 26 months — next modeled window: <date>" for Mars/Venus;
// the human cadence note ("≈ monthly") when the API returns no single date
// (the Moon's LEO-vs-Moon synodic period collapses to ~0).
export function describeWindow(quote: Quote): string {
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
