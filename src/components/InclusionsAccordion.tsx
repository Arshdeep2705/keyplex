import { useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import type { InclusionGroup } from '../lib/types'

export default function InclusionsAccordion({ groups }: { groups: InclusionGroup[] }) {
  const [open, setOpen] = useState<number>(0)

  if (!groups?.length) return null

  return (
    <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
      {groups.map((g, i) => (
        <div key={g.category}>
          <button
            onClick={() => setOpen(open === i ? -1 : i)}
            className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-cream/50"
          >
            <span className="font-display text-[16px] font-semibold text-ink">{g.category}</span>
            <span className="flex items-center gap-3">
              <span className="text-[12px] font-medium text-mist">{g.items.length} items</span>
              <ChevronDown
                size={18}
                className={`text-brass transition-transform duration-300 ${open === i ? 'rotate-180' : ''}`}
              />
            </span>
          </button>
          <div
            className={`grid transition-all duration-300 ${open === i ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
          >
            <div className="overflow-hidden">
              <ul className="grid gap-x-6 gap-y-2 px-6 pb-5 sm:grid-cols-2">
                {g.items.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-muted">
                    <Check size={15} className="mt-0.5 shrink-0 text-growth" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
