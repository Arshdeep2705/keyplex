import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, Search, SlidersHorizontal } from 'lucide-react'
import type { Pkg, PackageType } from '../lib/types'
import { TYPE_LABEL } from '../lib/types'
import { fetchPublished } from '../lib/data'
import PackageCard from '../components/PackageCard'
import Reveal from '../components/Reveal'

const TYPE_FILTERS: (PackageType | 'all')[] = ['all', 'house_land', 'dual_occupancy', 'dual_key']
const PRICE_STEPS = [600_000, 650_000, 700_000, 750_000, 800_000, 900_000, 1_000_000]

function Skeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-line bg-card">
      <div className="h-52 bg-cream" />
      <div className="space-y-3 p-5">
        <div className="h-5 w-3/4 rounded bg-cream" />
        <div className="h-4 w-1/2 rounded bg-cream" />
        <div className="h-10 rounded-xl bg-cream" />
        <div className="h-6 w-1/3 rounded bg-cream" />
      </div>
    </div>
  )
}

export default function Listings() {
  const [all, setAll] = useState<Pkg[] | null>(null)
  const [error, setError] = useState(false)
  const [type, setType] = useState<PackageType | 'all'>('all')
  const [state, setState] = useState('all')
  const [storeys, setStoreys] = useState(0)
  const [maxPrice, setMaxPrice] = useState(0)
  const [minBeds, setMinBeds] = useState(0)
  const [sort, setSort] = useState<'newest' | 'price_asc' | 'price_desc'>('newest')
  const [q, setQ] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const activeFilters =
    (state !== 'all' ? 1 : 0) + (storeys > 0 ? 1 : 0) + (maxPrice > 0 ? 1 : 0) + (minBeds > 0 ? 1 : 0) + (q.trim() ? 1 : 0)

  useEffect(() => {
    document.title = 'House & Land Packages — AU Build Hub'
    fetchPublished().then(setAll).catch(() => setError(true))
  }, [])

  const filtered = useMemo(() => {
    if (!all) return []
    let list = [...all]
    if (type !== 'all') list = list.filter((p) => p.package_type === type)
    if (state !== 'all') list = list.filter((p) => p.state === state)
    if (storeys > 0) list = list.filter((p) => p.storeys === storeys)
    if (maxPrice > 0) list = list.filter((p) => p.price <= maxPrice)
    if (minBeds > 0) list = list.filter((p) => p.beds >= minBeds)
    if (q.trim()) {
      const s = q.trim().toLowerCase()
      list = list.filter(
        (p) =>
          p.suburb.toLowerCase().includes(s) ||
          p.title.toLowerCase().includes(s) ||
          (p.design_name ?? '').toLowerCase().includes(s) ||
          (p.estate ?? '').toLowerCase().includes(s),
      )
    }
    switch (sort) {
      case 'price_asc':
        list.sort((a, b) => a.price - b.price)
        break
      case 'price_desc':
        list.sort((a, b) => b.price - a.price)
        break
    }
    return list
  }, [all, type, state, storeys, maxPrice, minBeds, sort, q])

  return (
    <>
      <section className="border-b border-line bg-pine text-paper">
        <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
          <p className="eyebrow fade-up">Live inventory</p>
          <h1 className="display-tight mt-3 font-display text-[36px] font-semibold sm:text-[44px]">
            House &amp; land packages
          </h1>
          <p className="mt-3 max-w-xl text-[15px] text-paper/65">
            Every package: full fixed price, live concept floorplan, repayment estimate and a free
            brochure. No appointments needed to see the numbers.
          </p>
        </div>
      </section>

      {/* filter bar — compact + collapsible on mobile, inline on desktop */}
      <section className="sticky top-[68px] z-30 border-b border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-5 py-3 lg:px-8">
          <div className="flex items-center gap-2.5">
            {/* type pills: horizontally scrollable, never wrap */}
            <div className="-mx-1 flex flex-1 gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {TYPE_FILTERS.map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`shrink-0 rounded-lg px-3.5 py-2.5 text-[13px] font-semibold transition-colors ${
                    type === t ? 'bg-pine text-paper' : 'bg-cream text-muted hover:bg-line'
                  }`}
                >
                  {t === 'all' ? 'All' : TYPE_LABEL[t]}
                </button>
              ))}
            </div>
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3.5 py-2.5 text-[13px] font-semibold transition-colors lg:hidden ${
                filtersOpen || activeFilters > 0 ? 'border-brass bg-brass-soft text-ink' : 'border-line bg-card text-muted'
              }`}
              aria-expanded={filtersOpen}
            >
              <SlidersHorizontal size={14} />
              Filters
              {activeFilters > 0 && (
                <span className="tnum rounded-full bg-brass px-1.5 text-[11px] font-bold text-pine">{activeFilters}</span>
              )}
              <ChevronDown size={14} className={`transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* detailed filters: dropdown panel on mobile, always-visible row on lg+ */}
          <div className={`${filtersOpen ? 'mt-3 grid' : 'hidden'} grid-cols-2 gap-2 lg:mt-3 lg:flex lg:flex-wrap lg:items-center lg:gap-2.5`}>
            <div className="relative col-span-2 lg:col-auto">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-mist" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Suburb, estate or design…"
                aria-label="Search by suburb, estate or design"
                className="field !py-2.5 !pl-9 text-[13.5px] lg:!w-52"
              />
            </div>
            <select value={state} onChange={(e) => setState(e.target.value)} aria-label="Filter by state" className="field !py-2.5 text-[13.5px] lg:!w-auto">
              <option value="all">All states</option>
              <option value="VIC">VIC</option>
              <option value="SA">SA</option>
            </select>
            <select value={storeys} onChange={(e) => setStoreys(Number(e.target.value))} aria-label="Filter by storeys" className="field !py-2.5 text-[13.5px] lg:!w-auto">
              <option value={0}>Any storeys</option>
              <option value={1}>Single storey</option>
              <option value={2}>Double storey</option>
            </select>
            <select value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} aria-label="Maximum price" className="field !py-2.5 text-[13.5px] lg:!w-auto">
              <option value={0}>Any price</option>
              {PRICE_STEPS.map((p) => (
                <option key={p} value={p}>
                  Under ${(p / 1000).toFixed(0)}k
                </option>
              ))}
            </select>
            <select value={minBeds} onChange={(e) => setMinBeds(Number(e.target.value))} aria-label="Minimum bedrooms" className="field !py-2.5 text-[13.5px] lg:!w-auto">
              <option value={0}>Any beds</option>
              {[3, 4, 5].map((b) => (
                <option key={b} value={b}>
                  {b}+ beds
                </option>
              ))}
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="Sort packages" className="field !py-2.5 text-[13.5px] lg:!w-auto">
              <option value="newest">Newest first</option>
              <option value="price_asc">Price: low → high</option>
              <option value="price_desc">Price: high → low</option>
            </select>
          </div>
        </div>
      </section>

      <section className="bg-paper">
        <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
          {error ? (
            <p className="py-20 text-center text-muted">
              Couldn't load packages — please refresh, or call us on 1300 539 759.
            </p>
          ) : all === null ? (
            <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} />
              ))}
            </div>
          ) : (
            <>
              <p className="tnum mb-6 text-[13.5px] text-muted">
                {filtered.length} package{filtered.length !== 1 ? 's' : ''}
                {type !== 'all' ? ` · ${TYPE_LABEL[type as PackageType]}` : ''}
                {state !== 'all' ? ` · ${state}` : ''}
              </p>
              {filtered.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-line py-20 text-center">
                  <p className="font-display text-lg font-semibold text-ink">No packages match those filters</p>
                  <p className="mt-2 text-[14px] text-muted">
                    Widen the search — or tell us what you're after and we'll package it for you.
                  </p>
                </div>
              ) : (
                <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
                  {filtered.map((pkg, i) => (
                    <Reveal key={pkg.id} delay={Math.min(i, 5) * 0.06}>
                      <PackageCard pkg={pkg} />
                    </Reveal>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  )
}
