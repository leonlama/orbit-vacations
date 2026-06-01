import { useCallback, useEffect, useState } from 'react'
import { ApiError, fetchCatalog, fetchQuote } from './api'
import type { Catalog, Destination, Quote, Rocket, Step } from './types'
import { Hero } from './components/Hero'
import { Stepper } from './components/Stepper'
import { DestinationSelect } from './components/DestinationSelect'
import { RocketSelect } from './components/RocketSelect'
import { BoardingPass } from './components/BoardingPass'
import { FinePrint } from './components/FinePrint'
import { Brand, ErrorPanel, OrbitSpinner } from './components/ui'

export function App() {
  const [step, setStep] = useState<Step>('hero')

  // Catalog (loaded once, lazily when the flow begins).
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [loadingCatalog, setLoadingCatalog] = useState(false)

  // Selections.
  const [destination, setDestination] = useState<Destination | null>(null)
  const [rocket, setRocket] = useState<Rocket | null>(null)

  // Quote.
  const [quote, setQuote] = useState<Quote | null>(null)
  const [quoteError, setQuoteError] = useState<string | null>(null)
  const [loadingQuote, setLoadingQuote] = useState(false)

  const loadCatalog = useCallback(async () => {
    setLoadingCatalog(true)
    setCatalogError(null)
    try {
      setCatalog(await fetchCatalog())
    } catch (err) {
      setCatalogError(err instanceof Error ? err.message : 'Unknown error.')
    } finally {
      setLoadingCatalog(false)
    }
  }, [])

  const start = useCallback(() => {
    setStep('destination')
    if (!catalog) void loadCatalog()
  }, [catalog, loadCatalog])

  const chooseDestination = useCallback((d: Destination) => {
    setDestination(d)
    setRocket(null)
    setQuote(null)
    setStep('rocket')
  }, [])

  const loadQuote = useCallback(
    async (d: Destination, r: Rocket) => {
      setLoadingQuote(true)
      setQuoteError(null)
      setQuote(null)
      try {
        setQuote(await fetchQuote(d.id, r.id))
      } catch (err) {
        if (err instanceof ApiError && err.status === 400) {
          setQuoteError(
            `That combination isn't bookable: ${err.message}`,
          )
        } else {
          setQuoteError(err instanceof Error ? err.message : 'Unknown error.')
        }
      } finally {
        setLoadingQuote(false)
      }
    },
    [],
  )

  const chooseRocket = useCallback(
    (r: Rocket) => {
      setRocket(r)
      setStep('itinerary')
      if (destination) void loadQuote(destination, r)
    },
    [destination, loadQuote],
  )

  const rebook = useCallback(() => {
    setDestination(null)
    setRocket(null)
    setQuote(null)
    setQuoteError(null)
    setStep('destination')
  }, [])

  // Keep the document title in step with the flow.
  useEffect(() => {
    document.title =
      step === 'hero'
        ? 'orbit.vacations — Book your trip to space'
        : `orbit.vacations — ${cap(step)}`
  }, [step])

  return (
    <div className="bg-cosmos grain relative min-h-screen">
      <div className="starfield" aria-hidden />

      <div className="relative z-10">
        {step !== 'hero' && (
          <header className="sticky top-0 z-30 border-b border-cream/8 bg-space-950/70 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
              <button onClick={() => setStep('hero')} className="text-lg">
                <Brand />
              </button>
              <Stepper current={step} />
            </div>
          </header>
        )}

        <main className="pt-10 pb-6 sm:pt-14">
          {step === 'hero' && <Hero onStart={start} />}

          {step === 'destination' && (
            <CatalogGate
              loading={loadingCatalog}
              error={catalogError}
              onRetry={loadCatalog}
              ready={!!catalog}
            >
              {catalog && (
                <DestinationSelect
                  destinations={catalog.destinations}
                  selectedId={destination?.id ?? null}
                  onSelect={chooseDestination}
                />
              )}
            </CatalogGate>
          )}

          {step === 'rocket' && destination && catalog && (
            <RocketSelect
              rockets={catalog.rockets}
              destination={destination}
              selectedId={rocket?.id ?? null}
              onSelect={chooseRocket}
              onBack={() => setStep('destination')}
            />
          )}

          {step === 'itinerary' && (
            <ItineraryGate
              loading={loadingQuote}
              error={quoteError}
              onRetry={() =>
                destination && rocket && void loadQuote(destination, rocket)
              }
              onChangeRocket={() => setStep('rocket')}
              ready={!!quote}
            >
              {quote && (
                <BoardingPass
                  quote={quote}
                  onRebook={rebook}
                  onChangeRocket={() => setStep('rocket')}
                />
              )}
            </ItineraryGate>
          )}
        </main>

        {/* Show the conditions of carriage once a quote (with its disclaimer)
            exists; otherwise a tasteful default still appears in the footer. */}
        {step === 'itinerary' && quote && (
          <FinePrint assumptions={quote.assumptions} />
        )}
      </div>
    </div>
  )
}

function CatalogGate({
  loading,
  error,
  onRetry,
  ready,
  children,
}: {
  loading: boolean
  error: string | null
  onRetry: () => void
  ready: boolean
  children: React.ReactNode
}) {
  if (loading) return <CenterPad><OrbitSpinner label="Fetching destinations" /></CenterPad>
  if (error)
    return (
      <CenterPad>
        <ErrorPanel
          title="Mission control didn't answer"
          message={error}
          onRetry={onRetry}
        />
      </CenterPad>
    )
  if (!ready) return null
  return <>{children}</>
}

function ItineraryGate({
  loading,
  error,
  onRetry,
  onChangeRocket,
  ready,
  children,
}: {
  loading: boolean
  error: string | null
  onRetry: () => void
  onChangeRocket: () => void
  ready: boolean
  children: React.ReactNode
}) {
  if (loading)
    return <CenterPad><OrbitSpinner label="Plotting your transfer orbit" /></CenterPad>
  if (error)
    return (
      <CenterPad>
        <div className="space-y-5">
          <ErrorPanel
            title="We couldn't issue that ticket"
            message={error}
            onRetry={onRetry}
          />
          <div className="text-center">
            <button onClick={onChangeRocket} className="btn-ghost rounded-full px-6 py-2 text-sm">
              ← Pick a different rocket
            </button>
          </div>
        </div>
      </CenterPad>
    )
  if (!ready) return null
  return <>{children}</>
}

function CenterPad({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-[50vh] items-center justify-center px-6">{children}</div>
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
