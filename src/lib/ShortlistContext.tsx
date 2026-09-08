import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

interface ShortlistCtx {
  slugs: string[]
  toggle: (slug: string) => void
  has: (slug: string) => boolean
  clear: () => void
}

const Ctx = createContext<ShortlistCtx>({ slugs: [], toggle: () => {}, has: () => false, clear: () => {} })

const KEY = 'abh_shortlist'

export function ShortlistProvider({ children }: { children: ReactNode }) {
  const [slugs, setSlugs] = useState<string[]>(() => {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) ?? '[]')
      return Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(slugs))
    } catch {
      // private browsing: the shortlist simply won't persist
    }
  }, [slugs])

  return (
    <Ctx.Provider
      value={{
        slugs,
        toggle: (slug) => setSlugs((p) => (p.includes(slug) ? p.filter((s) => s !== slug) : [...p, slug])),
        has: (slug) => slugs.includes(slug),
        clear: () => setSlugs([]),
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export const useShortlist = () => useContext(Ctx)
