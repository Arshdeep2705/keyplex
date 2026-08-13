import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Plus } from 'lucide-react'
import type { Lead, Pkg } from '../lib/types'
import { fetchAllPackages, fetchLeads } from '../lib/data'
import { money } from '../lib/format'

export default function Dashboard() {
  const [pkgs, setPkgs] = useState<Pkg[]>([])
  const [leads, setLeads] = useState<(Lead & { kp_packages: { title: string } | null })[]>([])

  useEffect(() => {
    fetchAllPackages().then(setPkgs).catch(() => {})
    fetchLeads().then(setLeads).catch(() => {})
  }, [])

  const published = pkgs.filter((p) => p.status === 'published')
  const newLeads = leads.filter((l) => l.status === 'new')
  const totalViews = pkgs.reduce((sum, p) => sum + p.views_count, 0)
  const stockValue = published.reduce((sum, p) => sum + p.price, 0)

  const stats = [
    { label: 'Live packages', value: String(published.length) },
    { label: 'New leads', value: String(newLeads.length), highlight: newLeads.length > 0 },
    { label: 'Total listing views', value: totalViews.toLocaleString() },
    { label: 'Live stock value', value: money(stockValue) },
  ]

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1 className="mt-2 font-display text-[30px] font-semibold text-ink">G'day. Here's the state of play.</h1>
        </div>
        <Link
          to="/admin/packages/new"
          className="flex items-center gap-2 rounded-lg bg-pine px-5 py-3 text-[14px] font-semibold text-paper transition-all hover:shadow-lift"
        >
          <Plus size={16} /> New package
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((st) => (
          <div
            key={st.label}
            className={`rounded-2xl border p-5 ${st.highlight ? 'border-brass bg-brass-soft' : 'border-line bg-card'}`}
          >
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-muted">{st.label}</p>
            <p className="tnum mt-2 font-display text-[28px] font-semibold text-ink">{st.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-[19px] font-semibold text-ink">Latest leads</h2>
            <Link to="/admin/leads" className="flex items-center gap-1 text-[13px] font-semibold text-growth hover:underline">
              All leads <ArrowRight size={13} />
            </Link>
          </div>
          <div className="mt-4 divide-y divide-line rounded-2xl border border-line bg-card">
            {leads.slice(0, 6).map((l) => (
              <div key={l.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold text-ink">{l.name}</p>
                  <p className="truncate text-[12.5px] text-muted">
                    {l.kp_packages?.title ?? l.source ?? 'General enquiry'}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold uppercase ${
                    l.status === 'new' ? 'bg-brass text-pine' : 'bg-cream text-muted'
                  }`}
                >
                  {l.status}
                </span>
              </div>
            ))}
            {leads.length === 0 && <p className="px-5 py-8 text-center text-[13.5px] text-muted">No leads yet.</p>}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-[19px] font-semibold text-ink">Most viewed packages</h2>
            <Link to="/admin/packages" className="flex items-center gap-1 text-[13px] font-semibold text-growth hover:underline">
              All packages <ArrowRight size={13} />
            </Link>
          </div>
          <div className="mt-4 divide-y divide-line rounded-2xl border border-line bg-card">
            {[...pkgs]
              .sort((a, b) => b.views_count - a.views_count)
              .slice(0, 6)
              .map((p) => (
                <Link key={p.id} to={`/admin/packages/${p.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-cream/40">
                  {p.hero_image && <img src={p.hero_image} alt="" className="h-10 w-14 rounded-md object-cover" />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold text-ink">{p.title}</p>
                    <p className="text-[12px] text-muted">{p.suburb}, {p.state}</p>
                  </div>
                  <span className="tnum shrink-0 text-[12.5px] text-muted">{p.views_count} views</span>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
