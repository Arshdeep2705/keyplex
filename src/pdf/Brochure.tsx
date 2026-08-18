import { Document, Font, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { Pkg } from '../lib/types'
import { TYPE_LABEL, toSquares } from '../lib/types'
import {
  HEADLINE_RATE,
  dutiableValue,
  dutyWithConcession,
  estWeeklyRepayment,
  fhog,
  monthlyRepayment,
} from '../lib/calc'
import { floorplanInput, generateFloorplan, roomSchedule } from '../lib/floorplan'
import { money, sqm } from '../lib/format'
import FloorplanPdf from './FloorplanPdf'
import fraunces from './fonts/Fraunces-SemiBold.ttf'
import archivo from './fonts/Archivo-Regular.ttf'
import archivoSemi from './fonts/Archivo-SemiBold.ttf'

Font.register({ family: 'Fraunces', src: fraunces })
Font.register({
  family: 'Archivo',
  fonts: [
    { src: archivo, fontWeight: 400 },
    { src: archivoSemi, fontWeight: 600 },
  ],
})
Font.registerHyphenationCallback((word) => [word])

const INK = '#0F1512'
const PINE = '#16241D'
const PAPER = '#FAF7F1'
const CREAM = '#F2ECDF'
const BRASS = '#B08D57'
const BRASS_BRIGHT = '#CBA76F'
const GROWTH = '#2E7D5B'
const LINE = '#E6E0D2'
const MUTED = '#5A655E'

const s = StyleSheet.create({
  page: { fontFamily: 'Archivo', fontSize: 9.5, color: INK, backgroundColor: PAPER },
  pagePad: { padding: 36 },
  eyebrow: { fontSize: 8, letterSpacing: 2.2, color: BRASS, textTransform: 'uppercase', fontWeight: 600 },
  h1: { fontFamily: 'Fraunces', fontSize: 26, color: PAPER, marginTop: 8, lineHeight: 1.15 },
  h2: { fontFamily: 'Fraunces', fontSize: 16, color: INK, marginBottom: 10 },
  h3: { fontFamily: 'Fraunces', fontSize: 11.5, color: INK, marginBottom: 5 },
  row: { flexDirection: 'row' },
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.75,
    borderTopColor: LINE,
    paddingTop: 7,
  },
  footerText: { fontSize: 7.5, color: MUTED },
  metric: { flex: 1 },
  metricLabel: { fontSize: 7.5, letterSpacing: 1.4, textTransform: 'uppercase', color: BRASS_BRIGHT, fontWeight: 600 },
  metricValue: { fontFamily: 'Fraunces', fontSize: 17, color: PAPER, marginTop: 3 },
  metricSub: { fontSize: 7, color: '#9BA8A0', marginTop: 2 },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5.5,
    borderBottomWidth: 0.75,
    borderBottomColor: LINE,
  },
  card: { backgroundColor: '#FFFFFF', borderWidth: 0.75, borderColor: LINE, borderRadius: 8, padding: 14 },
})

function Footer({ pkg, pageNo }: { pkg: Pkg; pageNo: string }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>Keyplex · 1300 539 759 · hello@keyplex.com.au</Text>
      <Text style={s.footerText}>
        {pkg.suburb} {pkg.state} · {pageNo}
      </Text>
    </View>
  )
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <View style={s.tableRow}>
      <Text style={{ color: MUTED, fontSize: 9 }}>{k}</Text>
      <Text style={{ fontWeight: 600, fontSize: 9 }}>{v}</Text>
    </View>
  )
}

