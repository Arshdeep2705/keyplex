import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Banknote, FileCheck2, HandCoins, Landmark, ShieldCheck, Timer } from 'lucide-react'
import Reveal from '../components/Reveal'
import LeadForm from '../components/LeadForm'

const corridors = [
  {
    name: 'Melbourne South-East',
    suburbs: 'Clyde North · Cranbourne East · Officer',
    note: 'Established schools and town centres with the deepest choice of titled lots.',
  },
  {
    name: 'Melbourne West & North',
    suburbs: 'Tarneit · Cobblebank · Wollert · Craigieburn',
    note: 'Fast-growing station precincts with the sharpest land pricing in metro Melbourne.',
  },
  {
    name: 'Regional Victoria',
    suburbs: 'Winter Valley (Ballarat) · Armstrong Creek (Geelong)',
    note: 'Full-size blocks at prices metro cannot match, with hospitals and universities nearby.',
  },
  {
    name: 'Adelaide North',
    suburbs: 'Munno Para · Angle Vale',
    note: "Australia's best-value family blocks — and SA charges FHBs no stamp duty on new builds.",
  },
]

const steps = [
  { t: 'Get your borrowing sorted first', b: 'A pre-approval tells you your real budget. Under 20% deposit? The federal Home Guarantee Scheme lets eligible buyers purchase with 5% and no LMI — our broker panel checks your eligibility in one call.' },
  { t: 'Understand the two-part contract', b: 'A house & land package is two contracts: one for the land, one for the build. You only pay stamp duty on the land — and lenders progressively draw down the build loan, so you pay interest only on what has been built.' },
  { t: 'Stack your incentives', b: 'VIC: $10,000 FHOG for new homes plus duty exemption under $600k dutiable value. SA: $15,000 FHOG and zero stamp duty for new-build FHBs. Every AU Build Hub listing calculates your exact position.' },
  { t: 'Lock a fixed-price contract', b: 'The words that matter: "fixed site costs". Without them, rock or soil surprises become your bill. Every AU Build Hub package locks site costs in the contract price.' },
  { t: 'Track title and build stages', b: 'Titled land can start in weeks; untitled land waits for registration. Builds run slab → frame → lockup → fixing → handover with staged payments at each milestone, protected by state deposit caps and builder insurance.' },
]

