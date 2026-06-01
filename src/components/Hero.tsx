import { Brand } from './ui'

export function Hero({ onStart }: { onStart: () => void }) {
  return (
    <section className="relative mx-auto flex min-h-[88vh] max-w-5xl flex-col items-center justify-center px-6 text-center animate-rise">
      {/* floating brand stamp */}
      <div className="eyebrow mb-6 flex items-center gap-3">
        <span className="h-px w-8 bg-amber/60" />
        Interplanetary Passenger Service · Est. 2026
        <span className="h-px w-8 bg-amber/60" />
      </div>

      <h1 className="font-display text-5xl font-semibold leading-[0.95] tracking-tight text-cream sm:text-7xl md:text-8xl">
        Book your trip
        <br />
        <span className="italic text-amber">to space</span>
      </h1>

      <p className="mt-7 max-w-xl text-balance text-base leading-relaxed text-cream-dim sm:text-lg">
        A tongue-in-cheek travel agency for the inner solar system — where every
        fare is quoted in <span className="text-cream">real orbital mechanics</span>.
        Pick a world, pick a rocket, and we'll print your boarding pass.
      </p>

      <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
        <button
          onClick={onStart}
          className="btn-amber rounded-full px-8 py-3.5 text-base"
        >
          Plan your voyage →
        </button>
        <span className="font-mono text-xs uppercase tracking-[0.25em] text-cream-dim/70">
          3 destinations · 4 rockets
        </span>
      </div>

      {/* small planets parade */}
      <div className="mt-16 flex items-end gap-8 opacity-90">
        <Planet size={14} from="#c14a32" to="#7e2a1e" />
        <Planet size={22} from="#e9a23b" to="#b9603a" ring />
        <Planet size={10} from="#cdc2a8" to="#8d8470" />
        <Planet size={18} from="#74a89c" to="#163b66" />
      </div>

      <p className="mt-12 font-mono text-[0.65rem] uppercase tracking-[0.3em] text-cream-dim/50">
        <Brand /> — conditions of carriage apply
      </p>
    </section>
  )
}

function Planet({
  size,
  from,
  to,
  ring,
}: {
  size: number
  from: string
  to: string
  ring?: boolean
}) {
  return (
    <svg width={size * 4} height={size * 4} viewBox="0 0 100 100" aria-hidden>
      <defs>
        <radialGradient id={`p-${from}-${size}`} cx="0.38" cy="0.32" r="0.9">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </radialGradient>
      </defs>
      {ring && (
        <ellipse cx="50" cy="50" rx="46" ry="16" fill="none" stroke="#f6c25c" strokeWidth="3" opacity="0.55" transform="rotate(-20 50 50)" />
      )}
      <circle cx="50" cy="50" r="30" fill={`url(#p-${from}-${size})`} />
    </svg>
  )
}
