import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

interface CompareCtx {
  slugs: string[]
  toggle: (slug: string) => void
  clear: () => void
  has: (slug: string) => boolean
  isFull: boolean
  prune: (validSlugs: string[]) => void
}

const Ctx = createContext<CompareCtx>({
  slugs: [],
  toggle: () => {},
  clear: () => {},
  has: () => false,
  isFull: false,
  prune: () => {},
})

export function CompareProvider({ children }: { children: ReactNode }) {
  const [slugs, setSlugs] = useState<string[]>(() => {
    try {
      const v = JSON.parse(localStorage.getItem('kp_compare') ?? '[]')
      return Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string').slice(0, 3) : []
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

  const prune = (validSlugs: string[]) =>
    setSlugs((prev) => prev.filter((s) => validSlugs.includes(s)))

  return (
    <Ctx.Provider
      value={{
        slugs,
        toggle,
        clear: () => setSlugs([]),
        has: (s) => slugs.includes(s),
        isFull: slugs.length >= 3,
        prune,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export const useCompare = () => useContext(Ctx)