export default function BuyingGuide() {
  useEffect(() => {
    document.title = 'First Home Buyer Guide — AU Build Hub'
  }, [])

  return (
    <>
      <section className="blueprint grain relative bg-pine text-paper">
        <div className="mx-auto max-w-4xl px-5 py-20 text-center lg:px-8">
          <p className="eyebrow fade-up">The buying guide</p>
          <h1 className="display-tight mt-4 font-display text-[38px] font-semibold leading-tight sm:text-[52px]">
            Building new is the <em className="text-brass-bright">cheapest way in</em> — if you know the rules
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-[16px] leading-relaxed text-paper/70">
            Between land-only stamp duty, first home buyer grants and 5% deposit schemes, a new house
            &amp; land package in 2026 can need less upfront cash than an older, smaller established
            home. Here's exactly how it works in Victoria and South Australia.
          </p>
        </div>
      </section>

      {/* the incentives */}
      <section className="bg-paper">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <Reveal>
            <p className="eyebrow">2026 incentives</p>
            <h2 className="display-tight mt-3 max-w-2xl font-display text-[30px] font-semibold text-ink sm:text-[36px]">
              What the government actually gives you
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <Reveal>
              <div className="h-full rounded-2xl border border-line bg-card p-7">
                <div className="flex items-center gap-3">
                  <Landmark size={20} className="text-brass" />
                  <h3 className="font-display text-[20px] font-semibold text-ink">Victoria</h3>
                </div>
                <ul className="mt-5 space-y-3.5 text-[14px] leading-relaxed text-muted">
                  <li><strong className="text-ink">$10,000 First Home Owner Grant</strong> for new homes up to $750,000.</li>
                  <li><strong className="text-ink">Stamp duty exemption</strong> when the dutiable value is under $600,000 — and on a two-part H&amp;L contract, that's the <em>land price only</em>. Most AU Build Hub VIC packages sit comfortably under it, so eligible FHBs pay $0.</li>
                  <li><strong className="text-ink">Sliding concession</strong> from $600k–$750k dutiable value.</li>
                  <li><strong className="text-ink">Off-the-plan benefits</strong> mean an established home at the same price can cost $30,000–$40,000 more in duty alone.</li>
                </ul>
              </div>
            </Reveal>
            <Reveal delay={0.12}>
              <div className="h-full rounded-2xl border border-line bg-card p-7">
                <div className="flex items-center gap-3">
                  <HandCoins size={20} className="text-brass" />
                  <h3 className="font-display text-[20px] font-semibold text-ink">South Australia</h3>
                </div>
                <ul className="mt-5 space-y-3.5 text-[14px] leading-relaxed text-muted">
                  <li><strong className="text-ink">$15,000 First Home Owner Grant</strong> for new builds — SA removed the property value cap for new homes.</li>
                  <li><strong className="text-ink">Zero stamp duty</strong> for eligible first home buyers building or buying a brand-new home — abolished with no price cap.</li>
                  <li><strong className="text-ink">The maths:</strong> on a $618,000 AU Build Hub package in Munno Para, an SA first home buyer keeps roughly $43,000 that an established-home buyer would hand to the government.</li>
                </ul>
              </div>
            </Reveal>
          </div>
          <Reveal delay={0.2}>
            <p className="mt-6 max-w-3xl text-[12px] text-mist">
              Figures current August 2026 and subject to eligibility (owner-occupier, residence
              requirements, citizenship/residency rules). Federal Home Guarantee Scheme: 5% deposit, no
              LMI, income caps removed from late 2025. Confirm your position with your conveyancer.
            </p>
          </Reveal>
        </div>
      </section>

      {/* five steps */}
      <section className="border-t border-line bg-paper">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <Reveal>
            <p className="eyebrow">Five things to get right</p>
            <h2 className="display-tight mt-3 font-display text-[30px] font-semibold text-ink sm:text-[36px]">
              The buyer's playbook
            </h2>
          </Reveal>
          <div className="mt-10 space-y-4">
            {steps.map((s, i) => (
              <Reveal key={s.t} delay={i * 0.06}>
                <div className="flex gap-5 rounded-2xl border border-line bg-card p-6">
                  <span className="tnum shrink-0 font-display text-[22px] font-semibold text-brass">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="font-display text-[18px] font-semibold text-ink">{s.t}</h3>
                    <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{s.b}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* protections */}
      <section className="blueprint grain relative bg-pine text-paper">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            <Reveal>
              <ShieldCheck size={24} className="text-brass-bright" />
              <h2 className="display-tight mt-4 font-display text-[30px] font-semibold sm:text-[36px]">
                What protects you when you build
              </h2>
              <p className="mt-5 text-[15px] leading-relaxed text-paper/70">
                Building with an unknown builder scares people — reasonably. The system has real
                protections, and a good package platform should spell them out rather than hide behind
                glossy renders.
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="space-y-4">
                {[
                  { icon: FileCheck2, t: 'Deposit caps', d: 'Builder deposits are capped by law (5% in VIC for builds over $20k) before insurance kicks in.' },
                  { icon: ShieldCheck, t: 'Builder insurance', d: 'Domestic Building Insurance (VIC) / Building Indemnity Insurance (SA) covers you if the builder dies, disappears or becomes insolvent.' },
                  { icon: Banknote, t: 'Staged payments', d: 'You pay in fixed legal stages — base, frame, lockup, fixing — only as work is actually completed.' },
                  { icon: Timer, t: 'Statutory warranties', d: 'Structural defects are covered for years after handover (implied warranties run up to 10 years in VIC).' },
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
            <p className="eyebrow">Where we package</p>
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
              Want your grants and duty position calculated properly?
            </h2>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted">
              Fifteen minutes with an AU Build Hub consultant: your borrowing power, every incentive you
              qualify for, and a shortlist of packages with the full numbers attached.
            </p>
          </Reveal>
          <Reveal delay={0.12}>
            <LeadForm source="buying_guide" />
          </Reveal>
        </div>
      </section>
    </>
  )
}
