// The designed PDF e-ticket (a real laid-out document, not a screenshot) plus
// a client-side download helper. This module pulls in @react-pdf/renderer, so
// it is imported dynamically from the Confirmation screen — keeping the heavy
// PDF engine out of the initial bundle.

import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from '@react-pdf/renderer'
import type { TicketData } from '../lib/ticket'

// JPL travel-poster palette (mirrors the web theme).
const C = {
  navy: '#0a0f24',
  panel: '#121a3c',
  stub: '#0e1430',
  line: '#2a335c',
  cream: '#f3e8d2',
  creamDim: '#b3a888',
  amber: '#e9a23b',
  coral: '#e2654a',
  teal: '#74a89c',
}

// react-pdf ships these standard fonts; we lean on them (no network fetch) and
// let colour + layout carry the aesthetic. Times stands in for the display
// serif, Courier for the mono "boarding-pass" voice.
const styles = StyleSheet.create({
  page: {
    backgroundColor: C.navy,
    color: C.cream,
    fontFamily: 'Helvetica',
    padding: 18,
  },
  ticket: { flexGrow: 1, flexDirection: 'row' },
  main: { flexGrow: 1, paddingRight: 14 },
  perf: {
    width: 1,
    marginHorizontal: 9,
    borderLeftWidth: 1,
    borderLeftColor: C.creamDim,
    borderLeftStyle: 'dashed',
    position: 'relative',
  },
  notch: {
    position: 'absolute',
    left: -5,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.navy,
    borderWidth: 1,
    borderColor: C.line,
  },
  stub: { width: 188, paddingLeft: 4 },

  brand: { fontFamily: 'Times-Bold', fontSize: 19, color: C.amber },
  tag: { fontFamily: 'Courier', fontSize: 7.5, color: C.cream, letterSpacing: 2 },
  label: { fontFamily: 'Courier', fontSize: 6.5, color: C.creamDim, letterSpacing: 1.5 },
  big: { fontFamily: 'Times-Bold', fontSize: 22, color: C.cream },
  sub: { fontFamily: 'Courier', fontSize: 7, color: C.creamDim, letterSpacing: 1 },
  value: { fontSize: 10, color: C.cream, marginTop: 2 },
  mono: { fontFamily: 'Courier', fontSize: 10, color: C.cream, marginTop: 2 },

  fareRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 },
  fareLabel: { fontSize: 8.5, color: C.creamDim },
  fareAmount: { fontFamily: 'Courier', fontSize: 8.5, color: C.cream },

  footnote: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: C.line,
  },
  footLabel: { fontFamily: 'Courier', fontSize: 6, color: C.amber, letterSpacing: 1.5 },
  footText: { fontSize: 6.5, color: C.creamDim, marginTop: 2, lineHeight: 1.4 },
})

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={{ marginRight: 18 }}>
      <Text style={styles.label}>{label.toUpperCase()}</Text>
      <Text style={mono ? styles.mono : styles.value}>{value}</Text>
    </View>
  )
}

function Barcode({ bars }: { bars: number[] }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 34 }}>
      {bars.map((w, i) => (
        <View
          key={i}
          style={{
            width: w,
            height: 34,
            marginRight: 1.2,
            backgroundColor: i % 9 === 0 ? C.creamDim : C.cream,
          }}
        />
      ))}
    </View>
  )
}

