import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import type { Pkg } from '../lib/types'
import { TYPE_LABEL } from '../lib/types'
import { deletePackage, fetchAllPackages, savePackage } from '../lib/data'
import { pkgYield } from '../lib/calc'
import { money, pct } from '../lib/format'

const STATUS_STYLE: Record<string, string> = {
  published: 'bg-growth-soft text-growth',
  draft: 'bg-cream text-muted',
  reserved: 'bg-brass-soft text-brass',
  sold: 'bg-pine text-paper',
  archived: 'bg-line text-muted',
}

export default function PackagesList() {
  const [pkgs, setPkgs] = useState<Pkg[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')

  const load = () =>
    fetchAllPackages()
      .then((data) => {
        setPkgs(data)
        setError('')
      })
      .catch(() => setError("Couldn't load packages — check your connection and refresh."))
  useEffect(() => {
    load()
  }, [])

  async function toggleStatus(p: Pkg) {
    // only draft ⇄ published is a one-click toggle; sold/reserved/archived are deliberate states
    if (p.status !== 'published' && p.status !== 'draft') return
    if (p.status === 'draft' && (!p.suburb || !p.price)) {
      setError(`"${p.title}" needs a suburb and a price before it can go live — open it and finish the details.`)
      return
    }
    setBusy(p.id)
    setError('')
    try {
      const next = p.status === 'published' ? 'draft' : 'published'
      await savePackage({
        id: p.id,
        status: next,
        published_at: next === 'published' ? new Date().toISOString() : p.published_at,
      })
      await load()
    } catch {
      setError('Status change failed — please try again.')
    } finally {
      setBusy(null)
    }
  }

  async function remove(p: Pkg) {
    if (!confirm(`Delete "${p.title}" permanently? This cannot be undone.`)) return
    setBusy(p.id)
    setError('')
    try {
      await deletePackage(p.id)
      await load()
    } catch {
      setError('Delete failed — please try again.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Inventory</p>
          <h1 className="mt-2 font-display text-[30px] font-semibold text-ink">Packages</h1>
        </div>
        <Link
          to="/admin/packages/new"
          className="flex items-center gap-2 rounded-lg bg-pine px-5 py-3 text-[14px] font-semibold text-paper transition-all hover:shadow-lift"
        >
          <Plus size={16} /> New package
        </Link>
      </div>

      {error && <p className="mt-4 rounded-lg bg-danger-soft px-4 py-2.5 text-[13px] font-medium text-danger">{error}</p>}

      <div className="mt-8 overflow-x-auto rounded-2xl border border-line bg-card">
        <table className="w-full min-w-[760px]">
          <thead>
            <tr className="border-b border-line bg-cream/50 text-left text-[11.5px] font-semibold uppercase tracking-[0.08em] text-muted">
              <th className="px-5 py-3.5">Package</th>
              <th className="px-4 py-3.5">Type</th>
              <th className="px-4 py-3.5">Price</th>
              <th className="px-4 py-3.5">Yield*</th>
              <th className="px-4 py-3.5">Views</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/70">
            {pkgs.map((p) => (
              <tr key={p.id} className="text-[13.5px] hover:bg-cream/30">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    {p.hero_image ? (
                      <img src={p.hero_image} alt="" className="h-11 w-16 shrink-0 rounded-lg object-cover" />
                    ) : (
                      <div className="h-11 w-16 shrink-0 rounded-lg bg-cream" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">{p.title}</p>
                      <p className="text-[12px] text-muted">{p.suburb}, {p.state}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted">{TYPE_LABEL[p.package_type]}</td>
                <td className="tnum px-4 py-3 font-semibold text-ink">{money(p.price)}</td>
                <td className="tnum px-4 py-3 text-growth">{pkgYield(p) ? pct(pkgYield(p)) : '—'}</td>
                <td className="tnum px-4 py-3 text-muted">{p.views_count}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleStatus(p)}
                    disabled={busy === p.id}
                    title="Click to toggle publish state"
                    className={`rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide transition-opacity hover:opacity-75 ${STATUS_STYLE[p.status]}`}
                  >
                    {p.status}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    {p.status === 'published' ? (
                      <a
                        href={`${import.meta.env.BASE_URL}packages/${p.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        title="View live"
                        className="rounded-lg p-2 text-muted transition-colors hover:bg-cream hover:text-ink"
                      >
                        <Eye size={15} />
                      </a>
                    ) : (
                      <span title="Not live" className="cursor-not-allowed rounded-lg p-2 text-line">
                        <Eye size={15} />
                      </span>
                    )}
                    <Link
                      to={`/admin/packages/${p.id}`}
                      title="Edit"
                      className="rounded-lg p-2 text-muted transition-colors hover:bg-cream hover:text-ink"
                    >
                      <Pencil size={15} />
                    </Link>
                    <button
                      onClick={() => remove(p)}
                      disabled={busy === p.id}
                      title="Delete"
                      className="rounded-lg p-2 text-muted transition-colors hover:bg-danger-soft hover:text-danger"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pkgs.length === 0 && (
          <p className="px-5 py-12 text-center text-[14px] text-muted">
            No packages yet — create your first one in under a minute.
          </p>
        )}
      </div>
      <p className="mt-3 text-[12px] text-mist">*Projected gross yield. Click a status badge to publish/unpublish instantly.</p>
    </div>
  )
}
