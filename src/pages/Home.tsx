import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  ArrowRight,
  BadgeCheck,
  Calculator,
  ChevronDown,
  FileText,
  Landmark,
  PencilRuler,
  ShieldCheck,
  Timer,
} from 'lucide-react'
import type { Pkg } from '../lib/types'
import { fetchPublished } from '../lib/data'
import { generateFloorplan } from '../lib/floorplan'
import PackageCard from '../components/PackageCard'
import FloorplanSVG from '../components/FloorplanSVG'
import Reveal from '../components/Reveal'
import LeadForm from '../components/LeadForm'

/* interactive hero demo: specs in → concept plan out */
function PlanDemo() {
  const [beds, setBeds] = useState(4)
  const [storeys, setStoreys] = useState(1)
  const [study, setStudy] = useState(true)

  const plan = useMemo(
    () =>
      generateFloorplan({
        beds,
        baths: 2,
        cars: 2,
        living: 2,
        study,
        alfresco: true,
        storeys,
        houseArea: storeys > 1 ? 250 : 150 + beds * 18,
        lotWidth: 12.5,
        variant: 0,
      }),
    [beds, storeys, study],
  )

  const chip = (active: boolean) =>
    `rounded-lg border px-3.5 py-2 text-[13px] font-semibold transition-colors ${
      active ? 'border-brass bg-brass text-pine' : 'border-line-dark/70 text-paper/75 hover:border-brass'
    }`

  return (
    <div className="rounded-2xl border border-line-dark/70 bg-pine-soft/70 p-4 shadow-lift backdrop-blur">
      <div className="flex flex-wrap items-center gap-2 px-1 pb-3">
        <span className="eyebrow mr-1">Try it live</span>
        {[3, 4, 5].map((b) => (
          <button key={b} onClick={() => setBeds(b)} className={chip(beds === b)}>
            {b} bed
          </button>
        ))}
        <button onClick={() => setStoreys(storeys === 1 ? 2 : 1)} className={chip(storeys === 2)}>
          Double storey
        </button>
        <button onClick={() => setStudy(!study)} className={chip(study)}>
          Study
        </button>
      </div>
      <FloorplanSVG plan={plan} />
    </div>
  )
}

const faqs = [
  {
    q: 'Is the price really fixed?',
    a: 'Yes — every AU Build Hub package is full turnkey with fixed site costs written into the contract: approvals, permits, driveway, landscaping, fencing, blinds and flooring included. The price on the listing is the price you contract at, subject only to land availability.',
  },
  {
    q: 'How accurate are the floorplans?',
    a: 'The plans on each listing are auto-generated concept plans built from the real specifications — room counts, house area and lot width. They show you the layout logic and room sizes instantly. Final working drawings are prepared by the builder before contract and may differ in detail.',
  },
  {
    q: 'What can first home buyers get in 2026?',
    a: 'In Victoria: a $10,000 First Home Owner Grant on new homes plus a full stamp duty exemption when the dutiable value is under $600,000 — and on a two-part house & land contract, duty applies to the land only, so most of our VIC packages qualify. In South Australia: a $15,000 grant and no stamp duty at all for eligible buyers building new. Every listing calculates this for you.',
  },
  {
    q: 'How long does a build take?',
    a: 'Each listing shows its real build time — typically 22–32 weeks depending on the design — plus the land title status, which we track weekly. Titled lots can start site works within weeks of contract.',
  },
  {
    q: 'What protects me if something goes wrong?',
    a: 'Builds are covered by Domestic Building Insurance (VIC) or Building Indemnity Insurance (SA) plus statutory structural warranties. Deposits are capped by law, and progress payments follow the fixed schedule in your building contract.',
  },
]

