import { KeyRound } from 'lucide-react'
import type { Pkg } from '../lib/types'
import { money, pct } from '../lib/format'
import { pkgYield } from '../lib/calc'

export default function IncomeTable({ pkg }: { pkg: Pkg }) {
  if (!pkg.total_weekly_rent) return null

  const isDualKey = pkg.package_type === 'dual_key' || pkg.package_type === 'dual_occupancy'
  const rooms = pkg.rooms_rentable ?? 0
  const perRoom = pkg.rent_per_room ?? (rooms > 0 ? pkg.total_weekly_rent / rooms : 0)

  const rows: { label: string; rent: number }[] = isDualKey
    ? [
        { label: `Main dwelling · ${pkg.beds}bd ${pkg.baths}ba`, rent: pkg.total_weekly_rent - (pkg.unit_beds ? Math.round(pkg.total_weekly_rent * 0.4) : 0) },
        ...(pkg.unit_beds
          ? [{ label: `Unit · ${pkg.unit_beds}bd ${pkg.unit_baths}ba`, rent: Math.round(pkg.total_weekly_rent * 0.4) }]
          : []),
      ]
    : Array.from({ length: rooms }, (_, i) => ({
        label: `Room ${i + 1} · ensuite + robe`,
        rent: Math.round(perRoom),
      }))

  const vacancyImpact = rows.length > 1 ? Math.round(100 / rows.length) : 100

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-card">
      <div className="border-b border-line bg-cream/60 px-6 py-5">
        <p className="eyebrow">Income streams</p>
        <h3 className="mt-1 font-display text-[18px] font-semibold text-ink">
          {rows.length} rent{rows.length > 1 ? 's' : ''} under one title
        </h3>
      </div>
      <div className="px-6 py-4">
        <ul className="divide-y divide-line/70">
          {rows.map((r, i) => (
            <li key={i} className="flex items-center justify-between py-3">
              <span className="flex items-center gap-2.5 text-[14px] text-ink">
                <KeyRound size={15} className="text-brass" />
                {r.label}
              </span>
              <span className="tnum text-[14px] font-semibold text-ink">{money(r.rent)}/wk</span>
            </li>
          ))}
        </ul>
        <div className="tnum mt-2 flex items-center justify-between rounded-xl bg-growth-soft px-4 py-3">
          <span className="text-[14px] font-semibold text-ink">Combined projected*</span>
          <span className="font-display text-[20px] font-semibold text-growth">
            {money(pkg.total_weekly_rent)}/wk · {pct(pkgYield(pkg))}
          </span>
        </div>
        {rows.length > 1 && (
          <p className="mt-3 text-[12.5px] leading-relaxed text-muted">
            Vacancy resilience: one empty {isDualKey ? 'dwelling' : 'room'} costs ~{vacancyImpact}% of
            income — not 100% like a single-tenancy rental.
          </p>
        )}
        <p className="mt-2 text-[11.5px] text-mist">*Projected, not guaranteed. Based on current market appraisals.</p>
      </div>
    </div>
  )
}
