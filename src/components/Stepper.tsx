import type { Step } from '../types'

const ORDER: { key: Step; label: string }[] = [
  { key: 'destination', label: 'Destination' },
  { key: 'rocket', label: 'Fare class' },
  { key: 'itinerary', label: 'Itinerary' },
  { key: 'seats', label: 'Seat' },
  { key: 'extras', label: 'Extras' },
  { key: 'passenger', label: 'Details' },
  { key: 'checkout', label: 'Payment' },
]

export function Stepper({ current }: { current: Step }) {
  // The hero is pre-flow; the confirmation is terminal. Show progress between.
  if (current === 'hero' || current === 'confirmation') return null
  const activeIndex = ORDER.findIndex((s) => s.key === current)
  const active = ORDER[activeIndex]

  return (
    <nav aria-label="Booking progress" className="flex items-center gap-3">
      {/* Numbered dots scale to 7 steps; only the active label shows. */}
      <div className="flex items-center gap-1.5">
        {ORDER.map((step, i) => {
          const state = i < activeIndex ? 'done' : i === activeIndex ? 'active' : 'todo'
          return (
            <span
              key={step.key}
              title={step.label}
              className={`h-2 rounded-full transition-all duration-300 ${
                state === 'active'
                  ? 'w-6 bg-amber'
                  : state === 'done'
                    ? 'w-2 bg-amber/60'
                    : 'w-2 bg-cream/20'
              }`}
            />
          )
        })}
      </div>
      <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-cream-dim">
        <span className="text-amber">{activeIndex + 1}</span>
        <span className="text-cream-dim/50">/{ORDER.length}</span>
        <span className="ml-2 hidden text-cream sm:inline">{active?.label}</span>
      </span>
    </nav>
  )
}
