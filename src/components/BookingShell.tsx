import type { ReactNode } from 'react'

// Shared layout for the booking sub-flow: a header, a main column, an
// optional sticky fare-summary aside, and a back/continue footer.
export function BookingShell({
  eyebrow,
  title,
  subtitle,
  children,
  aside,
  onBack,
  backLabel = '← Back',
  onContinue,
  continueLabel = 'Continue →',
  continueDisabled = false,
}: {
  eyebrow: string
  title: ReactNode
  subtitle?: ReactNode
  children: ReactNode
  aside?: ReactNode
  onBack?: () => void
  backLabel?: string
  onContinue?: () => void
  continueLabel?: string
  continueDisabled?: boolean
}) {
  return (
    <section className="mx-auto max-w-6xl px-6 animate-rise">
      <header className="mb-8 text-center">
        <p className="eyebrow mb-3">{eyebrow}</p>
        <h2 className="font-display text-4xl font-semibold tracking-tight text-cream sm:text-5xl">
          {title}
        </h2>
        {subtitle && <p className="mt-3 text-cream-dim">{subtitle}</p>}
      </header>

      <div
        className={
          aside
            ? 'grid grid-cols-1 gap-8 lg:grid-cols-[1fr_22rem]'
            : 'mx-auto max-w-3xl'
        }
      >
        <div className="min-w-0">{children}</div>
        {aside && (
          <div className="lg:sticky lg:top-24 lg:self-start">{aside}</div>
        )}
      </div>

      <div className="mt-10 flex flex-col items-center justify-between gap-3 sm:flex-row">
        {onBack ? (
          <button onClick={onBack} className="btn-ghost rounded-full px-6 py-2.5 text-sm">
            {backLabel}
          </button>
        ) : (
          <span />
        )}
        {onContinue && (
          <button
            onClick={onContinue}
            disabled={continueDisabled}
            className="btn-amber rounded-full px-8 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            {continueLabel}
          </button>
        )}
      </div>
    </section>
  )
}