function Faq() {
  const [open, setOpen] = useState(0)
  return (
    <div className="divide-y divide-line rounded-2xl border border-line bg-card">
      {faqs.map((f, i) => (
        <div key={i}>
          <button
            onClick={() => setOpen(open === i ? -1 : i)}
            className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
          >
            <span className="font-display text-[16.5px] font-semibold text-ink">{f.q}</span>
            <ChevronDown
              size={18}
              className={`shrink-0 text-brass transition-transform duration-300 ${open === i ? 'rotate-180' : ''}`}
            />
          </button>
          <div className={`grid transition-all duration-300 ${open === i ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
            <div className="overflow-hidden">
              <p className="px-6 pb-5 text-[14px] leading-relaxed text-muted">{f.a}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Home() {
  const [featured, setFeatured] = useState<Pkg[]>([])
  useEffect(() => {
    document.title = 'AU Build Hub — House & land, packaged in minutes.'
    fetchPublished().then((p) => setFeatured(p.slice(0, 3))).catch(() => {})
  }, [])

  return (
    <>
      {/* ——— HERO ——— */}
      <section className="blueprint grain relative overflow-hidden bg-pine text-paper">
        <div
          className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full opacity-25"
          style={{ background: 'radial-gradient(circle, #CBA76F 0%, transparent 65%)' }}
        />
        <div className="relative mx-auto grid max-w-7xl gap-14 px-5 pb-20 pt-16 lg:grid-cols-[1fr_1fr] lg:items-center lg:px-8 lg:pb-24 lg:pt-20">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="eyebrow"
            >
              House &amp; land, done properly
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="display-tight mt-5 font-display text-[42px] font-semibold leading-[1.06] sm:text-[54px] lg:text-[58px]"
            >
              Pick your block.
              <br />
              <em className="font-medium text-brass-bright">See your home. Instantly.</em>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.22 }}
              className="mt-6 max-w-xl text-[16.5px] leading-relaxed text-paper/70"
            >
              Fixed-price house &amp; land packages across Victoria and South Australia — every listing
              with the full price, a live concept floorplan, a designed brochure and your repayments
              calculated. No "contact us for pricing." Ever.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.34 }}
              className="mt-9 flex flex-wrap items-center gap-4"
            >
              <Link
                to="/packages"
                className="group flex items-center gap-2 rounded-lg bg-brass px-6 py-3.5 text-[15px] font-semibold text-pine transition-all hover:bg-brass-bright hover:shadow-lift"
              >
                Browse packages
                <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/buying-guide"
                className="rounded-lg border border-paper/25 px-6 py-3.5 text-[15px] font-semibold text-paper transition-colors hover:border-brass-bright hover:text-brass-bright"
              >
                First home buyer guide
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.55 }}
              className="mt-12 grid max-w-lg grid-cols-3 gap-8 border-t border-line-dark/60 pt-8"
            >
              <div>
                <p className="tnum font-display text-[30px] font-semibold leading-none text-brass-bright">$0</p>
                <p className="mt-2 text-[13px] leading-snug text-paper/60">stamp duty for most FHBs on our packages*</p>
              </div>
              <div>
                <p className="tnum font-display text-[30px] font-semibold leading-none text-brass-bright">100%</p>
                <p className="mt-2 text-[13px] leading-snug text-paper/60">of listings show the full fixed price</p>
              </div>
              <div>
                <p className="tnum font-display text-[30px] font-semibold leading-none text-brass-bright">7★</p>
                <p className="mt-2 text-[13px] leading-snug text-paper/60">energy rating on every home</p>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <PlanDemo />
          </motion.div>
        </div>
      </section>

      {/* ——— DUTY ON LAND ONLY ——— */}
      <section className="border-b border-line bg-paper">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <Reveal>
            <p className="eyebrow">The house &amp; land advantage</p>
            <h2 className="display-tight mt-3 max-w-2xl font-display text-[32px] font-semibold leading-tight text-ink sm:text-[38px]">
              Buy the package, pay duty on the land only.
            </h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted">
              On a two-part house &amp; land contract, stamp duty is assessed on the land — not the
              finished home. On a typical $769,000 package with $385,000 land, that's the difference
              between duty on $769k and duty on $385k. First home buyers under the VIC $600k threshold
              pay <strong className="text-ink">nothing at all</strong> — and SA has abolished it entirely
              for new-build FHBs.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-10 max-w-3xl rounded-2xl border border-line bg-card p-6">
              <div className="flex h-12 overflow-hidden rounded-lg">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: '50%' }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-center justify-center bg-brass text-[13px] font-bold text-pine"
                >
                  Land $385k — duty applies
                </motion.div>
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: '50%' }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-center justify-center bg-pine text-[13px] font-bold text-paper"
                >
                  Build $384k — duty free
                </motion.div>
              </div>
              <p className="tnum mt-4 text-[13px] text-muted">
                Established home at $769k: ≈ $41,210 duty · This package (investor): ≈ $18,170 ·{' '}
                <span className="font-semibold text-growth">First home buyer: $0</span>
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ——— FEATURED PACKAGES ——— */}
      {featured.length > 0 && (
      <section className="bg-paper">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <Reveal className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow">Fresh stock</p>
              <h2 className="display-tight mt-3 font-display text-[32px] font-semibold text-ink sm:text-[38px]">
                Latest packages
              </h2>
            </div>
            <Link
              to="/packages"
              className="group flex items-center gap-2 text-[14.5px] font-semibold text-growth hover:underline"
            >
              View all packages
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
          <div className="mt-10 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((pkg, i) => (
              <Reveal key={pkg.id} delay={i * 0.1}>
                <PackageCard pkg={pkg} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ——— DIFFERENTIATORS ——— */}
      <section className="blueprint grain relative bg-pine text-paper">
        <div className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
          <Reveal>
            <p className="eyebrow">Why AU Build Hub</p>
            <h2 className="display-tight mt-3 max-w-2xl font-display text-[32px] font-semibold leading-tight sm:text-[38px]">
              Everything on the table. <em className="text-brass-bright">Before</em> the sales office.
            </h2>
            <p className="mt-4 max-w-2xl text-[15.5px] leading-relaxed text-paper/65">
              Most builder sites hide prices, bury site costs and make you book an appointment to see a
              floorplan. We built AU Build Hub to do the opposite.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: FileText, title: 'Full transparent pricing', body: 'Total price with the land + build split on every card, and fixed site costs in the contract. No "from $XXX*" asterisk games.' },
              { icon: PencilRuler, title: 'Instant concept floorplans', body: 'Every package generates its floorplan live from the real specs — room sizes, dimensions and a room schedule, on the page and in the brochure.' },
              { icon: Calculator, title: 'Your repayments, calculated', body: 'Deposit, rate, term, first-home-buyer duty concessions and grants — every listing shows what it actually costs per week.' },
              { icon: Landmark, title: 'Grants & duty, mapped', body: '2026 VIC and SA first home buyer rules built into every listing: FHOG, duty exemptions, and the land-only duty advantage of two-part contracts.' },
              { icon: ShieldCheck, title: 'Certainty in writing', body: 'Approvals included, 7-star energy standard, builder insurance and statutory warranties spelled out per state.' },
              { icon: Timer, title: 'Real title dates', body: 'Land status tracked weekly — titled, under construction or forecast quarter. No stale listings for lots that sold months ago.' },
            ].map((f, i) => (
              <Reveal key={f.title} delay={i * 0.08}>
                <div className="h-full rounded-2xl border border-line-dark/60 bg-pine-soft/60 p-6 transition-colors hover:border-brass/50">
                  <f.icon size={22} className="text-brass-bright" />
                  <h3 className="mt-4 font-display text-[18px] font-semibold">{f.title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-paper/60">{f.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ——— PROCESS ——— */}
      <section className="bg-paper">
        <div className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
          <Reveal>
            <p className="eyebrow">The process</p>
            <h2 className="display-tight mt-3 font-display text-[32px] font-semibold text-ink sm:text-[38px]">
              From browsing to keys
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-8 md:grid-cols-4">
            {[
              { n: '01', t: 'Choose your package', b: 'Browse with real prices, real floorplans and real title dates. Compare up to three side by side.' },
              { n: '02', t: 'Lock the numbers', b: 'Fixed-price contract with fixed site costs. Grants and duty concessions confirmed for your situation, finance sorted with our broker panel.' },
              { n: '03', t: 'Watch it go up', b: 'Site start on titled land within weeks. Progress updates at every stage — slab, frame, lockup, fixing.' },
              { n: '04', t: 'Get the keys', b: 'Independent handover inspection, then move in — landscaping, driveway and blinds already done.' },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 0.1}>
                <div className="relative border-t-2 border-brass pt-6">
                  <span className="tnum font-display text-[15px] font-semibold text-brass">{s.n}</span>
                  <h3 className="mt-2 font-display text-[19px] font-semibold text-ink">{s.t}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-muted">{s.b}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ——— FAQ ——— */}
      <section className="border-t border-line bg-paper">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-24 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <Reveal>
            <p className="eyebrow">Straight answers</p>
            <h2 className="display-tight mt-3 font-display text-[32px] font-semibold leading-tight text-ink sm:text-[38px]">
              The questions builders dodge
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">
              Site costs, real build times, what the grants are actually worth — answered in plain
              English, with the 2026 numbers.
            </p>
            <Link
              to="/buying-guide"
              className="group mt-6 inline-flex items-center gap-2 text-[14.5px] font-semibold text-growth hover:underline"
            >
              Read the full buying guide
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
          <Reveal delay={0.15}>
            <Faq />
          </Reveal>
        </div>
      </section>

      {/* ——— CTA + LEAD ——— */}
      <section className="blueprint grain relative bg-pine text-paper">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-24 lg:grid-cols-2 lg:px-8">
          <Reveal>
            <BadgeCheck size={26} className="text-brass-bright" />
            <h2 className="display-tight mt-5 font-display text-[34px] font-semibold leading-tight sm:text-[42px]">
              Tell us your budget. We'll show you <em className="text-brass-bright">exactly</em> what it builds.
            </h2>
            <p className="mt-5 max-w-lg text-[15.5px] leading-relaxed text-paper/65">
              A quick call with an AU Build Hub consultant: your borrowing position, the grants you qualify
              for, and a shortlist of packages with floorplans and full numbers — usually same day.
            </p>
            <p className="mt-8 flex items-center gap-3 text-[15px] text-paper/80">
              <Timer size={18} className="text-brass-bright" />
              We respond in minutes during business hours.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <LeadForm source="home_cta" dark />
          </Reveal>
        </div>
      </section>
    </>
  )
}
