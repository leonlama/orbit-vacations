import type { Step } from '../types'

const ORDER: { key: Step; label: string }[] = [
  { key: 'destination', label: 'Destination' },
  { key: 'rocket', label: 'Fare class' },
  { key: 'itinerary', label: 'Boarding pass' },
]

export function Stepper({ current }: { current: Step }) {
  // The hero is pre-flow; show progress only once a booking has begun.
  if (current === 'hero') return null
  const activeIndex = ORDER.findIndex((s) => s.key === current)

  return (
    <nav aria-label="Booking progress" className="flex items-center justify-center gap-2 sm:gap-4">
      {ORDER.map((step, i) => {
        const state = i < activeIndex ? 'done' : i === activeIndex ? 'active' : 'todo'
        return (
          <div key={step.key} className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full border font-mono text-[0.65rem] ${
                  state === 'active'
                    ? 'border-amber bg-amber text-space-950'
                    : state === 'done'
                      ? 'border-amber/60 text-amber'
                      : 'border-cream/25 text-cream-dim'
                }`}
              >
                {state === 'done' ? '✓' : i + 1}
              </span>
              <span
                className={`hidden font-mono text-[0.62rem] uppercase tracking-[0.2em] sm:inline ${
                  state === 'todo' ? 'text-cream-dim/60' : 'text-cream'
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < ORDER.length - 1 && (
              <span
                className={`h-px w-6 sm:w-10 ${i < activeIndex ? 'bg-amber/60' : 'bg-cream/20'}`}
              />
            )}
          </div>
        )
      })}
    </nav>
  )
}
