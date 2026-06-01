import type { Catalog, Quote } from './types'

// Single-origin: `vercel dev` serves this app and the Python functions
// together, so we always call the API with relative paths.

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function getJson<T>(url: string): Promise<T> {
  let res: Response
  try {
    res = await fetch(url, { headers: { Accept: 'application/json' } })
  } catch {
    // Network / connection failure (e.g. API not running).
    throw new ApiError(
      'Could not reach mission control. Is the API running (vercel dev)?',
      0,
    )
  }

  let body: unknown = null
  try {
    body = await res.json()
  } catch {
    /* non-JSON body — handled below */
  }

  if (!res.ok) {
    const message =
      (body && typeof body === 'object' && 'error' in body
        ? String((body as { error: unknown }).error)
        : null) ?? `Request failed (${res.status}).`
    throw new ApiError(message, res.status)
  }

  return body as T
}

export function fetchCatalog(): Promise<Catalog> {
  return getJson<Catalog>('/api/catalog')
}

export function fetchQuote(
  destinationId: string,
  rocketId: string,
): Promise<Quote> {
  const params = new URLSearchParams({
    destination: destinationId,
    rocket: rocketId,
  })
  return getJson<Quote>(`/api/quote?${params.toString()}`)
}
