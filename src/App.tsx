import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApiError, fetchCatalog, fetchQuote } from './api'
import type {
  Catalog,
  Destination,
  ExtrasState,
  Passenger,
  Quote,
  Rocket,
  SeatDef,
  Step,
} from './types'
import { computeBreakdown, makeBookingRef } from './lib/pricing'
import { Hero } from './components/Hero'
import { Stepper } from './components/Stepper'
import { DestinationSelect } from './components/DestinationSelect'
import { RocketSelect } from './components/RocketSelect'
import { BoardingPass } from './components/BoardingPass'
import { SeatSelect } from './components/SeatSelect'
import { ExtrasSelect } from './components/ExtrasSelect'
import { PassengerDetails } from './components/PassengerDetails'
import { Checkout } from './components/Checkout'
import { Confirmation } from './components/Confirmation'
import { FinePrint } from './components/FinePrint'
import { Brand, ErrorPanel, OrbitSpinner } from './components/ui'

const DEFAULT_EXTRAS: ExtrasState = {
  cryo: false,
  radiation: false,
  baggageKg: 0,
  habitat: null,
  roundTrip: false,
}

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

  // Booking journey.
  const [seat, setSeat] = useState<SeatDef | null>(null)
  const [extras, setExtras] = useState<ExtrasState>(DEFAULT_EXTRAS)
  const [passenger, setPassenger] = useState<Passenger>({ name: '', email: '' })
  const [bookingRef, setBookingRef] = useState<string | null>(null)

  const breakdown = useMemo(
    () => (quote ? computeBreakdown(quote, seat, extras) : null),
    [quote, seat, extras],
  )

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

  const resetBooking = useCallback(() => {
    setSeat(null)
    setExtras(DEFAULT_EXTRAS)
    setBookingRef(null)
  }, [])

  const chooseDestination = useCallback(
    (d: Destination) => {
      setDestination(d)
      setRocket(null)
      setQuote(null)
      resetBooking()
      setStep('rocket')
    },
    [resetBooking],
  )

  const loadQuote = useCallback(async (d: Destination, r: Rocket) => {
    setLoadingQuote(true)
    setQuoteError(null)
    setQuote(null)
    try {
      setQuote(await fetchQuote(d.id, r.id))
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        setQuoteError(`That combination isn't bookable: ${err.message}`)
      } else {
        setQuoteError(err instanceof Error ? err.message : 'Unknown error.')
      }
    } finally {
      setLoadingQuote(false)
    }
  }, [])

  const chooseRocket = useCallback(
    (r: Rocket) => {
      setRocket(r)
      setStep('itinerary')
      if (destination) void loadQuote(destination, r)
    },
    [destination, loadQuote],
  )

  const confirmPayment = useCallback(() => {
    if (destination) setBookingRef(makeBookingRef(destination.id))
    setStep('confirmation')
  }, [destination])

  const bookAnother = useCallback(() => {
    setDestination(null)
    setRocket(null)
    setQuote(null)
    setQuoteError(null)
    resetBooking()
    setStep('destination')
  }, [resetBooking])

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
                  onContinue={() => setStep('seats')}
                  onChangeRocket={() => setStep('rocket')}
                />
              )}
            </ItineraryGate>
          )}

          {step === 'seats' && quote && breakdown && (
            <SeatSelect
              quote={quote}
              breakdown={breakdown}
              selected={seat}
              onSelect={setSeat}
              onBack={() => setStep('itinerary')}
              onContinue={() => setStep('extras')}
            />
          )}

          {step === 'extras' && quote && breakdown && (
            <ExtrasSelect
              quote={quote}
              breakdown={breakdown}
              extras={extras}
              onChange={setExtras}
              onBack={() => setStep('seats')}
              onContinue={() => setStep('passenger')}
            />
          )}

          {step === 'passenger' && quote && breakdown && (
            <PassengerDetails
              quote={quote}
              breakdown={breakdown}
              passenger={passenger}
              onChange={setPassenger}
              onBack={() => setStep('extras')}
              onContinue={() => setStep('checkout')}
            />
          )}

          {step === 'checkout' && quote && breakdown && (
            <Checkout
              quote={quote}
              breakdown={breakdown}
              passenger={passenger}
              onBack={() => setStep('passenger')}
              onConfirm={confirmPayment}
            />
          )}

          {step === 'confirmation' && quote && breakdown && bookingRef && (
            <Confirmation
              quote={quote}
              breakdown={breakdown}
              seat={seat}
              extras={extras}
              passenger={passenger}
              bookingRef={bookingRef}
              onBookAnother={bookAnother}
            />
          )}
        </main>

        {/* The conditions of carriage live inside the itinerary/confirmation
            screens (which carry the engine's disclaimer); show a default in
            the pre-quote steps too. */}
        {step === 'itinerary' && quote && <FinePrint assumptions={quote.assumptions} />}
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
