import { Document, Font, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { Pkg } from '../lib/types'
import { TYPE_LABEL } from '../lib/types'
import { cashflow, defaultCashflowInputs, dutiableValue, pkgYield, stampDuty } from '../lib/calc'
import { getCompliance } from '../lib/compliance'
import { money, pct, sqm } from '../lib/format'
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
  muted: { color: MUTED },
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
  tag: {
    backgroundColor: PINE,
    color: BRASS_BRIGHT,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 3,
    fontSize: 7.5,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontWeight: 600,
    alignSelf: 'flex-start',
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
  const yieldPct = pkgYield(pkg)
  const inputs = defaultCashflowInputs(pkg)
  const cf = pkg.total_weekly_rent ? cashflow(inputs) : null
  const duty = stampDuty(pkg.state, dutiableValue(pkg))
  const compliance = getCompliance(pkg)
  const rooms = pkg.rooms_rentable ?? 0
  const isDualKey = pkg.package_type === 'dual_key' || pkg.package_type === 'dual_occupancy'
  const perRoom = pkg.rent_per_room ?? (rooms > 0 && pkg.total_weekly_rent ? pkg.total_weekly_rent / rooms : 0)
  const generated = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })

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
            <Text style={s.eyebrow}>Investment package · {TYPE_LABEL[pkg.package_type]}</Text>
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
              <Text style={s.metricLabel}>Total price</Text>
              <Text style={s.metricValue}>{money(pkg.price)}</Text>
              {pkg.land_price && pkg.build_price ? (
                <Text style={s.metricSub}>
                  Land {money(pkg.land_price)} + Build {money(pkg.build_price)}
                </Text>
              ) : null}
            </View>
            {yieldPct ? (
              <View style={s.metric}>
                <Text style={s.metricLabel}>Gross yield</Text>
                <Text style={[s.metricValue, { color: BRASS_BRIGHT }]}>{pct(yieldPct)}</Text>
                <Text style={s.metricSub}>Projected, not guaranteed</Text>
              </View>
            ) : null}
            {pkg.total_weekly_rent ? (
              <View style={s.metric}>
                <Text style={s.metricLabel}>Weekly income</Text>
                <Text style={s.metricValue}>{money(pkg.total_weekly_rent)}</Text>
                <Text style={s.metricSub}>{rooms} income stream{rooms === 1 ? '' : 's'}</Text>
              </View>
            ) : null}
            <View style={s.metric}>
              <Text style={s.metricLabel}>Configuration</Text>
              <Text style={s.metricValue}>
                {pkg.beds}·{pkg.baths}·{pkg.cars}
              </Text>
              <Text style={s.metricSub}>Bed · Bath · Car</Text>
            </View>
          </View>

          <Text style={{ fontSize: 7, color: '#7d8b83', marginTop: 22 }}>
            Multi-income homes. Built to perform. — Prepared {generated}. Images illustrative; may include upgrade items.
          </Text>
        </View>
      </Page>

      {/* ——— PAGE 2 · THE NUMBERS ——— */}
      <Page size="A4" style={[s.page, s.pagePad]}>
        <Text style={s.eyebrow}>Package summary</Text>
        <Text style={[s.h2, { marginTop: 6 }]}>The numbers</Text>

        <View style={[s.row, { gap: 16 }]}>
          <View style={{ flex: 1 }}>
            <View style={s.card}>
              <Text style={s.h3}>Property</Text>
              <KV k="Land size" v={sqm(pkg.land_size)} />
              <KV k="House area" v={sqm(pkg.house_area)} />
              <KV k="Lot width" v={pkg.lot_width ? `${pkg.lot_width} m` : '—'} />
              <KV k="Bedrooms / Bathrooms" v={`${pkg.beds} / ${pkg.baths}`} />
              {isDualKey && pkg.unit_beds ? <KV k="Unit configuration" v={`${pkg.unit_beds} bed · ${pkg.unit_baths} bath`} /> : null}
              <KV k="Title status" v={pkg.title_status ?? '—'} />
              <KV k="Build time" v={pkg.build_time_weeks ? `~${pkg.build_time_weeks} weeks` : '—'} />
              <KV k="Energy rating" v={pkg.energy_rating ? `${pkg.energy_rating} star` : '—'} />
              <KV
                k="Contract"
                v={pkg.contract_type === 'single_part' ? 'Single-part (SMSF-ready)' : 'Two-part H&L'}
              />
              <View style={[s.tableRow, { borderBottomWidth: 0 }]}>
                <Text style={{ color: MUTED, fontSize: 9 }}>Transfer duty (est.)</Text>
                <Text style={{ fontWeight: 600, fontSize: 9 }}>
                  {money(Math.round(duty))}{' '}
                  {pkg.contract_type === 'two_part' && pkg.land_price ? '(land only)' : ''}
                </Text>
              </View>
            </View>
          </View>

          <View style={{ flex: 1 }}>
            {pkg.total_weekly_rent ? (
              <View style={s.card}>
                <Text style={s.h3}>Projected rental income*</Text>
                {isDualKey ? (
                  <>
                    <KV k={`Main dwelling · ${pkg.beds}bd ${pkg.baths}ba`} v={`${money(pkg.total_weekly_rent - Math.round(pkg.total_weekly_rent * 0.4))}/wk`} />
                    {pkg.unit_beds ? <KV k={`Unit · ${pkg.unit_beds}bd ${pkg.unit_baths}ba`} v={`${money(Math.round(pkg.total_weekly_rent * 0.4))}/wk`} /> : null}
                  </>
                ) : (
                  Array.from({ length: rooms }).map((_, i) => (
                    <KV key={i} k={`Room ${i + 1} · ensuite + robe`} v={`${money(Math.round(perRoom))}/wk`} />
                  ))
                )}
                <View style={{ backgroundColor: '#E7F1EB', borderRadius: 5, padding: 8, marginTop: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontWeight: 600, fontSize: 9.5 }}>Combined</Text>
                  <Text style={{ fontWeight: 600, fontSize: 9.5, color: GROWTH }}>
                    {money(pkg.total_weekly_rent)}/wk · {pct(yieldPct)} gross
                  </Text>
                </View>
                {rooms > 1 ? (
                  <Text style={{ fontSize: 7.5, color: MUTED, marginTop: 7, lineHeight: 1.5 }}>
                    Vacancy resilience: one empty {isDualKey ? 'dwelling' : 'room'} costs ~
                    {Math.round(100 / Math.max(rooms, 1))}% of income — not 100% as with a single tenancy.
                  </Text>
                ) : null}
              </View>
            ) : null}

            {cf ? (
              <View style={[s.card, { marginTop: 12 }]}>
                <Text style={s.h3}>Cashflow snapshot*</Text>
                <KV k="Gross yield" v={pct(cf.grossYieldPct)} />
                <KV k="Net yield (after costs, pre-loan)" v={pct(cf.netYieldPct)} />
                <KV k={`Deposit (${inputs.depositPct}%)`} v={money(Math.round(cf.deposit))} />
                <View style={[s.tableRow, { borderBottomWidth: 0 }]}>
                  <Text style={{ color: MUTED, fontSize: 9 }}>Weekly cashflow (IO loan)</Text>
                  <Text style={{ fontWeight: 600, fontSize: 9, color: cf.weeklyCashflow >= 0 ? GROWTH : '#B3543E' }}>
                    {cf.weeklyCashflow >= 0 ? '+' : ''}
                    {money(Math.round(cf.weeklyCashflow))}
                  </Text>
                </View>
                <Text style={{ fontSize: 7, color: MUTED, marginTop: 6, lineHeight: 1.5 }}>
                  Assumptions: {inputs.ratePct}% interest-only, {inputs.vacancyPct}% vacancy, {inputs.mgmtPct}% management,{' '}
                  {money(inputs.insurancePerYear)} insurance, {money(inputs.ratesPerYear)} rates, {money(inputs.maintenancePerYear)} maintenance
                  {inputs.utilitiesPerYear ? `, ${money(inputs.utilitiesPerYear)} owner-paid utilities` : ''}. Model your own figures on the live listing.
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {pkg.highlights?.length ? (
          <View style={{ marginTop: 14 }}>
            <Text style={s.h3}>Why this package</Text>
            {pkg.highlights.map((h, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 6, marginBottom: 3.5 }}>
                <Text style={{ color: BRASS, fontWeight: 600 }}>—</Text>
                <Text style={{ fontSize: 9, color: MUTED, flex: 1 }}>{h}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <Footer pkg={pkg} pageNo="2" />
      </Page>

      {/* ——— PAGE 3 · INCLUSIONS + COMPLIANCE ——— */}
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

        <View style={{ marginTop: 14, backgroundColor: PINE, borderRadius: 8, padding: 16 }}>
          <Text style={[s.eyebrow]}>Compliance pathway · {pkg.state}</Text>
          <Text style={{ fontFamily: 'Fraunces', fontSize: 12.5, color: PAPER, marginTop: 5 }}>
            {compliance.classification}
          </Text>
          <Text style={{ fontSize: 8.5, color: '#B9C4BD', marginTop: 6, lineHeight: 1.55 }}>
            {compliance.summary}
          </Text>
          {compliance.checks.length ? (
            <View style={{ marginTop: 8 }}>
              {compliance.checks.map((c) => (
                <View key={c.label} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                  <Text style={{ fontSize: 8, color: '#B9C4BD' }}>
                    {c.pass === true ? '✓ ' : c.pass === false ? '✗ ' : '· '}
                    {c.label}
                  </Text>
                  <Text style={{ fontSize: 8, color: PAPER, fontWeight: 600 }}>{c.value}</Text>
                </View>
              ))}
            </View>
          ) : null}
          <Text style={{ fontSize: 7, color: '#7d8b83', marginTop: 8 }}>
            General information only, not legal advice. Compliance information last verified {compliance.lastVerified}.
          </Text>
        </View>

        <Footer pkg={pkg} pageNo="3" />
      </Page>

      {/* ——— PAGE 4 · FINANCE, NEXT STEPS, DISCLAIMERS ——— */}
      <Page size="A4" style={[s.page, s.pagePad]}>
        <Text style={s.eyebrow}>Getting it done</Text>
        <Text style={[s.h2, { marginTop: 6 }]}>Finance, next steps &amp; the fine print</Text>

        {compliance.financeNote ? (
          <View style={[s.card, { backgroundColor: '#F4ECDD', borderColor: '#E5D8BE' }]}>
            <Text style={s.h3}>Finance readiness</Text>
            <Text style={{ fontSize: 8.5, color: MUTED, lineHeight: 1.55 }}>{compliance.financeNote}</Text>
          </View>
        ) : (
          <View style={[s.card, { backgroundColor: '#F4ECDD', borderColor: '#E5D8BE' }]}>
            <Text style={s.h3}>Finance readiness</Text>
            <Text style={{ fontSize: 8.5, color: MUTED, lineHeight: 1.55 }}>
              This configuration is typically treated as standard residential by lenders. Our broker
              panel can pre-assess your borrowing position before you commit.
            </Text>
          </View>
        )}

        <View style={[s.card, { marginTop: 12 }]}>
          <Text style={s.h3}>Location · {pkg.suburb}, {pkg.state}</Text>
          <Text style={{ fontSize: 8.5, color: MUTED, lineHeight: 1.55 }}>
            {pkg.description ?? ''}
          </Text>
        </View>

        <View style={[s.card, { marginTop: 12, backgroundColor: PINE, borderColor: PINE }]}>
          <Text style={{ fontFamily: 'Fraunces', fontSize: 12.5, color: PAPER }}>Next steps</Text>
          <Text style={{ fontSize: 8.5, color: '#B9C4BD', marginTop: 6, lineHeight: 1.6 }}>
            1. Book a strategy call — 1300 539 759 or hello@keyplex.com.au{'\n'}
            2. Receive the full cashflow model and compliance map for this package{'\n'}
            3. Take everything to your own financial, legal and tax advisers{'\n'}
            4. Reserve with a fully refundable initial hold
          </Text>
        </View>

        <View style={{ marginTop: 14 }}>
          <Text style={{ fontSize: 7.5, fontWeight: 600, color: MUTED, marginBottom: 4 }}>IMPORTANT INFORMATION</Text>
          <Text style={{ fontSize: 6.8, color: MUTED, lineHeight: 1.55 }}>
            Price is based on the standard plan; floorplan changes cost extra. Facades and images are
            illustrative and may include upgrade items, non-standard landscaping, lighting and furniture.
            Stamp duty, legal and conveyancing costs are excluded unless stated. Floor-plan dimensions are
            approximate. All projected rents, yields, cashflows and growth figures are estimates based on
            the stated assumptions; they are illustrative only and not guaranteed — actual returns depend
            on occupancy, management and market conditions. Rooming house operation requires council
            registration, operator licensing and ongoing minimum standards compliance in VIC (4+ unrelated
            occupants), and CBS registration in SA (5+ persons). Lending for rooming-house-configured
            property may be restricted (typically 60–70% LVR) and specialist insurance is required. This
            document is general information only and does not constitute financial, legal or taxation
            advice. Keyplex recommends obtaining independent advice from licensed professionals before any
            investment decision. Prepared {generated}. Compliance information last verified {compliance.lastVerified}.
          </Text>
        </View>

        <Footer pkg={pkg} pageNo="4" />
      </Page>
    </Document>
  )
}
