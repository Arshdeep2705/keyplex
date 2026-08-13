import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Building2, KeyRound, Landmark, MapPin, Scale, ShieldCheck } from 'lucide-react'
import Reveal from '../components/Reveal'
import LeadForm from '../components/LeadForm'

const corridors = [
  {
    name: 'Melbourne South-East',
    suburbs: 'Clyde North · Cranbourne East · Pakenham',
    note: 'The dominant co-living corridor: deep room-by-room demand, strong infrastructure spend.',
  },
  {
    name: 'Melbourne West & North',
    suburbs: 'Tarneit · Cobblebank · Rockbank · Craigieburn',
    note: 'Fast-growing station precincts with entry prices that keep yields high.',
  },
  {
    name: 'Regional Victoria',
    suburbs: 'Winter Valley (Ballarat) · Armstrong Creek (Geelong) · Morwell',
    note: 'University, hospital and industry tenant bases with lower land costs.',
  },
  {
    name: 'Adelaide North',
    suburbs: 'Munno Para · Angle Vale · Elizabeth',
    note: 'Sub-1% vacancy and a brand-new co-living planning pathway — a first-mover market.',
  },
]

export default function WhyCoLiving() {
  useEffect(() => {
    document.title = 'Why Co-Living — Keyplex'
  }, [])

  return (
    <>
      <section className="blueprint grain relative bg-pine text-paper">
        <div className="mx-auto max-w-4xl px-5 py-20 text-center lg:px-8">
          <p className="eyebrow fade-up">The strategy guide</p>
          <h1 className="display-tight mt-4 font-display text-[38px] font-semibold leading-tight sm:text-[52px]">
            Why one roof should earn <em className="text-brass-bright">more than one rent</em>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-[16px] leading-relaxed text-paper/70">
            Australia has a structural mismatch: 61% of households are 1–2 people, but only 6% of
            housing stock is built for singles. Purpose-built co-living fills that gap — and pays
            its investors a premium for doing it.
          </p>
        </div>
      </section>

      {/* the maths */}
      <section className="bg-paper">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
            <Reveal>
              <p className="eyebrow">The maths</p>
              <h2 className="display-tight mt-3 font-display text-[30px] font-semibold text-ink sm:text-[36px]">
                Same street. Same land. Triple the income.
              </h2>
              <p className="mt-5 text-[15px] leading-relaxed text-muted">
                A standard 4-bedroom rental in a Melbourne growth corridor collects one rent —
                roughly $600–$700 a week. A purpose-built co-living home on the same street rents
                five ensuited rooms individually at $250–$350 each: $1,400–$2,200 a week, with
                projected gross yields of 7–9% instead of 4–5%.
              </p>
              <p className="mt-4 text-[15px] leading-relaxed text-muted">
                And the risk profile changes shape: when a standard rental goes vacant you lose 100%
                of income. When one of five rooms turns over, you lose 20% — while national vacancy
                sits near record lows (~1.7%, and below 1% in Adelaide).
              </p>
              <p className="mt-4 rounded-xl bg-brass-soft px-4 py-3 text-[13.5px] leading-relaxed text-ink/80">
                Honesty clause: co-living management costs more (15–20% vs 8–10%), owners typically
                pay utilities, and specialist insurance applies. Our calculators bake all of that in —
                the yields you see on Keyplex are modelled, not marketed.
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="space-y-3">
                {[
                  { label: 'Standard rental', rooms: [{ w: 100, rent: 650 }], total: '$650/wk', cls: 'bg-mist' },
                  {
                    label: 'Co-living — 5 ensuited rooms',
                    rooms: [300, 300, 300, 300, 300].map((r) => ({ w: 20, rent: r })),
                    total: '$1,500/wk',
                    cls: 'bg-growth',
                  },
                ].map((row) => (
                  <div key={row.label} className="rounded-2xl border border-line bg-card p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-[13.5px] font-semibold text-ink">{row.label}</span>
                      <span className="tnum font-display text-[18px] font-semibold text-ink">{row.total}*</span>
                    </div>
                    <div className="mt-3 flex gap-1.5">
                      {row.rooms.map((r, i) => (
                        <div
                          key={i}
                          style={{ width: `${r.w}%` }}
                          className={`tnum flex h-11 items-center justify-center rounded-md text-[11px] font-bold text-white ${row.cls}`}
                        >
                          ${r.rent}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <p className="text-[11.5px] text-mist">
                  *Illustrative example based on current growth-corridor appraisals. Projected, not guaranteed.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* compliance by state */}
      <section className="border-t border-line bg-paper">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <Reveal>
            <p className="eyebrow">Regulation, demystified</p>
            <h2 className="display-tight mt-3 max-w-2xl font-display text-[30px] font-semibold text-ink sm:text-[36px]">
              The rules are strict. That's exactly why the yields exist.
            </h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted">
              Licensing keeps casual operators out and supply thin — rooming houses are ~0.05% of
              Victorian stock. Compliance done properly is a moat, not a burden. Here's the honest map:
            </p>
          </Reveal>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <Reveal>
              <div className="h-full rounded-2xl border border-line bg-card p-7">
                <div className="flex items-center gap-3">
                  <Scale size={20} className="text-brass" />
                  <h3 className="font-display text-[20px] font-semibold text-ink">Victoria</h3>
                </div>
                <ul className="mt-5 space-y-3.5 text-[14px] leading-relaxed text-muted">
                  <li><strong className="text-ink">Trigger:</strong> 4+ unrelated paying occupants = rooming house (Residential Tenancies Act 1997).</li>
                  <li><strong className="text-ink">Three layers:</strong> council registration (prescribed accommodation) → BLA operator licence (fit-and-proper test) → Rooming House Standards Regulations 2023 minimum standards.</li>
                  <li><strong className="text-ink">Design envelope:</strong> Clause 52.23 exempts a permit when ≤300 m², ≤9 bedrooms, ≤12 residents — every Keyplex VIC design is engineered inside it and built NCC Class 1b.</li>
                  <li><strong className="text-ink">Teeth:</strong> unlicensed operation risks up to 2 years jail or $36k+/~$182k fines. Use licensed operators — verify them on the CAV public register.</li>
                  <li><strong className="text-ink">Sweetener:</strong> registered rooming houses charging below prescribed rents may qualify for land tax exemption.</li>
                </ul>
              </div>
            </Reveal>
            <Reveal delay={0.12}>
              <div className="h-full rounded-2xl border border-line bg-card p-7">
                <div className="flex items-center gap-3">
                  <Landmark size={20} className="text-brass" />
                  <h3 className="font-display text-[20px] font-semibold text-ink">South Australia</h3>
                </div>
                <ul className="mt-5 space-y-3.5 text-[14px] leading-relaxed text-muted">
                  <li><strong className="text-ink">Trigger:</strong> 5+ persons = designated rooming house, requiring CBS registration (since 30 Nov 2024).</li>
                  <li><strong className="text-ink">The opportunity:</strong> under the 2025 Accommodation Diversity framework, a home with 5 or fewer rented rooms keeps standard-dwelling planning treatment — a cleaner pathway than VIC.</li>
                  <li><strong className="text-ink">Market timing:</strong> Adelaide vacancy sits below 1% with very thin purpose-built supply — a genuine first-mover market.</li>
                  <li><strong className="text-ink">Same honesty:</strong> registration carries fit-and-proper tests and penalties including imprisonment for unregistered operation. We map each package's side of the line.</li>
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* finance truth */}
      <section className="blueprint grain relative bg-pine text-paper">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1fr_1fr]">
            <Reveal>
              <ShieldCheck size={24} className="text-brass-bright" />
              <h2 className="display-tight mt-4 font-display text-[30px] font-semibold sm:text-[36px]">
                The finance conversation nobody starts
              </h2>
              <p className="mt-5 text-[15px] leading-relaxed text-paper/70">
                Major banks often classify rooming-house-configured property as "specialised use":
                loan-to-value ratios capped at 60–70% instead of 80–90%, per-room income discounted
                for serviceability, and some lenders declining outright. Standard landlord insurance
                usually won't cover a rooming house either.
              </p>
              <p className="mt-4 text-[15px] leading-relaxed text-paper/70">
                This kills deals at the eleventh hour — which is why we surface it first. Dual key
                stock avoids it entirely (standard lending). For co-living and rooming houses, our
                broker panel works with co-living-friendly and specialist lenders, and every listing
                states its expected lending treatment.
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="space-y-4">
                {[
                  { icon: Building2, t: 'Dual key', d: 'Standard residential lending, 80–90% LVR, standard insurance. The gentle on-ramp.' },
                  { icon: KeyRound, t: 'Co-living (4–6 rooms)', d: 'Lender-dependent: some standard, some specialist. We match the lender before you sign.' },
                  { icon: MapPin, t: 'Rooming house (7–9 rooms)', d: 'Specialist lending, 60–70% LVR, specialist insurance — priced into every projection we show.' },
                ].map((f) => (
                  <div key={f.t} className="flex gap-4 rounded-2xl border border-line-dark/60 bg-pine-soft/60 p-5">
                    <f.icon size={20} className="mt-0.5 shrink-0 text-brass-bright" />
                    <div>
                      <p className="font-display text-[16.5px] font-semibold">{f.t}</p>
                      <p className="mt-1 text-[13.5px] leading-relaxed text-paper/60">{f.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* corridors */}
      <section className="bg-paper">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <Reveal>
            <p className="eyebrow">Where we buy</p>
            <h2 className="display-tight mt-3 font-display text-[30px] font-semibold text-ink sm:text-[36px]">
              Corridors, not postcodes
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {corridors.map((c, i) => (
              <Reveal key={c.name} delay={i * 0.08}>
                <div className="h-full rounded-2xl border border-line bg-card p-6 transition-all hover:-translate-y-0.5 hover:shadow-lift">
                  <h3 className="font-display text-[18px] font-semibold text-ink">{c.name}</h3>
                  <p className="mt-1 text-[13px] font-medium text-brass">{c.suburbs}</p>
                  <p className="mt-3 text-[14px] leading-relaxed text-muted">{c.note}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.2}>
            <Link
              to="/packages"
              className="group mt-10 inline-flex items-center gap-2 rounded-lg bg-pine px-6 py-3.5 text-[15px] font-semibold text-paper transition-all hover:shadow-lift"
            >
              See what's available now
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-line bg-paper">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 lg:grid-cols-2 lg:px-8">
          <Reveal>
            <h2 className="display-tight font-display text-[30px] font-semibold text-ink sm:text-[36px]">
              Want the full strategy mapped to your situation?
            </h2>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted">
              Borrowing capacity, SMSF structure, state selection, dual key vs co-living — a
              20-minute strategy call puts real numbers against each path.
            </p>
          </Reveal>
          <Reveal delay={0.12}>
            <LeadForm source="why_coliving" />
          </Reveal>
        </div>
      </section>
    </>
  )
}
