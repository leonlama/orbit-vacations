// Presentation helpers — keep formatting out of the components.

export function formatUSD(value: number | null): string {
  if (value === null) return '—'
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toLocaleString('en-US', {
      maximumFractionDigits: 1,
    })}M`
  }
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
