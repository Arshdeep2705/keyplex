import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

interface CompareCtx {
  slugs: string[]
  toggle: (slug: string) => void
  clear: () => void
  has: (slug: string) => boolean
}

const Ctx = createContext<CompareCtx>({ slugs: [], toggle: () => {}, clear: () => {}, has: () => false })

export function CompareProvider({ children }: { children: ReactNode }) {
  const [slugs, setSlugs] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('kp_compare') ?? '[]')
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem('kp_compare', JSON.stringify(slugs))
  }, [slugs])

  const toggle = (slug: string) =>
    setSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : prev.length >= 3 ? prev : [...prev, slug],
    )

  return (
    <Ctx.Provider value={{ slugs, toggle, clear: () => setSlugs([]), has: (s) => slugs.includes(s) }}>
      {children}
    </Ctx.Provider>
  )
}

export const useCompare = () => useContext(Ctx)
