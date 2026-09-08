import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, Heart, Search, SlidersHorizontal } from 'lucide-react'
import type { Pkg, PackageType } from '../lib/types'
import { TYPE_LABEL } from '../lib/types'
import { fetchPublished } from '../lib/data'
import { SITE } from '../lib/site'
import { useShortlist } from '../lib/ShortlistContext'
import PackageCard from '../components/PackageCard'
import LeadForm from '../components/LeadForm'

const TYPE_FILTERS: (PackageType | 'all')[] = ['all', 'house_land', 'dual_occupancy', 'dual_key']
const PRICE_STEPS = [600_000, 650_000, 700_000, 750_000, 800_000, 900_000, 1_000_000]

function Skeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-card">
      <div className="shimmer h-52" />
      <div className="space-y-3 p-5">
        <div className="shimmer h-5 w-3/4 rounded" />
        <div className="shimmer h-4 w-1/2 rounded" />
        <div className="shimmer h-10 rounded-xl" />
        <div className="shimmer h-6 w-1/3 rounded" />
      </div>
    </div>
  )
}

export default function Listings() {
  const [params, setParams] = useSearchParams()
  const shortlist = useShortlist()
  const [all, setAll] = useState<Pkg[] | null>(null)
  const [error, setError] = useState(false)
  const [type, setType] = useState<PackageType | 'all'>('all')
  const [state, setState] = useState('all')
  const [storeys, setStoreys] = useState(0)
  const [maxPrice, setMaxPrice] = useState(0)
  const [minBeds, setMinBeds] = useState(0)
  const [sort, setSort] = useState<'newest' | 'price_asc' | 'price_desc' | 'move_in'>('newest')
  const [q, setQ] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const onlySaved = params.get('shortlist') === '1'

  const activeFilters =
    (state !== 'all' ? 1 : 0) + (storeys > 0 ? 1 : 0) + (maxPrice > 0 ? 1 : 0) + (minBeds > 0 ? 1 : 0) + (q.trim() ? 1 : 0)

  useEffect(() => {
    document.title = 'House & Land Packages — AU Build Hub'
    fetchPublished().then(setAll).catch(() => setError(true))
  }, [])

  function setOnlySaved(on: boolean) {
    const next = new URLSearchParams(params)
    if (on) next.set('shortlist', '1')
    else next.delete('shortlist')
    setParams(next, { replace: true })
  }

  const filtered = useMemo(() => {
    if (!all) return []
    let list = [...all]
    if (onlySaved) list = list.filter((p) => shortlist.has(p.slug))
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
      case 'move_in':
        // titled first, then shortest build
        list.sort(
          (a, b) =>
            Number(/titled/i.test(b.title_status ?? '')) - Number(/titled/i.test(a.title_status ?? '')) ||
            (a.build_time_weeks ?? 99) - (b.build_time_weeks ?? 99),
        )
        break
    }
    return list
  }, [all, type, state, storeys, maxPrice, minBeds, sort, q, onlySaved, shortlist])

  const nothingListed = all !== null && all.length === 0

  return (
    <>
      <section className="blueprint grain relative border-b border-line bg-pine text-paper">
        <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
          <p className="eyebrow fade-up flex items-center gap-2.5">
            <span className="live-dot relative inline-block h-2 w-2 rounded-full bg-growth" />
            Live inventory
          </p>
          <h1 className="display-tight mt-3 font-display text-[36px] font-semibold sm:text-[44px]">
            House &amp; land packages
          </h1>
          <p className="mt-3 max-w-xl text-[15px] text-paper/65">
            Every package: full fixed price, live floorplan and 3D model, repayment estimate, a move-in
            date and a free brochure. No appointments needed to see the numbers.
          </p>
        </div>
      </section>

      {/* filter bar — compact + collapsible on mobile, inline on desktop */}
      <section className="sticky top-[68px] z-30 border-b border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-5 py-3 lg:px-8">
          <div className="flex items-center gap-2.5">
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
              <button
                onClick={() => setOnlySaved(!onlySaved)}
                aria-pressed={onlySaved}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2.5 text-[13px] font-semibold transition-colors ${
                  onlySaved ? 'bg-brass text-pine' : 'bg-cream text-muted hover:bg-line'
                }`}
              >
                <Heart size={13} className={onlySaved || shortlist.slugs.length ? 'fill-current' : ''} />
                Shortlist{shortlist.slugs.length ? ` (${shortlist.slugs.length})` : ''}
              </button>
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
              <option value="move_in">Soonest move-in</option>
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
              Couldn't load packages — please refresh, or call us on {SITE.phone}.
            </p>
          ) : all === null ? (
            <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} />
              ))}
            </div>
          ) : nothingListed ? (
            <div className="grid gap-10 py-8 lg:grid-cols-[1fr_1fr] lg:items-center">
              <div>
                <p className="eyebrow">First release coming</p>
                <h2 className="display-tight mt-3 font-display text-[30px] font-semibold text-ink sm:text-[36px]">
                  Packages are being priced right now.
                </h2>
                <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted">
                  Leave your details and you'll see the first release — full price, floorplan, 3D model
                  and move-in date — before it's listed publicly.
                </p>
                <Link to="/buying-guide" className="mt-6 inline-block text-[14.5px] font-semibold text-growth hover:underline">
                  Read the buying guide while you wait →
                </Link>
              </div>
              <LeadForm source="packages_waitlist" />
            </div>
          ) : (
            <>
              <p className="tnum mb-6 text-[13.5px] text-muted" aria-live="polite">
                {filtered.length} package{filtered.length !== 1 ? 's' : ''}
                {onlySaved ? ' shortlisted' : ''}
                {type !== 'all' ? ` · ${TYPE_LABEL[type as PackageType]}` : ''}
                {state !== 'all' ? ` · ${state}` : ''}
              </p>
              {filtered.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-line py-20 text-center">
                  <p className="font-display text-lg font-semibold text-ink">
                    {onlySaved ? 'Nothing shortlisted yet' : 'No packages match those filters'}
                  </p>
                  <p className="mt-2 text-[14px] text-muted">
                    {onlySaved
                      ? 'Tap the heart on any package to save it here.'
                      : "Widen the search — or tell us what you're after and we'll package it for you."}
                  </p>
                  {onlySaved && (
                    <button onClick={() => setOnlySaved(false)} className="mt-5 text-[14px] font-semibold text-growth hover:underline">
                      Show all packages
                    </button>
                  )}
                </div>
              ) : (
                <motion.div layout className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
                  <AnimatePresence mode="popLayout">
                    {filtered.map((pkg, i) => (
                      <motion.div
                        key={pkg.id}
                        layout
                        initial={{ opacity: 0, y: 18, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.45, delay: Math.min(i, 6) * 0.04, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <PackageCard pkg={pkg} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  )
}
