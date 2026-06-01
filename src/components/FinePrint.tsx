import { Brand } from './ui'

// The engine's idealized-model disclaimer, dressed up as an airline's
// "conditions of carriage" — charming fine print.
export function FinePrint({ assumptions }: { assumptions: string | null }) {
  return (
    <footer className="mx-auto mt-24 max-w-3xl px-6 pb-16">
      <div className="rule-diamond mb-5">
        <span className="font-mono text-[0.58rem] uppercase tracking-[0.3em]">
          Conditions of Carriage
        </span>
      </div>
      <div className="rounded-xl border border-cream/10 bg-space-900/40 p-6">
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-amber">
          §1 · The fine print of spaceflight
        </p>
        <p className="mt-3 text-xs leading-relaxed text-cream-dim">
          {assumptions ??
            'Fares are quoted on an idealized two-impulse Hohmann model. Figures are for entertainment and back-of-the-envelope planning only.'}
        </p>
        <p className="mt-4 text-xs leading-relaxed text-cream-dim/80">
          §2 · <span className="text-cream-dim">Prices</span> are quoted in Δv
          (km/s) and US dollars at the gate. Trans-orbital injection energies,
          plane changes, gravity losses and the inconvenient eccentricity of
          real planets are not your travel agent's responsibility. Snacks not
          included. Re-entry sold separately.
        </p>
        <p className="mt-6 text-center font-mono text-[0.6rem] uppercase tracking-[0.3em] text-cream-dim/50">
          <Brand /> · a tongue-in-cheek demo · real orbital mechanics under the hood
        </p>
      </div>
    </footer>
  )
}
