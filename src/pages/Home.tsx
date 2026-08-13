import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  ArrowRight,
  BadgeCheck,
  Calculator,
  ChevronDown,
  FileText,
  KeyRound,
  ScrollText,
  ShieldCheck,
  Timer,
  TrendingUp,
} from 'lucide-react'
import type { Pkg } from '../lib/types'
import { fetchPublished } from '../lib/data'
import PackageCard from '../components/PackageCard'
import Reveal from '../components/Reveal'
import LeadForm from '../components/LeadForm'

/* count-up that starts when visible */
function useCountUp(target: number, duration = 1400) {
  const [value, setValue] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        obs.disconnect()
        const start = performance.now()
        const tick = (now: number) => {
          const p = Math.min((now - start) / duration, 1)
          setValue(target * (1 - Math.pow(1 - p, 3)))
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      },
      { threshold: 0.4 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [target, duration])
  return { ref, value }
}

function Stat({ value, suffix, label, decimals = 0 }: { value: number; suffix: string; label: string; decimals?: number }) {
  const { ref, value: v } = useCountUp(value)
  return (
    <div>
      <p className="tnum font-display text-[34px] font-semibold leading-none text-brass-bright">
        <span ref={ref}>{v.toFixed(decimals)}</span>
        {suffix}
      </p>
      <p className="mt-2 text-[13px] leading-snug text-paper/60">{label}</p>
    </div>
  )
}

