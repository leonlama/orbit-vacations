# orbit.vacations

A tongue-in-cheek travel-booking site for trips to space — where every "fare"
is **real orbital mechanics** under the hood (idealized coplanar Hohmann
transfers). Pick a world, pick a rocket, and we'll print your boarding pass.

## Stack

- **Engine** — pure Python stdlib, in [`api/orbital`](api/orbital).
- **API** — Vercel Python serverless functions: `GET /api/catalog`,
  `GET|POST /api/quote` (see [`api/`](api)).
- **Frontend** — React + TypeScript + Tailwind (Vite), in [`src/`](src).
  Retro space-age travel-agency aesthetic.

## Local development

The frontend and the Python API share **one origin** via `vercel dev`, so the
app calls the API with relative paths (`/api/catalog`, `/api/quote`):

```bash
npm install
vercel dev        # serves the Vite app + /api functions together
```

Frontend only (API calls will surface the graceful "mission control didn't
answer" error state):

```bash
npm run dev
```

## Tests

```bash
cd api && python3 -m pytest      # engine + endpoint tests
npm run build                    # type-check + production build
```
