import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useScroll, useSpring } from 'motion/react'
import { Heart, Menu, X } from 'lucide-react'
import Logo from './Logo'
import { useShortlist } from '../lib/ShortlistContext'

const links = [
  { to: '/packages', label: 'Packages' },
  { to: '/buying-guide', label: 'Buying Guide' },
  { to: '/compare', label: 'Compare' },
  { to: '/contact', label: 'Contact' },
]

export default function Nav() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { slugs } = useShortlist()
  const { pathname } = useLocation()
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 26, mass: 0.3 })

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 14)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <header
      className={`sticky top-0 z-40 border-b text-paper backdrop-blur-md transition-[background-color,border-color,box-shadow] duration-500 ${
        scrolled
          ? 'border-line-dark/90 bg-pine/90 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.75)]'
          : 'border-line-dark/60 bg-pine/95'
      }`}
    >
      {/* reading progress */}
      <motion.div
        style={{ scaleX: progress }}
        className="pointer-events-none absolute inset-x-0 top-0 h-[2px] origin-left bg-brass-bright"
        aria-hidden
      />

      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link to="/" aria-label="AU Build Hub home">
          <Logo dark />
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `relative py-2 text-[14px] font-medium tracking-wide transition-colors hover:text-brass-bright ${
                  isActive ? 'text-brass-bright' : 'text-paper/85'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {l.label}
                  {isActive && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-x-0 -bottom-0.5 h-[2px] rounded-full bg-brass-bright"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}

          <Link
            to="/packages?shortlist=1"
            aria-label={`Shortlist, ${slugs.length} saved`}
            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-line-dark/80 text-paper/80 transition-colors hover:border-brass-bright hover:text-brass-bright"
          >
            <Heart size={16} className={slugs.length ? 'fill-brass-bright text-brass-bright' : ''} />
            <AnimatePresence>
              {slugs.length > 0 && (
                <motion.span
                  key="count"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                  className="tnum absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brass px-1 text-[10.5px] font-bold text-pine"
                >
                  {slugs.length}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          <Link
            to="/contact"
            className="btn-brass rounded-lg bg-brass px-4 py-2 text-[14px] font-semibold text-pine transition-all hover:bg-brass-bright hover:shadow-lift"
          >
            Talk to a consultant
          </Link>
        </nav>

        <div className="flex items-center gap-1 md:hidden">
          <Link
            to="/packages?shortlist=1"
            aria-label={`Shortlist, ${slugs.length} saved`}
            className="relative flex h-10 w-10 items-center justify-center text-paper/85"
          >
            <Heart size={20} className={slugs.length ? 'fill-brass-bright text-brass-bright' : ''} />
            {slugs.length > 0 && (
              <span className="tnum absolute right-0.5 top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-brass px-1 text-[10px] font-bold text-pine">
                {slugs.length}
              </span>
            )}
          </Link>
          <button
            className="-mr-2.5 p-2.5"
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            key="mobile"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-line-dark/60 bg-pine md:hidden"
            aria-label="Mobile"
          >
            <div className="px-5 pb-6 pt-2">
              {links.map((l, i) => (
                <motion.div
                  key={l.to}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + i * 0.05 }}
                >
                  <NavLink
                    to={l.to}
                    className="block border-b border-line-dark/40 py-3.5 text-[15px] font-medium text-paper/90"
                  >
                    {l.label}
                  </NavLink>
                </motion.div>
              ))}
              <Link
                to="/contact"
                className="mt-4 block rounded-lg bg-brass px-4 py-3 text-center text-[15px] font-semibold text-pine"
              >
                Talk to a consultant
              </Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