/* animated per-room income stack — the signature hero piece */
function IncomeStack() {
  const rooms = [
    { label: 'Room 1', rent: 300 },
    { label: 'Room 2', rent: 300 },
    { label: 'Room 3', rent: 300 },
    { label: 'Room 4', rent: 300 },
    { label: 'Room 5', rent: 300 },
  ]
  return (
    <div className="relative rounded-2xl border border-line-dark/70 bg-pine-soft/80 p-6 shadow-lift backdrop-blur">
      <p className="eyebrow">One co-living home</p>
      <div className="mt-4 space-y-2.5">
        {rooms.map((r, i) => (
          <motion.div
            key={r.label}
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.55 + i * 0.14, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center justify-between rounded-lg border border-line-dark/60 bg-pine px-4 py-2.5"
          >
            <span className="flex items-center gap-2.5 text-[13.5px] text-paper/85">
              <KeyRound size={14} className="text-brass-bright" />
              {r.label} · ensuite
            </span>
            <span className="tnum text-[13.5px] font-semibold text-paper">${r.rent}/wk</span>
          </motion.div>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.35, duration: 0.5 }}
        className="tnum mt-4 flex items-center justify-between rounded-xl bg-brass px-4 py-3.5"
      >
        <span className="text-[14px] font-bold text-pine">Combined income</span>
        <span className="font-display text-[22px] font-bold text-pine">$1,500/wk*</span>
      </motion.div>
      <p className="mt-3 text-[11px] text-paper/40">
        *Illustrative example. Projected, not guaranteed.
      </p>
    </div>
  )
}

const faqs = [
  {
    q: 'What exactly is a co-living investment?',
    a: 'A purpose-built home where each resident rents a private ensuited room on an individual agreement, while sharing kitchen and living spaces. You collect multiple rents from one property on one title — typically 7–9% gross yields versus 4–5% for a standard rental.',
  },
  {
    q: 'Is this legal? What about rooming house rules?',
    a: 'Yes — when built and operated correctly. In Victoria, 4+ unrelated paying occupants triggers rooming house registration, an operator licence and minimum standards; in SA the registration threshold is 5+ persons. Every Keyplex listing shows its exact compliance pathway, and our designs are built NCC Class 1b-compliant from day one.',
  },
  {
    q: 'Will the bank lend on a co-living property?',
    a: "This is the question most sellers dodge. Major banks often treat rooming-house-configured stock as 'specialised use' — LVRs of 60–70% and discounted per-room income are common. Dual key homes avoid this entirely, and our broker panel arranges co-living-friendly lenders for the rest. We put this on the table before you commit, not after.",
  },
  {
    q: 'What management fees should I expect?',
    a: 'Honest answer: 15–20% for co-living (versus 8–10% standard) because by-the-room management is more work. Our calculators default to 15% so the cashflow you see is realistic — many competitors quote yields with standard fees, which overstates returns.',
  },
  {
    q: 'What if a room sits empty?',
    a: 'That is the structural advantage: one empty room in a 5-room home costs ~20% of income, not 100% like a vacant standard rental. National vacancy is ~1.7% and room-by-room demand in growth corridors remains deep.',
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
    document.title = 'Keyplex — Multi-income homes. Built to perform.'
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
        <div className="relative mx-auto grid max-w-7xl gap-14 px-5 pb-20 pt-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:px-8 lg:pb-28 lg:pt-24">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="eyebrow"
            >
              Property investment, multiplied
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="display-tight mt-5 font-display text-[44px] font-semibold leading-[1.05] sm:text-[58px] lg:text-[64px]"
            >
              One address.
              <br />
              <em className="font-medium text-brass-bright">Five incomes.</em>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.22 }}
              className="mt-6 max-w-xl text-[16.5px] leading-relaxed text-paper/70"
            >
              Co-living, dual key and rooming house &amp; land packages across Victoria and South
              Australia — with transparent pricing, honest yield modelling and the compliance pathway
              mapped on every single listing. No gatekeeping, no mystery numbers.
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
                to="/why-co-living"
                className="rounded-lg border border-paper/25 px-6 py-3.5 text-[15px] font-semibold text-paper transition-colors hover:border-brass-bright hover:text-brass-bright"
              >
                How co-living works
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.55 }}
              className="mt-14 grid max-w-lg grid-cols-3 gap-8 border-t border-line-dark/60 pt-8"
            >
              <Stat value={9} suffix="%" label="gross yields, projected*" />
              <Stat value={4} suffix="×" label="rental income vs standard" />
              <Stat value={2} suffix=" states" label="VIC + SA growth corridors" />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <IncomeStack />
          </motion.div>
        </div>
      </section>

      {/* ——— YIELD GAP ——— */}
      <section className="border-b border-line bg-paper">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <Reveal>
            <p className="eyebrow">The yield gap</p>
            <h2 className="display-tight mt-3 max-w-2xl font-display text-[32px] font-semibold leading-tight text-ink sm:text-[38px]">
              Standard rentals average ~4%. Purpose-built multi-income homes project 7–9%.*
            </h2>
          </Reveal>
          <div className="mt-10 max-w-3xl space-y-5">
            {[
              { label: 'Standard house & land', pct: 4.2, width: 42, cls: 'bg-mist' },
              { label: 'Dual key home', pct: 6.5, width: 65, cls: 'bg-brass' },
              { label: 'Co-living (5 rooms)', pct: 8.8, width: 88, cls: 'bg-growth' },
            ].map((row, i) => (
              <Reveal key={row.label} delay={i * 0.12}>
                <div className="flex items-center gap-4">
                  <span className="w-44 shrink-0 text-[13.5px] font-medium text-muted">{row.label}</span>
                  <div className="h-9 flex-1 overflow-hidden rounded-lg bg-cream">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${row.width}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.2 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                      className={`flex h-full items-center justify-end rounded-lg px-3 ${row.cls}`}
                    >
                      <span className="tnum text-[13px] font-bold text-white">{row.pct}%</span>
                    </motion.div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.3}>
            <p className="mt-6 max-w-3xl text-[12px] text-mist">
              *Projected gross yields on current Keyplex packages, based on market rent appraisals —
              not guaranteed. Standard figure: national average ~3.6–4.7% (2026). Run any package
              through the on-page calculator with your own assumptions.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ——— FEATURED PACKAGES ——— */}
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

      {/* ——— DIFFERENTIATORS ——— */}
      <section className="blueprint grain relative bg-pine text-paper">
        <div className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
          <Reveal>
            <p className="eyebrow">Why Keyplex</p>
            <h2 className="display-tight mt-3 max-w-2xl font-display text-[32px] font-semibold leading-tight sm:text-[38px]">
              Everything on the table. <em className="text-brass-bright">Before</em> you commit.
            </h2>
            <p className="mt-4 max-w-2xl text-[15.5px] leading-relaxed text-paper/65">
              Most operators in this space hide prices behind discovery calls and quote yields with
              fantasy fees. We built Keyplex to do the opposite.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: FileText, title: 'Transparent pricing', body: 'Full price, land + build split, and an ungated designed brochure on every package. No "enquire for price".' },
              { icon: Calculator, title: 'Run your own numbers', body: 'Every listing has a live cashflow modeller with honest defaults — 15% co-living management, real vacancy allowances, your interest rate.' },
              { icon: ShieldCheck, title: 'Compliance, mapped', body: 'VIC and SA rooming house rules productized per listing: registration layers, Clause 52.23 checks, operator licensing — verified and dated.' },
              { icon: BadgeCheck, title: 'Finance readiness', body: 'We tell you upfront when specialist lending applies (60–70% LVRs on rooming stock) and arrange co-living-friendly lenders.' },
              { icon: KeyRound, title: 'SMSF-ready stock', body: 'Single-part contract packages flagged clearly — because SMSF buyers generally can\'t borrow for construction under LRBA rules.' },
              { icon: Timer, title: 'Minutes, not days', body: 'Enquiries route straight to a strategist. We aim to call back within minutes during business hours — because speed matters.' },
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

      {/* ——— HOW IT WORKS ——— */}
      <section className="bg-paper">
        <div className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
          <Reveal>
            <p className="eyebrow">The process</p>
            <h2 className="display-tight mt-3 font-display text-[32px] font-semibold text-ink sm:text-[38px]">
              From strategy call to rent day
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-8 md:grid-cols-4">
            {[
              { n: '01', t: 'Strategy session', b: 'Goals, borrowing capacity, SMSF status, state preference. We match strategy to circumstance — not stock to quota.' },
              { n: '02', t: 'Package + numbers', b: 'Shortlisted packages with full cashflow models, compliance pathway and finance plan. Take them to your own advisers.' },
              { n: '03', t: 'Secure + build', b: 'Land secured, fixed-price build contract signed. Progress updates at every stage through to handover.' },
              { n: '04', t: 'Compliance + tenants', b: 'Registration and licensing handled with specialist managers. Rooms marketed, tenanted and earning.' },
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
              The questions other sites avoid
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">
              Lending caps, management fees, licensing penalties — the co-living industry's awkward
              topics, answered in plain English.
            </p>
            <Link
              to="/why-co-living"
              className="group mt-6 inline-flex items-center gap-2 text-[14.5px] font-semibold text-growth hover:underline"
            >
              Read the full strategy guide
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
            <ScrollText size={26} className="text-brass-bright" />
            <h2 className="display-tight mt-5 font-display text-[34px] font-semibold leading-tight sm:text-[42px]">
              Ready to see the numbers on <em className="text-brass-bright">your</em> next property?
            </h2>
            <p className="mt-5 max-w-lg text-[15.5px] leading-relaxed text-paper/65">
              Book a strategy call. We'll map your borrowing position, shortlist packages that fit,
              and hand you the full cashflow model — including the fees other sellers leave out.
            </p>
            <p className="mt-8 flex items-center gap-3 text-[15px] text-paper/80">
              <TrendingUp size={18} className="text-brass-bright" />
              Average response time: minutes, not days.
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
