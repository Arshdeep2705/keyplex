import { useEffect, useState } from 'react'
import { ExternalLink, GraduationCap, Hospital, Landmark, Route, ShoppingBag, TrainFront, Users, Briefcase } from 'lucide-react'
import { supabase } from '../lib/supabase'

export interface AreaProject {
  id: string
  state: string
  suburbs: string[]
  name: string
  category: 'transport' | 'road' | 'health' | 'education' | 'retail' | 'employment' | 'planning' | 'community'
  status: 'planned' | 'funded' | 'under_construction' | 'open'
  year_label: string | null
  summary: string | null
  source_name: string | null
  source_url: string | null
  sort: number
}

const ICON: Record<AreaProject['category'], React.ElementType> = {
  transport: TrainFront,
  road: Route,
  health: Hospital,
  education: GraduationCap,
  retail: ShoppingBag,
  employment: Briefcase,
  planning: Landmark,
  community: Users,
}

const STATUS: Record<AreaProject['status'], { label: string; cls: string }> = {
  open: { label: 'Open', cls: 'bg-growth-soft text-growth' },
  under_construction: { label: 'Under construction', cls: 'bg-brass-soft text-brass' },
  funded: { label: 'Funded', cls: 'bg-cream text-ink' },
  planned: { label: 'Planned', cls: 'bg-cream text-muted' },
}

export async function fetchAreaProjects(state: string, suburb: string): Promise<AreaProject[]> {
  const { data, error } = await supabase
    .from('kp_area_projects')
    .select('*')
    .eq('state', state)
    .contains('suburbs', [suburb.toLowerCase()])
    .order('sort')
  if (error) throw error
  return (data ?? []) as AreaProject[]
}

/** What's coming to the area — sourced, dated infrastructure and planning items for the suburb. */
export default function AreaIntel({ state, suburb }: { state: string; suburb: string }) {
  const [items, setItems] = useState<AreaProject[] | null>(null)

  useEffect(() => {
    let stale = false
    fetchAreaProjects(state, suburb)
      .then((d) => {
        if (!stale) setItems(d)
      })
      .catch(() => {
        if (!stale) setItems([])
      })
    return () => {
      stale = true
    }
  }, [state, suburb])

  if (items === null || items.length === 0) return null

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-card">
      <div className="border-b border-line bg-cream/60 px-6 py-4">
        <p className="eyebrow">What's coming to {suburb}</p>
        <p className="mt-0.5 text-[13px] text-muted">
          Infrastructure and planning on the public record — each item links to its source
        </p>
      </div>
      <ol className="relative divide-y divide-line/70">
        {items.map((p) => {
          const Icon = ICON[p.category]
          const st = STATUS[p.status]
          return (
            <li key={p.id} className="flex gap-4 px-6 py-4">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cream text-brass">
                <Icon size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[14.5px] font-semibold text-ink">{p.name}</p>
                  <span className={`rounded-md px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.1em] ${st.cls}`}>{st.label}</span>
                  {p.year_label && <span className="tnum text-[12px] text-mist">{p.year_label}</span>}
                </div>
                {p.summary && <p className="mt-1 text-[13px] leading-relaxed text-muted">{p.summary}</p>}
                {p.source_url && (
                  <a
                    href={p.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-medium text-growth hover:underline"
                  >
                    {p.source_name ?? 'Source'} <ExternalLink size={11} />
                  </a>
                )}
              </div>
            </li>
          )
        })}
      </ol>
      <p className="border-t border-line px-6 py-3 text-[11px] text-mist">
        Project status and dates are as published by the source at the time of listing and can
        change. Planned projects are not guaranteed to proceed.
      </p>
    </div>
  )
}