export function TicketPdf({ data }: { data: TicketData }) {
  return (
    <Document
      title={`orbit.vacations e-ticket ${data.bookingRef}`}
      author="orbit.vacations"
      subject={`Boarding pass — Earth to ${data.route.to}`}
    >
      <Page size={[720, 340]} orientation="landscape" style={styles.page}>
        <View style={styles.ticket}>
          {/* ---- main ---- */}
          <View style={styles.main}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.brand}>orbit.vacations</Text>
              <Text style={styles.tag}>E-TICKET / BOARDING PASS</Text>
            </View>

            {/* route */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 16 }}>
              <View>
                <Text style={styles.label}>FROM</Text>
                <Text style={styles.big}>Earth</Text>
                <Text style={styles.sub}>{data.route.from}</Text>
              </View>
              <Text style={{ fontSize: 20, color: C.amber, marginHorizontal: 16, marginBottom: 4 }}>
                {'→'}
              </Text>
              <View>
                <Text style={styles.label}>TO</Text>
                <Text style={styles.big}>{data.route.to}</Text>
                <Text style={styles.sub}>orbits the {data.route.centralBody}</Text>
              </View>
            </View>

            {/* fields */}
            <View style={{ flexDirection: 'row', marginTop: 16, flexWrap: 'wrap' }}>
              <Field label="Passenger" value={data.passengerName} />
              <Field label="Trip" value={data.tripType} />
              <Field label="Travel time" value={data.travelTime} />
            </View>
            <View style={{ flexDirection: 'row', marginTop: 10, flexWrap: 'wrap' }}>
              <Field label="Rocket / fare class" value={data.rocketName} />
              <Field label="Seat" value={data.seatLabel} mono />
              <Field label="Total Δv" value={data.totalDvKms} mono />
            </View>

            <View style={{ marginTop: 10 }}>
              <Text style={styles.label}>DEPARTURES</Text>
              <Text style={[styles.value, { fontSize: 8.5, color: C.teal }]}>{data.windowText}</Text>
            </View>
          </View>

          {/* ---- perforation ---- */}
          <View style={styles.perf}>
            <View style={[styles.notch, { top: -5 }]} />
            <View style={[styles.notch, { bottom: -5 }]} />
          </View>

          {/* ---- stub ---- */}
          <View style={styles.stub}>
            <Text style={[styles.tag, { color: C.amber }]}>BOARDING PASS</Text>

            <View style={{ marginTop: 10 }}>
              <Text style={styles.label}>PASSENGER</Text>
              <Text style={styles.value}>{data.passengerName}</Text>
            </View>
            <View style={{ marginTop: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
              <View>
                <Text style={styles.label}>DEST</Text>
                <Text style={styles.value}>{data.route.to}</Text>
              </View>
              <View>
                <Text style={styles.label}>SEAT</Text>
                <Text style={styles.mono}>{data.seatLabel.split(' · ')[0]}</Text>
              </View>
            </View>

            <View style={{ marginTop: 8 }}>
              <Text style={styles.label}>BOOKING REF</Text>
              <Text style={{ fontFamily: 'Courier-Bold', fontSize: 13, color: C.cream, letterSpacing: 2, marginTop: 2 }}>
                {data.bookingRef}
              </Text>
            </View>

            {/* fare breakdown */}
            <View style={{ marginTop: 10, paddingTop: 6, borderTopWidth: 1, borderTopColor: C.line }}>
              <Text style={styles.label}>FARE — PAID IN Δv & USD</Text>
              {data.fareLines.map((l, i) => (
                <View key={i} style={styles.fareRow}>
                  <Text style={styles.fareLabel}>{l.label}</Text>
                  <Text style={styles.fareAmount}>{l.amount}</Text>
                </View>
              ))}
              <View style={[styles.fareRow, { marginTop: 5, paddingTop: 4, borderTopWidth: 1, borderTopColor: C.line }]}>
                <Text style={{ fontFamily: 'Courier', fontSize: 8, color: C.creamDim }}>TOTAL</Text>
                <Text style={{ fontFamily: 'Courier-Bold', fontSize: 11, color: C.amber }}>{data.totalFare}</Text>
              </View>
            </View>

            {/* faux barcode */}
            <View style={{ marginTop: 10 }}>
              <Barcode bars={data.barcode} />
              <Text style={{ fontFamily: 'Courier', fontSize: 6.5, color: C.creamDim, letterSpacing: 1, marginTop: 3 }}>
                {data.bookingRef} · BRD
              </Text>
            </View>
          </View>
        </View>

        {/* ---- conditions of carriage ---- */}
        <View style={styles.footnote}>
          <Text style={styles.footLabel}>CONDITIONS OF CARRIAGE</Text>
          <Text style={styles.footText}>{data.assumptions}</Text>
          <Text style={[styles.footText, { color: C.creamDim }]}>
            orbit.vacations · a tongue-in-cheek demo — real orbital mechanics under the hood. No real charge; not a real ticket.
          </Text>
        </View>
      </Page>
    </Document>
  )
}

// Generate the PDF in the browser and trigger a download.
export async function downloadTicketPdf(data: TicketData): Promise<void> {
  const blob = await pdf(<TicketPdf data={data} />).toBlob()
  const url = URL.createObjectURL(blob)
  try {
    const a = document.createElement('a')
    a.href = url
    a.download = data.filename
    document.body.appendChild(a)
    a.click()
    a.remove()
  } finally {
    URL.revokeObjectURL(url)
  }
}
