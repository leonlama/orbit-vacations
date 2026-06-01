import type { Destination } from '../types'
import { PosterArt } from './PosterArt'

export function DestinationSelect({
  destinations,
  selectedId,
  onSelect,
}: {
  destinations: Destination[]
  selectedId: string | null
  onSelect: (d: Destination) => void
}) {
  return (
    <section className="mx-auto max-w-6xl px-6 animate-rise">
      <header className="mb-10 text-center">
        <p className="eyebrow mb-3">Step 01 — Choose your world</p>
        <h2 className="font-display text-4xl font-semibold tracking-tight text-cream sm:text-5xl">
          Where shall we send you?
        </h2>
        <p className="mt-3 text-cream-dim">
          Three departures from Earth. Posters not to scale; physics is.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
        {destinations.map((d, i) => {
          const selected = d.id === selectedId
          return (
            <button
              key={d.id}
              onClick={() => onSelect(d)}
              style={{ animationDelay: `${i * 80}ms` }}
              className={`group relative flex flex-col overflow-hidden rounded-[--radius-poster] border text-left transition-all duration-300 animate-rise ${
                selected
                  ? 'border-amber shadow-[0_0_0_1px_var(--color-amber),0_18px_50px_-18px_rgba(233,162,59,0.5)]'
                  : 'border-cream/12 hover:-translate-y-1 hover:border-amber/50'
              }`}
            >
              {/* poster panel */}
              <div className="relative">
                <PosterArt
                  destinationId={d.id}
                  className="h-72 w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
                {/* ticket-stamp corner */}
                <span className="absolute right-3 top-3 rounded-full border border-cream/30 bg-space-950/60 px-3 py-1 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-cream backdrop-blur">
                  orbits {d.central_body}
                </span>
              </div>

              {/* label plate */}
              <div className="flex flex-1 flex-col gap-2 bg-space-850/80 p-5 backdrop-blur">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-display text-2xl font-semibold text-cream">
                    {d.name}
                  </h3>
                  <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-amber">
                    Visit
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-cream-dim">
                  {d.description}
                </p>
                <span
                  className={`mt-3 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] transition-colors ${
                    selected ? 'text-amber' : 'text-cream-dim group-hover:text-amber'
                  }`}
                >
                  {selected ? '✓ Selected' : 'Select destination →'}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