export default function Brochure({ pkg }: { pkg: Pkg }) {
  const weekly = estWeeklyRepayment(pkg.price)
  const dutiable = dutiableValue(pkg)
  const dutyFhb = dutyWithConcession(pkg.state, dutiable, true)
  const dutyInv = dutyWithConcession(pkg.state, dutiable, false)
  const grant = fhog(pkg.state, pkg.price)
  const deposit10 = pkg.price * 0.1
  const monthly = monthlyRepayment(pkg.price - deposit10, HEADLINE_RATE, 30, false)
  const generated = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })

  const plan = generateFloorplan(floorplanInput(pkg))
  const schedule = roomSchedule(plan)

  return (
    <Document title={`${pkg.title} — Keyplex`} author="Keyplex">
      {/* ——— PAGE 1 · COVER ——— */}
      <Page size="A4" style={s.page}>
        {pkg.hero_image ? (
          <Image src={pkg.hero_image} style={{ width: '100%', height: 330, objectFit: 'cover' }} />
        ) : (
          <View style={{ width: '100%', height: 330, backgroundColor: CREAM }} />
        )}
        <View style={{ backgroundColor: PINE, flex: 1, padding: 36 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={s.eyebrow}>
              {pkg.package_type === 'house_land'
                ? `${pkg.storeys > 1 ? 'Double storey' : 'Single storey'} house & land`
                : TYPE_LABEL[pkg.package_type]}{' '}
              package
            </Text>
            <Text style={{ fontFamily: 'Fraunces', fontSize: 13, color: BRASS_BRIGHT }}>Keyplex</Text>
          </View>
          <Text style={s.h1}>{pkg.title}</Text>
          <Text style={{ color: '#9BA8A0', fontSize: 10, marginTop: 5 }}>
            {pkg.address_hint ? `${pkg.address_hint} · ` : ''}
            {pkg.estate ? `${pkg.estate} · ` : ''}
            {pkg.suburb}, {pkg.state} {pkg.postcode ?? ''}
          </Text>

          <View style={{ height: 1.5, backgroundColor: BRASS, width: 64, marginTop: 16, marginBottom: 18 }} />

          <View style={[s.row, { gap: 18 }]}>
            <View style={s.metric}>
              <Text style={s.metricLabel}>Fixed price</Text>
              <Text style={s.metricValue}>{money(pkg.price)}</Text>
              {pkg.land_price && pkg.build_price ? (
                <Text style={s.metricSub}>
                  Land {money(pkg.land_price)} + Build {money(pkg.build_price)}
                </Text>
              ) : null}
            </View>
            <View style={s.metric}>
              <Text style={s.metricLabel}>From per week</Text>
              <Text style={[s.metricValue, { color: BRASS_BRIGHT }]}>{money(Math.round(weekly))}</Text>
              <Text style={s.metricSub}>Est. repayments*</Text>
            </View>
            <View style={s.metric}>
              <Text style={s.metricLabel}>Home</Text>
              <Text style={s.metricValue}>
                {pkg.beds}·{pkg.baths}·{pkg.cars}
              </Text>
              <Text style={s.metricSub}>Bed · Bath · Car — {toSquares(pkg.house_area)}</Text>
            </View>
            <View style={s.metric}>
              <Text style={s.metricLabel}>Land</Text>
              <Text style={s.metricValue}>{pkg.land_size ?? '—'} m²</Text>
              <Text style={s.metricSub}>{pkg.title_status ?? ''}</Text>
            </View>
          </View>

          <Text style={{ fontSize: 7, color: '#7d8b83', marginTop: 22 }}>
            House &amp; land, packaged properly. — Prepared {generated}. Images illustrative; may include upgrade items.
          </Text>
        </View>
      </Page>

      {/* ——— PAGE 2 · FLOORPLAN ——— */}
      <Page size="A4" style={[s.page, s.pagePad]}>
        <Text style={s.eyebrow}>
          {pkg.design_name ? `The ${pkg.design_name}` : 'Concept design'} · ~{plan.areaM2} m² ·{' '}
          {toSquares(plan.areaM2)}
        </Text>
        <Text style={[s.h2, { marginTop: 6 }]}>Concept floor plan</Text>

        <View style={{ alignItems: 'center' }}>
          {plan.storeys.map((st) => (
            <View key={st.label} style={{ marginBottom: 6, alignItems: 'center' }}>
              <FloorplanPdf storey={st} maxW={520} maxH={plan.storeys.length > 1 ? 300 : 480} />
              {plan.storeys.length > 1 ? (
                <Text style={{ fontSize: 7.5, color: BRASS, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                  {st.label}
                </Text>
              ) : null}
            </View>
          ))}
        </View>

        <Text style={{ fontSize: 6.8, color: MUTED, marginTop: 8 }}>
          Auto-generated concept plan — indicative only, not for construction. Final working drawings are
          prepared by the builder and may differ. Dimensions approximate.
        </Text>

        <Footer pkg={pkg} pageNo="2" />
      </Page>

      {/* ——— PAGE 3 · ROOM SCHEDULE + PACKAGE DETAILS ——— */}
      <Page size="A4" style={[s.page, s.pagePad]}>
        <Text style={s.eyebrow}>The details</Text>
        <Text style={[s.h2, { marginTop: 6 }]}>Package summary &amp; room schedule</Text>

        <View style={[s.row, { gap: 16 }]}>
          <View style={{ flex: 1 }}>
            <View style={s.card}>
              <Text style={s.h3}>Property</Text>
              <KV k="Design" v={pkg.design_name ?? '—'} />
              <KV k="Storeys" v={String(pkg.storeys)} />
              <KV k="House area" v={`${sqm(pkg.house_area)} · ${toSquares(pkg.house_area)}`} />
              <KV k="Land size / frontage" v={`${sqm(pkg.land_size)} · ${pkg.lot_width ?? '—'} m`} />
              <KV k="Bed / Bath / Car" v={`${pkg.beds} / ${pkg.baths} / ${pkg.cars}`} />
              <KV k="Study / Alfresco" v={`${pkg.has_study ? 'Yes' : '—'} / ${pkg.has_alfresco ? 'Yes' : '—'}`} />
              <KV k="Title status" v={pkg.title_status ?? '—'} />
              <KV k="Build time" v={pkg.build_time_weeks ? `~${pkg.build_time_weeks} weeks` : '—'} />
              <KV k="Energy rating" v={pkg.energy_rating ? `${pkg.energy_rating} star` : '—'} />
              <View style={[s.tableRow, { borderBottomWidth: 0 }]}>
                <Text style={{ color: MUTED, fontSize: 9 }}>Contract</Text>
                <Text style={{ fontWeight: 600, fontSize: 9 }}>
                  {pkg.contract_type === 'two_part' ? 'Two-part (duty on land only)' : 'Single contract'}
                </Text>
              </View>
            </View>

            {pkg.highlights?.length ? (
              <View style={{ marginTop: 12 }}>
                <Text style={s.h3}>Why this package</Text>
                {pkg.highlights.map((h, i) => (
                  <View key={i} style={{ flexDirection: 'row', gap: 6, marginBottom: 3.5 }}>
                    <Text style={{ color: BRASS, fontWeight: 600 }}>—</Text>
                    <Text style={{ fontSize: 8.5, color: MUTED, flex: 1, lineHeight: 1.45 }}>{h}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          <View style={{ flex: 1 }}>
            <View style={s.card}>
              <Text style={s.h3}>Room schedule</Text>
              {schedule.map((r, i) => (
                <View key={i} style={s.tableRow}>
                  <Text style={{ color: MUTED, fontSize: 8.5 }}>
                    {r.name}
                    {plan.storeys.length > 1 ? ` · ${r.storey}` : ''}
                  </Text>
                  <Text style={{ fontWeight: 600, fontSize: 8.5 }}>{r.dims}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <Footer pkg={pkg} pageNo="3" />
      </Page>

      {/* ——— PAGE 4 · INCLUSIONS ——— */}
      <Page size="A4" style={[s.page, s.pagePad]}>
        <Text style={s.eyebrow}>Turnkey scope</Text>
        <Text style={[s.h2, { marginTop: 6 }]}>Full inclusions</Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {(pkg.inclusions ?? []).map((g) => (
            <View key={g.category} style={[s.card, { width: '48%' }]}>
              <Text style={s.h3}>{g.category}</Text>
              {g.items.map((item, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 5, marginBottom: 2.5 }}>
                  <Text style={{ color: GROWTH, fontSize: 8 }}>✓</Text>
                  <Text style={{ fontSize: 8, color: MUTED, flex: 1, lineHeight: 1.4 }}>{item}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        <Footer pkg={pkg} pageNo="4" />
      </Page>

      {/* ——— PAGE 5 · NUMBERS, NEXT STEPS, FINE PRINT ——— */}
      <Page size="A4" style={[s.page, s.pagePad]}>
        <Text style={s.eyebrow}>Your numbers</Text>
        <Text style={[s.h2, { marginTop: 6 }]}>Repayments, grants &amp; next steps</Text>

        <View style={[s.row, { gap: 16 }]}>
          <View style={{ flex: 1 }}>
            <View style={s.card}>
              <Text style={s.h3}>Repayment snapshot*</Text>
              <KV k="Deposit (10%)" v={money(Math.round(deposit10))} />
              <KV k="Loan amount" v={money(Math.round(pkg.price - deposit10))} />
              <KV k={`Monthly (${HEADLINE_RATE.toFixed(2)}% p.a., 30yr P&I)`} v={money(Math.round(monthly))} />
              <View style={[s.tableRow, { borderBottomWidth: 0 }]}>
                <Text style={{ color: MUTED, fontSize: 9 }}>Per week</Text>
                <Text style={{ fontWeight: 600, fontSize: 9, color: GROWTH }}>{money(Math.round(weekly))}</Text>
              </View>
            </View>

            <View style={[s.card, { marginTop: 12 }]}>
              <Text style={s.h3}>Stamp duty &amp; grants ({pkg.state})</Text>
              <KV
                k={`Duty — first home buyer${dutyFhb.saving > 0 ? ` (saves ${money(Math.round(dutyFhb.saving))})` : ''}`}
                v={dutyFhb.duty === 0 ? '$0' : money(Math.round(dutyFhb.duty))}
              />
              <KV k="Duty — investor / non-FHB" v={money(Math.round(dutyInv.duty))} />
              {grant > 0 ? <KV k="First Home Owner Grant (new build)" v={`+${money(grant)}`} /> : null}
              <View style={[s.tableRow, { borderBottomWidth: 0 }]}>
                <Text style={{ color: MUTED, fontSize: 9 }}>Duty assessed on</Text>
                <Text style={{ fontWeight: 600, fontSize: 9 }}>
                  {pkg.contract_type === 'two_part' && pkg.land_price ? `Land only (${money(dutiable)})` : 'Full price'}
                </Text>
              </View>
            </View>
          </View>

          <View style={{ flex: 1 }}>
            <View style={[s.card, { backgroundColor: PINE, borderColor: PINE }]}>
              <Text style={{ fontFamily: 'Fraunces', fontSize: 12.5, color: PAPER }}>Next steps</Text>
              <Text style={{ fontSize: 8.5, color: '#B9C4BD', marginTop: 6, lineHeight: 1.6 }}>
                1. Call 1300 539 759 or email hello@keyplex.com.au{'\n'}
                2. We confirm your grants, duty position and borrowing power{'\n'}
                3. Review the fixed-price contract with your own advisers{'\n'}
                4. Reserve with a refundable initial hold — then we build
              </Text>
            </View>

            <View style={[s.card, { marginTop: 12 }]}>
              <Text style={s.h3}>About {pkg.suburb}</Text>
              <Text style={{ fontSize: 8.5, color: MUTED, lineHeight: 1.55 }}>{pkg.description ?? ''}</Text>
            </View>
          </View>
        </View>

        <View style={{ marginTop: 14 }}>
          <Text style={{ fontSize: 7.5, fontWeight: 600, color: MUTED, marginBottom: 4 }}>IMPORTANT INFORMATION</Text>
          <Text style={{ fontSize: 6.8, color: MUTED, lineHeight: 1.55 }}>
            Price is based on the standard plan; floorplan changes cost extra. Facades and images are
            illustrative and may include upgrade items, non-standard landscaping, lighting and furniture.
            The concept floor plan in this document is auto-generated and indicative only — it is not a
            working drawing and must not be used for construction; final drawings are prepared by the
            builder. Floor-plan dimensions are approximate. Repayment estimates assume the inputs stated
            and are not a loan offer. Grants and duty concessions are subject to eligibility and may
            change; figures current as at {generated}. Stamp duty, legal and conveyancing costs are
            excluded unless stated. This document is general information only and does not constitute
            financial, legal or taxation advice — obtain independent advice before purchasing. Land
            subject to availability and developer approval.
          </Text>
        </View>

        <Footer pkg={pkg} pageNo="5" />
      </Page>
    </Document>
  )
}
