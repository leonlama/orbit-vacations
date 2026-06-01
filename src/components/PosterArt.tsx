// Hand-built mid-century travel-poster scenes per destination — flat color,
// geometric, limited palette. No external image assets.

interface Props {
  destinationId: string
  className?: string
}

export function PosterArt({ destinationId, className }: Props) {
  switch (destinationId) {
    case 'mars':
      return <MarsPoster className={className} />
    case 'venus':
      return <VenusPoster className={className} />
    case 'moon':
      return <MoonPoster className={className} />
    default:
      return <MarsPoster className={className} />
  }
}

function Stars({ seed = 0 }: { seed?: number }) {
  const pts = [
    [30, 28],
    [88, 18],
    [150, 40],
    [200, 22],
    [255, 52],
    [60, 70],
    [170, 92],
    [240, 100],
  ]
  return (
    <g fill="#f3e8d2">
      {pts.map(([x, y], i) => (
        <circle
          key={i}
          cx={x + ((seed * 7) % 11)}
          cy={y}
          r={i % 3 === 0 ? 1.6 : 1}
          opacity={0.85 - (i % 4) * 0.12}
        />
      ))}
    </g>
  )
}

function MarsPoster({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 280 360" className={className} role="img" aria-label="Mars travel poster">
      <defs>
        <linearGradient id="m-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a1430" />
          <stop offset="0.55" stopColor="#7a2c2a" />
          <stop offset="1" stopColor="#c14a32" />
        </linearGradient>
        <radialGradient id="m-planet" cx="0.35" cy="0.3" r="0.85">
          <stop offset="0" stopColor="#e98a52" />
          <stop offset="0.6" stopColor="#c14a32" />
          <stop offset="1" stopColor="#7e2a1e" />
        </radialGradient>
        <clipPath id="m-clip">
          <rect width="280" height="360" rx="20" />
        </clipPath>
      </defs>
      <g clipPath="url(#m-clip)">
        <rect width="280" height="360" fill="url(#m-sky)" />
        <Stars />
        {/* small high sun */}
        <circle cx="226" cy="56" r="20" fill="#f6c25c" opacity="0.9" />
        <circle cx="226" cy="56" r="30" fill="none" stroke="#f6c25c" strokeWidth="1" opacity="0.4" />
        {/* the red planet */}
        <circle cx="120" cy="150" r="78" fill="url(#m-planet)" />
        {/* surface markings */}
        <path d="M70 132 q26 -14 54 -4 q22 8 40 -2" fill="none" stroke="#7e2a1e" strokeWidth="5" opacity="0.5" strokeLinecap="round" />
        <ellipse cx="98" cy="170" rx="22" ry="9" fill="#7e2a1e" opacity="0.4" />
        <circle cx="150" cy="124" r="7" fill="#e98a52" opacity="0.6" />
        {/* tiny moon Phobos */}
        <circle cx="212" cy="150" r="7" fill="#d98a6a" />
        {/* foreground dunes */}
        <path d="M0 300 q70 -34 140 -6 q70 28 140 -8 V360 H0 Z" fill="#9a3a26" />
        <path d="M0 330 q60 -22 130 -4 q80 22 150 -6 V360 H0 Z" fill="#7e2a1e" />
        {/* a lone explorer flag for whimsy */}
        <line x1="196" y1="300" x2="196" y2="262" stroke="#f3e8d2" strokeWidth="2.5" />
        <path d="M196 262 l22 7 l-22 8 Z" fill="#e9a23b" />
      </g>
    </svg>
  )
}

