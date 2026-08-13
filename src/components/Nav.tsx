import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Logo from './Logo'

const links = [
  { to: '/packages', label: 'Packages' },
  { to: '/buying-guide', label: 'Buying Guide' },
  { to: '/compare', label: 'Compare' },
  { to: '/contact', label: 'Contact' },
]

export default function Nav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-line-dark/60 bg-pine/95 text-paper backdrop-blur">
      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link to="/" onClick={() => setOpen(false)}>
          <Logo dark />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `text-[14px] font-medium tracking-wide transition-colors hover:text-brass-bright ${
                  isActive ? 'text-brass-bright' : 'text-paper/85'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
          <Link
            to="/contact"
            className="rounded-lg bg-brass px-4 py-2 text-[14px] font-semibold text-pine transition-all hover:bg-brass-bright hover:shadow-lift"
          >
            Talk to a consultant
          </Link>
        </nav>

        <button
          className="md:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-line-dark/60 bg-pine px-5 pb-6 pt-2 md:hidden">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="block border-b border-line-dark/40 py-3.5 text-[15px] font-medium text-paper/90"
            >
              {l.label}
            </NavLink>
          ))}
          <Link
            to="/contact"
            onClick={() => setOpen(false)}
            className="mt-4 block rounded-lg bg-brass px-4 py-3 text-center text-[15px] font-semibold text-pine"
          >
            Talk to a consultant
          </Link>
        </nav>
      )}
    </header>
  )
}
