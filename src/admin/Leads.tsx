import { useEffect, useState } from 'react'
import { Mail, Phone } from 'lucide-react'
import type { Lead } from '../lib/types'
import { fetchLeads, updateLead } from '../lib/data'

type LeadRow = Lead & { kp_packages: { title: string } | null }
const STATUSES: Lead['status'][] = ['new', 'contacted', 'qualified', 'closed', 'spam']

export default function Leads() {
  const [leads, setLeads] = useState<LeadRow[]>([])
  const [filter, setFilter] = useState<Lead['status'] | 'all'>('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = () => fetchLeads().then(setLeads).catch(() => {})
  useEffect(() => {
    load()
  }, [])

  async function setStatus(id: string, status: Lead['status']) {
    await updateLead(id, { status })
    await load()
  }

  const shown = filter === 'all' ? leads : leads.filter((l) => l.status === filter)

  return (
    <div className="mx-auto max-w-5xl">
      <p className="eyebrow">Pipeline</p>
      <h1 className="mt-2 font-display text-[30px] font-semibold text-ink">Leads</h1>
      <p className="mt-1 text-[13.5px] text-muted">
        Speed wins: a call inside 5 minutes converts up to 21× better than one after an hour.
      </p>

      <div className="mt-6 flex flex-wrap gap-1.5">
        {(['all', ...STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-lg px-3.5 py-2 text-[13px] font-semibold capitalize transition-colors ${
              filter === s ? 'bg-pine text-paper' : 'bg-cream text-muted hover:bg-line'
            }`}
          >
            {s}
            {s === 'new' && leads.filter((l) => l.status === 'new').length > 0 && (
              <span className="tnum ml-1.5 rounded-full bg-brass px-1.5 text-[11px] text-pine">
                {leads.filter((l) => l.status === 'new').length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {shown.map((l) => (
          <div key={l.id} className="rounded-2xl border border-line bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <p className="font-display text-[16.5px] font-semibold text-ink">{l.name}</p>
                  {l.status === 'new' && (
                    <span className="rounded-md bg-brass px-2 py-0.5 text-[10.5px] font-bold uppercase text-pine">New</span>
                  )}
                  <span className="text-[11.5px] text-mist">
                    {new Date(l.created_at).toLocaleString('en-AU', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                  </span>
                </div>
                <p className="mt-1 text-[13px] text-muted">
                  {l.kp_packages?.title ? `Re: ${l.kp_packages.title}` : (l.source ?? 'General enquiry')}
                  {l.preferred_time ? ` · prefers ${l.preferred_time.toLowerCase()}` : ''}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-4">
                  <a href={`mailto:${l.email}`} className="flex items-center gap-1.5 text-[13.5px] font-medium text-growth hover:underline">
                    <Mail size={14} /> {l.email}
                  </a>
                  {l.phone && (
                    <a href={`tel:${l.phone}`} className="flex items-center gap-1.5 text-[13.5px] font-medium text-growth hover:underline">
                      <Phone size={14} /> {l.phone}
                    </a>
                  )}
                </div>
              </div>
              <select
                value={l.status}
                onChange={(e) => setStatus(l.id, e.target.value as Lead['status'])}
                className="field !w-auto !py-1.5 text-[13px] capitalize"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            {l.message && (
              <div className="mt-3">
                <button
                  onClick={() => setExpanded(expanded === l.id ? null : l.id)}
                  className="text-[12.5px] font-semibold text-brass hover:underline"
                >
                  {expanded === l.id ? 'Hide message' : 'Show message'}
                </button>
                {expanded === l.id && (
                  <p className="mt-2 whitespace-pre-wrap rounded-xl bg-cream/70 px-4 py-3 text-[13.5px] leading-relaxed text-ink/85">
                    {l.message}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
        {shown.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line py-16 text-center text-[14px] text-muted">
            No {filter === 'all' ? '' : filter} leads.
          </div>
        )}
      </div>
    </div>
  )
}
