// Small shared UI primitives: the brand mark, an orbiting spinner, and a
// graceful error panel.

export function Brand({ className = '' }: { className?: string }) {
  return (
    <span className={`font-display font-semibold tracking-tight ${className}`}>
      orbit<span className="text-amber">.</span>vacations
    </span>
  )
}

// An orbiting-planet spinner — on-theme stand-in for a generic loader.
export function OrbitSpinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-4" role="status" aria-live="polite">
      <svg viewBox="0 0 64 64" className="h-16 w-16">
        <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(243,232,210,0.18)" strokeWidth="1.5" />
        <circle cx="32" cy="32" r="6" fill="var(--color-amber)" />
        <g className="animate-spin-slow" style={{ transformOrigin: '32px 32px' }}>
          <circle cx="58" cy="32" r="3.5" fill="var(--color-cream)" />
        </g>
      </svg>
      {label && (
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-cream-dim">
          {label}
        </p>
      )}
    </div>
  )
}

export function ErrorPanel({
  title,
  message,
  onRetry,
  retryLabel = 'Try again',
}: {
  title: string
  message: string
  onRetry?: () => void
  retryLabel?: string
}) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-coral/40 bg-space-850/70 p-8 text-center backdrop-blur">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-coral/50 text-coral">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 8v5" strokeLinecap="round" />
          <circle cx="12" cy="16.5" r="0.6" fill="currentColor" stroke="none" />
          <path d="M12 3 2 20h20L12 3Z" strokeLinejoin="round" />
        </svg>
      </div>
      <h3 className="font-display text-xl text-cream">{title}</h3>
      <p className="mt-2 text-sm text-cream-dim">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-ghost mt-5 rounded-full px-5 py-2 text-sm"
        >
          {retryLabel}
        </button>
      )}
    </div>
  )
}

export function PayloadBadge({
  basis,
}: {
  basis: 'demonstrated' | 'target' | 'published' | 'estimate'
}) {
  const isSoft = basis === 'target' || basis === 'estimate'
  const label =
    basis === 'target'
      ? 'design target · not yet flown'
      : basis === 'estimate'
        ? 'modeled estimate'
        : basis === 'published'
          ? 'published figure'
          : 'flight-proven'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[0.6rem] uppercase tracking-[0.18em] ${
        isSoft
          ? 'border-coral/50 bg-coral/10 text-rose'
          : 'border-teal/40 bg-teal/10 text-teal'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isSoft ? 'bg-coral' : 'bg-teal'}`} />
      {label}
    </span>
  )
}
