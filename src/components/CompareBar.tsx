import { Link, useLocation } from 'react-router-dom'
import { ArrowLeftRight, X } from 'lucide-react'
import { useCompare } from '../lib/CompareContext'

export default function CompareBar() {
  const { slugs, clear } = useCompare()
  const { pathname } = useLocation()
  if (slugs.length === 0 || pathname === '/compare') return null

  return (
    <div className="fade-up fixed bottom-24 left-1/2 z-40 -translate-x-1/2 lg:bottom-5">
      <div className="flex items-center gap-3 rounded-full border border-line-dark/50 bg-pine px-5 py-3 text-paper shadow-lift">
        <ArrowLeftRight size={16} className="text-brass-bright" />
        <span className="text-[14px] font-medium">
          {slugs.length} package{slugs.length > 1 ? 's' : ''} selected
        </span>
        <Link
          to="/compare"
          className="rounded-full bg-brass px-4 py-1.5 text-[13.5px] font-semibold text-pine transition-colors hover:bg-brass-bright"
        >
          Compare
        </Link>
        <button onClick={clear} aria-label="Clear comparison" className="text-paper/60 hover:text-paper">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
