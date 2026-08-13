import { useEffect, useMemo, useState } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import type { Pkg, PackageType } from '../lib/types'
import { TYPE_LABEL } from '../lib/types'
import { fetchPublished } from '../lib/data'
import { pkgYield } from '../lib/calc'
import PackageCard from '../components/PackageCard'
import Reveal from '../components/Reveal'

const TYPE_FILTERS: (PackageType | 'all')[] = ['all', 'coliving', 'dual_key', 'rooming_house', 'house_land', 'ndis']
const PRICE_STEPS = [500_000, 650_000, 750_000, 850_000, 950_000, 1_100_000, 1_300_000]

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
  const [maxPrice, setMaxPrice] = useState(0)
  const [minBeds, setMinBeds] = useState(0)
  const [sort, setSort] = useState<'newest' | 'yield' | 'price_asc' | 'price_desc'>('newest')
  const [q, setQ] = useState('')

  useEffect(() => {
    document.title = 'Investment Packages — Keyplex'
    fetchPublished().then(setAll).catch(() => setError(true))
  }, [])

  const filtered = useMemo(() => {
    if (!all) return []
    let list = [...all]
    if (type !== 'all') list = list.filter((p) => p.package_type === type)
    if (state !== 'all') list = list.filter((p) => p.state === state)
    if (maxPrice > 0) list = list.filter((p) => p.price <= maxPrice)
    if (minBeds > 0) list = list.filter((p) => p.beds >= minBeds)
    if (q.trim()) {
      const s = q.trim().toLowerCase()
      list = list.filter(
        (p) =>
          p.suburb.toLowerCase().includes(s) ||
          p.title.toLowerCase().includes(s) ||
          (p.estate ?? '').toLowerCase().includes(s),
      )
    }
    switch (sort) {
      case 'yield':
        list.sort((a, b) => (pkgYield(b) ?? -1) - (pkgYield(a) ?? -1))
        break
      case 'price_asc':
        list.sort((a, b) => a.price - b.price)
        break
      case 'price_desc':
        list.sort((a, b) => b.price - a.price)
        break
    }
    return list
  }, [all, type, state, maxPrice, minBeds, sort, q])

  return (
    <>
      <section className="border-b border-line bg-pine text-paper">
        <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
          <p className="eyebrow fade-up">Live inventory</p>
          <h1 className="display-tight mt-3 font-display text-[36px] font-semibold sm:text-[44px]">
            Investment packages
          </h1>
          <p className="mt-3 max-w-xl text-[15px] text-paper/65">
            Every package: full pricing, projected income, compliance pathway and a free brochure.
            No gates, no games.
          </p>
        </div>
      </section>

      {/* filter bar */}
      <section className="sticky top-[68px] z-30 border-b border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-5 py-4 lg:px-8">
          <div className="flex flex-wrap gap-1.5">
            {TYPE_FILTERS.map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`rounded-lg px-3.5 py-2 text-[13px] font-semibold transition-colors ${
                  type === t ? 'bg-pine text-paper' : 'bg-cream text-muted hover:bg-line'
                }`}
              >
                {t === 'all' ? 'All' : TYPE_LABEL[t]}
              </button>
            ))}
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-mist" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Suburb or estate…"
                className="field !w-44 !py-2 !pl-9 text-[13.5px]"
              />
            </div>
            <select value={state} onChange={(e) => setState(e.target.value)} className="field !w-auto !py-2 text-[13.5px]">
              <option value="all">All states</option>
              <option value="VIC">VIC</option>
              <option value="SA">SA</option>
            </select>
            <select value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="field !w-auto !py-2 text-[13.5px]">
              <option value={0}>Any price</option>
              {PRICE_STEPS.map((p) => (
                <option key={p} value={p}>
                  Under ${(p / 1000).toFixed(0)}k
                </option>
              ))}
            </select>
            <select value={minBeds} onChange={(e) => setMinBeds(Number(e.target.value))} className="field !w-auto !py-2 text-[13.5px]">
              <option value={0}>Any beds</option>
              {[3, 4, 5, 6, 9].map((b) => (
                <option key={b} value={b}>
                  {b}+ beds
                </option>
              ))}
            </select>
            <span className="flex items-center gap-1.5">
              <SlidersHorizontal size={14} className="text-mist" />
              <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="field !w-auto !py-2 text-[13.5px]">
                <option value="newest">Newest first</option>
                <option value="yield">Highest yield</option>
                <option value="price_asc">Price: low → high</option>
                <option value="price_desc">Price: high → low</option>
              </select>
            </span>
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
                    Widen the search — or tell us what you're after and we'll source it.
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
