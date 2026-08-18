import { BadgeCheck, CalendarClock, FileCheck2, Landmark, ShieldCheck, Zap } from 'lucide-react'
import type { Pkg } from '../lib/types'

export default function TrustCard({ pkg }: { pkg: Pkg }) {
  const rows = [
    {
      icon: BadgeCheck,
      title: 'Fixed price. Fixed site costs.',
      body: 'The price shown is the full turnkey price — site costs, approvals and permits are locked in the contract. No allowance games, no post-contract surprises.',
    },
    {
      icon: FileCheck2,
      title: 'Approvals included',
      body: 'Council approvals, building permits and termite treatment are all handled and included.',
    },
    {
      icon: Zap,
      title: `${pkg.energy_rating ?? 7}-star energy rated`,
      body: 'Built to the current 7-star NatHERS standard with double glazing — cheaper to run from day one.',
    },
    {
      icon: ShieldCheck,
      title: 'Your deposit is protected',
      body:
        pkg.state === 'VIC'
          ? 'Deposits are legally capped at 5%, and Domestic Building Insurance covers you up to $300,000 if the builder dies, disappears or becomes insolvent — plus Victoria’s implied 10-year structural warranty.'
          : 'Deposits are legally capped at 5%, and SA Building Indemnity Insurance covers you up to $250,000 if the builder dies, disappears or becomes insolvent — plus statutory builder warranties.',
    },
    {
      icon: CalendarClock,
      title: pkg.build_time_weeks ? `~${pkg.build_time_weeks} week build` : 'Fast site starts',
      body: `${pkg.title_status ?? 'Land status confirmed'} — we track title dates weekly so the timeline you see is real.`,
    },
    {
      icon: Landmark,
      title: 'Government incentives mapped',
      body:
        pkg.state === 'SA'
          ? 'SA first home buyers building new pay no stamp duty and receive the $15,000 First Home Owner Grant.'
          : 'VIC first home buyers: $10,000 FHOG on new homes plus duty exemption when the dutiable value is under $600k — on this two-part contract, duty applies to the land only.',
    },
  ]

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-card">
      <div className="border-b border-line bg-cream/60 px-6 py-5">
        <p className="eyebrow">The AU Build Hub promise</p>
        <h3 className="mt-1 font-display text-[18px] font-semibold text-ink">Certainty, in writing</h3>
      </div>
      <div className="space-y-5 px-6 py-5">
        {rows.map((r) => (
          <div key={r.title} className="flex gap-3.5">
            <r.icon size={18} className="mt-0.5 shrink-0 text-growth" />
            <div>
              <p className="text-[14px] font-semibold text-ink">{r.title}</p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-muted">{r.body}</p>
            </div>
          </div>
        ))}
        <p className="border-t border-line pt-4 text-[11.5px] text-mist">
          General information only. Grants and concessions subject to eligibility — verified August 2026.
        </p>
      </div>
    </div>
  )
}