function VenusPoster({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 280 360" className={className} role="img" aria-label="Venus travel poster">
      <defs>
        <linearGradient id="v-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a1c34" />
          <stop offset="0.5" stopColor="#b9603a" />
          <stop offset="1" stopColor="#e9a23b" />
        </linearGradient>
        <radialGradient id="v-planet" cx="0.4" cy="0.32" r="0.9">
          <stop offset="0" stopColor="#f3e8d2" />
          <stop offset="0.5" stopColor="#e9a23b" />
          <stop offset="1" stopColor="#b9603a" />
        </radialGradient>
        <clipPath id="v-clip">
          <rect width="280" height="360" rx="20" />
        </clipPath>
      </defs>
      <g clipPath="url(#v-clip)">
        <rect width="280" height="360" fill="url(#v-sky)" />
        <Stars seed={2} />
        {/* radiant retro sun rays */}
        <g stroke="#f6c25c" strokeWidth="2" opacity="0.35">
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i / 12) * Math.PI * 2
            return (
              <line
                key={i}
                x1={140 + Math.cos(a) * 96}
                y1={150 + Math.sin(a) * 96}
                x2={140 + Math.cos(a) * 130}
                y2={150 + Math.sin(a) * 130}
              />
            )
          })}
        </g>
        {/* cloud-wrapped planet */}
        <circle cx="140" cy="150" r="86" fill="url(#v-planet)" />
        <g fill="none" stroke="#b9603a" strokeWidth="6" opacity="0.45" strokeLinecap="round">
          <path d="M70 124 q70 -22 140 6" />
          <path d="M62 156 q78 22 156 -6" />
          <path d="M74 190 q66 24 132 0" />
        </g>
        {/* swirling cloud highlight */}
        <path d="M96 140 q40 -20 80 0" fill="none" stroke="#f3e8d2" strokeWidth="4" opacity="0.5" strokeLinecap="round" />
        {/* foreground hills */}
        <path d="M0 312 q80 -26 150 -2 q70 22 130 -6 V360 H0 Z" fill="#a14e2f" />
        <path d="M0 336 q70 -16 140 0 q80 14 140 -4 V360 H0 Z" fill="#7c3a26" />
      </g>
    </svg>
  )
}

function MoonPoster({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 280 360" className={className} role="img" aria-label="Moon travel poster">
      <defs>
        <linearGradient id="l-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#060914" />
          <stop offset="0.6" stopColor="#0f1530" />
          <stop offset="1" stopColor="#20294f" />
        </linearGradient>
        <radialGradient id="l-moon" cx="0.36" cy="0.32" r="0.9">
          <stop offset="0" stopColor="#f3e8d2" />
          <stop offset="0.7" stopColor="#cdc2a8" />
          <stop offset="1" stopColor="#8d8470" />
        </radialGradient>
        <radialGradient id="l-earth" cx="0.4" cy="0.35" r="0.9">
          <stop offset="0" stopColor="#74a89c" />
          <stop offset="0.6" stopColor="#2d6f9e" />
          <stop offset="1" stopColor="#163b66" />
        </radialGradient>
        <clipPath id="l-clip">
          <rect width="280" height="360" rx="20" />
        </clipPath>
      </defs>
      <g clipPath="url(#l-clip)">
        <rect width="280" height="360" fill="url(#l-sky)" />
        <Stars seed={4} />
        {/* LEO orbit ring (where the journey begins) */}
        <ellipse cx="118" cy="158" rx="118" ry="40" fill="none" stroke="#e9a23b" strokeWidth="1.5" strokeDasharray="4 6" opacity="0.5" transform="rotate(-18 118 158)" />
        {/* the Moon */}
        <circle cx="118" cy="150" r="80" fill="url(#l-moon)" />
        {/* craters */}
        <circle cx="92" cy="126" r="14" fill="#a89e86" opacity="0.55" />
        <circle cx="138" cy="168" r="20" fill="#a89e86" opacity="0.45" />
        <circle cx="150" cy="116" r="8" fill="#a89e86" opacity="0.5" />
        <circle cx="86" cy="178" r="9" fill="#a89e86" opacity="0.5" />
        {/* Earthrise, small in the corner */}
        <circle cx="230" cy="78" r="26" fill="url(#l-earth)" />
        <path d="M210 72 q14 -8 30 2 q-10 10 -28 6 Z" fill="#74a89c" opacity="0.7" />
        {/* a little lander on the surface */}
        <g transform="translate(150 250)">
          <path d="M-12 0 h24 l-4 -16 h-16 Z" fill="#cdc2a8" />
          <line x1="-12" y1="0" x2="-18" y2="12" stroke="#cdc2a8" strokeWidth="2" />
          <line x1="12" y1="0" x2="18" y2="12" stroke="#cdc2a8" strokeWidth="2" />
        </g>
        <path d="M0 300 q90 -10 180 4 q60 6 100 -2 V360 H0 Z" fill="#0c1024" opacity="0.9" />
      </g>
    </svg>
  )
}
