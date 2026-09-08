import { useEffect, useState } from 'react'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { AreaProject } from '../components/AreaIntel'

const CATEGORIES: AreaProject['category'][] = ['transport', 'road', 'health', 'education', 'retail', 'employment', 'planning', 'community']
const STATUSES: AreaProject['status'][] = ['planned', 'funded', 'under_construction', 'open']

type Draft = Omit<AreaProject, 'id' | 'suburbs'> & { id?: string; suburbs: string }

const blank: Draft = {
  state: 'VIC',
  suburbs: '',
  name: '',
  category: 'transport',
  status: 'planned',
  year_label: '',
  summary: '',
  source_name: '',
  source_url: '',
  sort: 10,
}

/** Admin: the "What's coming to {suburb}" items shown on every package in a suburb. */
export default function Areas() {
  const [items, setItems] = useState<AreaProject[] | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [stateFilter, setStateFilter] = useState('all')

  async function load() {
    const { data } = await supabase.from('kp_area_projects').select('*').order('state').order('sort')
    setItems((data ?? []) as AreaProject[])
  }
  useEffect(() => {
    load()
  }, [])

  async function save() {
    if (!draft) return
    setBusy(true)
    setError('')
    const row = {
      ...draft,
      suburbs: draft.suburbs.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean),
      year_label: draft.year_label || null,
      summary: draft.summary || null,
      source_name: draft.source_name || null,
      source_url: draft.source_url || null,
      updated_at: new Date().toISOString(),
    }
    if (row.suburbs.length === 0 || !row.name) {
      setError('Name and at least one suburb are required.')
      setBusy(false)
      return
    }
    const { id, ...rest } = row
    const q = id ? supabase.from('kp_area_projects').update(rest).eq('id', id) : supabase.from('kp_area_projects').insert(rest)
    const { error } = await q
    if (error) setError(error.message)
    else {
      setDraft(null)
      await load()
    }
    setBusy(false)
  }

  async function remove(id: string) {
    if (!confirm('Delete this item?')) return
    await supabase.from('kp_area_projects').delete().eq('id', id)
    await load()
  }

  const edit = (p: AreaProject) => setDraft({ ...p, suburbs: p.suburbs.join(', '), year_label: p.year_label ?? '', summary: p.summary ?? '', source_name: p.source_name ?? '', source_url: p.source_url ?? '' })
  const visible = (items ?? []).filter((p) => stateFilter === 'all' || p.state === stateFilter)
  const field = (k: keyof Draft, label: string, props: Record<string, unknown> = {}) => (
    <div>
      <label className="field-label">{label}</label>
      <input className="field" value={String(draft?.[k] ?? '')} onChange={(e) => setDraft((d) => d && { ...d, [k]: props.type === 'number' ? Number(e.target.value) : e.target.value })} {...props} />
    </div>
  )

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Area intel</p>
          <h1 className="mt-2 font-display text-[30px] font-semibold text-ink">What's coming to each suburb</h1>
          <p className="mt-2 max-w-2xl text-[14px] text-muted">
            Sourced infrastructure and planning items. Every package in a listed suburb shows them
            automatically — keep the suburbs list lower-case and comma-separated, and always add a source link.
          </p>
        </div>
        <button onClick={() => setDraft({ ...blank })} className="flex items-center gap-2 rounded-lg bg-pine px-5 py-3 text-[14px] font-semibold text-paper transition-all hover:shadow-lift">
          <Plus size={16} /> New item
        </button>
      </div>

      {draft && (
        <div className="mt-8 rounded-2xl border border-line bg-card p-6">
          <p className="eyebrow mb-4">{draft.id ? 'Edit item' : 'New item'}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label">State</label>
              <select className="field" value={draft.state} onChange={(e) => setDraft({ ...draft, state: e.target.value })}>
                <option>VIC</option><option>SA</option><option>NSW</option><option>QLD</option><option>WA</option><option>TAS</option>
              </select>
            </div>
            {field('suburbs', 'Suburbs (comma-separated)', { placeholder: 'clyde north, cranbourne east' })}
            <div className="sm:col-span-2">{field('name', 'Project name')}</div>
            <div>
              <label className="field-label">Category</label>
              <select className="field" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value as AreaProject['category'] })}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Status</label>
              <select className="field" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as AreaProject['status'] })}>
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            {field('year_label', 'Timing label', { placeholder: 'Completion 2029' })}
            {field('sort', 'Sort (lower first)', { type: 'number' })}
            <div className="sm:col-span-2">
              <label className="field-label">Summary</label>
              <textarea className="field" rows={3} value={draft.summary ?? ''} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} />
            </div>
            {field('source_name', 'Source name', { placeholder: "Victoria's Big Build" })}
            {field('source_url', 'Source URL', { placeholder: 'https://…' })}
          </div>
          {error && <p className="mt-3 text-[13px] font-medium text-danger">{error}</p>}
          <div className="mt-5 flex items-center gap-3">
            <button onClick={save} disabled={busy} className="flex items-center gap-2 rounded-lg bg-pine px-5 py-2.5 text-[14px] font-semibold text-paper disabled:opacity-60">
              {busy && <Loader2 size={14} className="animate-spin" />} Save
            </button>
            <button onClick={() => setDraft(null)} className="text-[13.5px] font-medium text-muted hover:underline">Cancel</button>
          </div>
        </div>
      )}

      <div className="mt-8 flex items-center gap-2">
        {['all', 'VIC', 'SA'].map((s) => (
          <button key={s} onClick={() => setStateFilter(s)} className={`rounded-lg px-3.5 py-2 text-[13px] font-semibold ${stateFilter === s ? 'bg-pine text-paper' : 'bg-cream text-muted'}`}>
            {s === 'all' ? 'All' : s}
          </button>
        ))}
      </div>

      {items === null ? (
        <div className="py-16 text-center"><Loader2 size={22} className="mx-auto animate-spin text-brass" /></div>
      ) : (
        <div className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
          {visible.map((p) => (
            <div key={p.id} className="flex flex-wrap items-start gap-4 px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="text-[14.5px] font-semibold text-ink">{p.name} <span className="ml-2 rounded-md bg-cream px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-muted">{p.state} · {p.category} · {p.status.replace('_', ' ')}</span></p>
                <p className="mt-1 text-[12.5px] text-muted">{p.suburbs.join(', ')}{p.year_label ? ` · ${p.year_label}` : ''}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => edit(p)} aria-label="Edit" className="rounded-lg border border-line p-2 text-muted hover:border-brass hover:text-ink"><Pencil size={15} /></button>
                <button onClick={() => remove(p.id)} aria-label="Delete" className="rounded-lg border border-line p-2 text-muted hover:border-danger hover:text-danger"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
          {visible.length === 0 && <p className="px-5 py-10 text-center text-[14px] text-muted">Nothing yet — add the first item.</p>}
        </div>
      )}
    </div>
  )
}
