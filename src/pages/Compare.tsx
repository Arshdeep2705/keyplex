import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, X } from 'lucide-react'
import type { Pkg } from '../lib/types'
import { TYPE_LABEL } from '../lib/types'
import { fetchPublished } from '../lib/data'
import { dutiableValue, pkgYield, stampDuty } from '../lib/calc'
import { getCompliance } from '../lib/compliance'
import { money, pct, sqm } from '../lib/format'
import { useCompare } from '../lib/CompareContext'

export default function Compare() {
  const { slugs, toggle } = useCompare()
  const [all, setAll] = useState<Pkg[]>([])

  useEffect(() => {
    document.title = 'Compare Strategies — Keyplex'
    fetchPublished().then(setAll).catch(() => {})
  }, [])

  const pkgs = slugs.map((s) => all.find((p) => p.slug === s)).filter(Boolean) as Pkg[]

  const rows: { label: string; render: (p: Pkg) => React.ReactNode }[] = [
    { label: 'Strategy', render: (p) => <span className="font-semibold text-ink">{TYPE_LABEL[p.package_type]}</span> },
    { label: 'Total price', render: (p) => <span className="tnum font-display text-lg font-semibold text-ink">{money(p.price)}</span> },
    {
      label: 'Land + build split',
      render: (p) =>
        p.land_price && p.build_price ? (
          <span className="tnum">{money(p.land_price)} + {money(p.build_price)}</span>
        ) : ('—'),
    },
    { label: 'Contract', render: (p) => (p.contract_type === 'single_part' ? 'Single-part (SMSF-ready)' : 'Two-part H&L') },
    {
      label: 'Transfer duty (est.)',
      render: (p) => (
        <span className="tnum">
          {money(Math.round(stampDuty(p.state, dutiableValue(p))))}
          <span className="block text-[11px] text-mist">
            {p.contract_type === 'two_part' && p.land_price ? 'on land only' : 'on full price'}
          </span>
        </span>
      ),
    },
    { label: 'Config', render: (p) => `${p.beds} bed · ${p.baths} bath · ${p.cars} car` },
    { label: 'Land / house', render: (p) => `${sqm(p.land_size)} / ${sqm(p.house_area)}` },
    { label: 'Income streams', render: (p) => `${p.rooms_rentable ?? 1}` },
    {
      label: 'Projected weekly rent*',
      render: (p) => (p.total_weekly_rent ? <span className="tnum font-semibold text-growth">{money(p.total_weekly_rent)}/wk</span> : '—'),
    },
    {
      label: 'Projected gross yield*',
      render: (p) => (pkgYield(p) ? <span className="tnum font-semibold text-growth">{pct(pkgYield(p))}</span> : '—'),
    },
    {
      label: 'Typical management fee',
      render: (p) => (p.package_type === 'coliving' || p.package_type === 'rooming_house' ? '15–20% (by the room)' : '8–10% (standard)'),
    },
    {
      label: 'Lending treatment',
      render: (p) =>
        p.package_type === 'rooming_house' || (p.package_type === 'coliving' && (p.rooms_rentable ?? 0) >= (p.state === 'SA' ? 5 : 4))
          ? 'Specialist (LVR 60–70%)'
          : 'Standard residential',
    },
    { label: 'Compliance', render: (p) => getCompliance(p).classification },
    { label: 'Title status', render: (p) => p.title_status ?? '—' },
  ]

  return (
    <section className="bg-paper">
      <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
        <p className="eyebrow">Strategy comparison</p>
        <h1 className="display-tight mt-3 font-display text-[36px] font-semibold text-ink sm:text-[44px]">
          Compare side by side
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] text-muted">
          Not just properties — strategies. Duty treatment, lending, management costs and compliance
          differ by structure. Select up to 3 packages from the listings.
        </p>

        {pkgs.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-line py-24 text-center">
            <p className="font-display text-xl font-semibold text-ink">Nothing selected yet</p>
            <p className="mx-auto mt-2 max-w-md text-[14px] text-muted">
              Tap the compare button on any package card to add it here — try a co-living, a dual key
              and a standard house &amp; land to see the strategy difference.
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
              *Projected figures based on current market appraisals — not guaranteed. Duty estimates use
              general investor rates as at August 2026; confirm with your conveyancer.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
