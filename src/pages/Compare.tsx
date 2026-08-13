import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, X } from 'lucide-react'
import type { Pkg } from '../lib/types'
import { TYPE_LABEL, toSquares } from '../lib/types'
import { fetchPublished } from '../lib/data'
import { dutiableValue, dutyWithConcession, estWeeklyRepayment, fhog } from '../lib/calc'
import { money, sqm } from '../lib/format'
import { useCompare } from '../lib/CompareContext'

export default function Compare() {
  const { slugs, toggle } = useCompare()
  const [all, setAll] = useState<Pkg[]>([])

  useEffect(() => {
    document.title = 'Compare Packages — Keyplex'
    fetchPublished().then(setAll).catch(() => {})
  }, [])

  const pkgs = slugs.map((s) => all.find((p) => p.slug === s)).filter(Boolean) as Pkg[]

  const rows: { label: string; render: (p: Pkg) => React.ReactNode }[] = [
    {
      label: 'Type',
      render: (p) => (
        <span className="font-semibold text-ink">
          {p.package_type === 'house_land' ? `${p.storeys > 1 ? 'Double' : 'Single'} storey` : TYPE_LABEL[p.package_type]}
        </span>
      ),
    },
    { label: 'Design', render: (p) => p.design_name ?? '—' },
    { label: 'Total price', render: (p) => <span className="tnum font-display text-lg font-semibold text-ink">{money(p.price)}</span> },
    {
      label: 'Land + build split',
      render: (p) =>
        p.land_price && p.build_price ? (
          <span className="tnum">{money(p.land_price)} + {money(p.build_price)}</span>
        ) : ('—'),
    },
    {
      label: 'Est. repayments*',
      render: (p) => <span className="tnum font-semibold text-growth">{money(Math.round(estWeeklyRepayment(p.price)))}/wk</span>,
    },
    {
      label: 'FHB transfer duty*',
      render: (p) => {
        const d = dutyWithConcession(p.state, dutiableValue(p), true)
        return (
          <span className="tnum">
            {d.duty === 0 ? <span className="font-bold text-growth">$0</span> : money(Math.round(d.duty))}
            {d.saving > 0 && <span className="block text-[11px] text-mist">saves {money(Math.round(d.saving))}</span>}
          </span>
        )
      },
    },
    {
      label: 'FHOG (new build)',
      render: (p) => {
        const g = fhog(p.state, p.price)
        return g ? <span className="tnum font-semibold text-growth">+{money(g)}</span> : '—'
      },
    },
    { label: 'Config', render: (p) => `${p.beds} bed · ${p.baths} bath · ${p.cars} car` },
    { label: 'House size', render: (p) => `${sqm(p.house_area)} · ${toSquares(p.house_area)}` },
    { label: 'Land / frontage', render: (p) => `${sqm(p.land_size)} · ${p.lot_width ?? '—'}m` },
    { label: 'Study / Alfresco', render: (p) => `${p.has_study ? 'Study' : '—'} / ${p.has_alfresco ? 'Alfresco' : '—'}` },
    { label: 'Title status', render: (p) => p.title_status ?? '—' },
    { label: 'Build time', render: (p) => (p.build_time_weeks ? `~${p.build_time_weeks} weeks` : '—') },
    {
      label: 'Rental appraisal',
      render: (p) => (p.total_weekly_rent ? <span className="tnum">{money(p.total_weekly_rent)}/wk</span> : '—'),
    },
  ]

  return (
    <section className="bg-paper">
      <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
        <p className="eyebrow">Package comparison</p>
        <h1 className="display-tight mt-3 font-display text-[36px] font-semibold text-ink sm:text-[44px]">
          Compare side by side
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] text-muted">
          Price, repayments, duty, grants, sizes and timelines — up to 3 packages at once. Add packages
          with the compare button on any card.
        </p>

        {pkgs.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-line py-24 text-center">
            <p className="font-display text-xl font-semibold text-ink">Nothing selected yet</p>
            <p className="mx-auto mt-2 max-w-md text-[14px] text-muted">
              Tap the compare button on any package card to add it here — try a single storey against a
              double storey to see the real cost difference.
            </p>
            <Link
              to="/packages"
              className="group mt-6 inline-flex items-center gap-2 rounded-lg bg-pine px-6 py-3 text-[14.5px] font-semibold text-paper transition-all hover:shadow-lift"
            >
              Browse packages
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        ) : (
          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr>
                  <th className="w-48 border-b border-line" />
                  {pkgs.map((p) => (
                    <td key={p.id} className="border-b border-line px-4 pb-5 align-top">
                      <div className="relative overflow-hidden rounded-xl border border-line">
                        {p.hero_image && <img src={p.hero_image} alt="" className="h-32 w-full object-cover" />}
                        <button
                          onClick={() => toggle(p.slug)}
                          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-ink/60 text-paper hover:bg-danger"
                          aria-label="Remove"
                        >
                          <X size={13} />
                        </button>
                      </div>
                      <Link to={`/packages/${p.slug}`} className="mt-3 block font-display text-[15.5px] font-semibold leading-snug text-ink hover:text-growth">
                        {p.title}
                      </Link>
                      <p className="text-[12.5px] text-muted">{p.suburb}, {p.state}</p>
                    </td>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label} className="border-b border-line/70">
                    <th className="py-3.5 pr-4 text-left text-[12.5px] font-semibold uppercase tracking-[0.06em] text-muted">
                      {row.label}
                    </th>
                    {pkgs.map((p) => (
                      <td key={p.id} className="px-4 py-3.5 text-[13.5px] text-ink/85">
                        {row.render(p)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-5 text-[11.5px] text-mist">
              *Repayments assume 10% deposit, 5.60% p.a., 30-year P&amp;I. FHB duty uses 2026 VIC/SA
              first-home-buyer rules for new builds (two-part contracts assessed on land only); subject to
              eligibility. Rental appraisals are projections, not guarantees.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
