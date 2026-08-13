import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { Building2, Inbox, LayoutDashboard, Loader2, LogOut, ExternalLink, Menu, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Logo from '../components/Logo'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('Invalid email or password.')
    setBusy(false)
  }

  return (
    <div className="blueprint grain flex min-h-screen items-center justify-center bg-pine px-5">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-line-dark/60 bg-pine-soft/70 p-8 backdrop-blur">
        <Logo dark />
        <h1 className="mt-6 font-display text-[22px] font-semibold text-paper">Partner login</h1>
        <p className="mt-1 text-[13px] text-paper/50">Manage packages, brochures and leads.</p>
        <div className="mt-6 space-y-4">
          <div>
            <label className="field-label !text-paper/60">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field !border-line-dark !bg-pine !text-paper"
              placeholder="admin@keyplex.com.au"
            />
          </div>
          <div>
            <label className="field-label !text-paper/60">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field !border-line-dark !bg-pine !text-paper"
              placeholder="••••••••••"
            />
          </div>
        </div>
        {error && <p className="mt-3 text-[13px] font-medium text-danger">{error}</p>}
        <button
          disabled={busy}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-brass px-5 py-3 text-[14.5px] font-semibold text-pine transition-colors hover:bg-brass-bright disabled:opacity-60"
        >
          {busy && <Loader2 size={15} className="animate-spin" />}
          Sign in
        </button>
      </form>
    </div>
  )
}

export default function AdminLayout() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [isAdmin, setIsAdmin] = useState<boolean | undefined>(undefined)
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => setMenuOpen(false), [pathname])

  useEffect(() => {
    document.title = 'Admin — Keyplex'
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) {
      setIsAdmin(undefined)
      return
    }
    supabase
      .from('kp_admins')
      .select('uid')
      .eq('uid', session.user.id)
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data))
  }, [session])

  if (session === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-pine">
        <Loader2 size={26} className="animate-spin text-brass" />
      </div>
    )
  }

  if (!session) return <Login />

  if (isAdmin === false) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-pine px-5 text-center">
        <p className="font-display text-xl font-semibold text-paper">This account isn't an admin.</p>
        <button onClick={() => supabase.auth.signOut()} className="text-[14px] font-semibold text-brass-bright hover:underline">
          Sign out
        </button>
      </div>
    )
  }

  if (isAdmin === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-pine">
        <Loader2 size={26} className="animate-spin text-brass" />
      </div>
    )
  }

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-[14px] font-medium transition-colors ${
      isActive ? 'bg-pine-soft text-brass-bright' : 'text-paper/70 hover:bg-pine-soft/60 hover:text-paper'
    }`

  const navLinks = (
    <>
      <NavLink to="/admin" end className={linkCls}>
        <LayoutDashboard size={17} /> Dashboard
      </NavLink>
      <NavLink to="/admin/packages" className={linkCls}>
        <Building2 size={17} /> Packages
      </NavLink>
      <NavLink to="/admin/leads" className={linkCls}>
        <Inbox size={17} /> Leads
      </NavLink>
    </>
  )

  const utilityLinks = (
    <>
      <a
        href={import.meta.env.BASE_URL}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-[14px] font-medium text-paper/70 transition-colors hover:text-paper"
      >
        <ExternalLink size={17} /> View site
      </a>
      <button
        onClick={() => supabase.auth.signOut()}
        className="flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-[14px] font-medium text-paper/70 transition-colors hover:text-paper"
      >
        <LogOut size={17} /> Sign out
      </button>
    </>
  )

  return (
    <div className="min-h-screen bg-paper">
      {/* mobile top bar */}
      <header className="sticky top-0 z-40 border-b border-line-dark/60 bg-pine lg:hidden">
        <div className="flex h-[60px] items-center justify-between px-4">
          <NavLink to="/admin">
            <Logo dark size={26} />
          </NavLink>
          <button
            className="p-2.5 text-paper"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close admin menu' : 'Open admin menu'}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {menuOpen && (
          <nav className="space-y-1 border-t border-line-dark/60 px-4 pb-4 pt-2">
            {navLinks}
            {utilityLinks}
          </nav>
        )}
      </header>

      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line-dark/60 bg-pine p-5 lg:flex">
        <NavLink to="/admin">
          <Logo dark size={28} />
        </NavLink>
        <nav className="mt-8 space-y-1.5">{navLinks}</nav>
        <div className="mt-auto space-y-1.5">{utilityLinks}</div>
      </aside>

      <main className="min-h-screen p-4 sm:p-6 lg:ml-60 lg:p-8">
        <Outlet />
      </main>
    </div>
  )
}
