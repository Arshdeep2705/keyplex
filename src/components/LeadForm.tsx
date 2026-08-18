import { useId, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

const BUYER_TYPES = ['First home buyer', 'Upgrading / next home', 'Investor', 'Not sure yet']
const TIMEFRAMES = ['Ready now', '1–3 months', '3–6 months', 'Researching']

export default function LeadForm({
  packageId,
  source = 'website',
  dark = false,
  compact = false,
}: {
  packageId?: string
  source?: string
  dark?: boolean
  compact?: boolean
}) {
  const [step, setStep] = useState<'form' | 'qualify' | 'done'>('form')
  const [leadId, setLeadId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [f, setF] = useState({ name: '', email: '', phone: '', message: '', preferred_time: '' })
  const [q, setQ] = useState({ buyer: '', deposit: '', timeframe: '' })
  const uid = useId()

  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const { data, error } = await supabase.rpc('kp_submit_lead', {
        p_name: f.name,
        p_email: f.email,
        p_phone: f.phone || null,
        p_message: f.message || null,
        p_source: source,
        p_preferred_time: f.preferred_time || null,
        p_package_id: packageId ?? null,
      })
      if (error) throw error
      setLeadId(data as string)
      setStep('qualify')
    } catch {
      setError('Something went wrong — please call us on 1300 539 759.')
    } finally {
      setBusy(false)
    }
  }

  async function submitQualifiers() {
    setBusy(true)
    try {
      if (leadId && (q.buyer || q.deposit || q.timeframe)) {
        const text = [
          q.buyer && `Buyer type: ${q.buyer}`,
          q.deposit && `Deposit ready: ${q.deposit}`,
          q.timeframe && `Timeframe: ${q.timeframe}`,
        ]
          .filter(Boolean)
          .join('\n')
        await supabase.rpc('kp_add_lead_qualifiers', { p_lead_id: leadId, p_qualifiers: text })
      }
    } catch {
      // qualifiers are optional — the lead itself is already captured
    } finally {
      setBusy(false)
      setStep('done')
    }
  }

  const labelCls = dark ? 'field-label !text-paper/60' : 'field-label'
  const fieldCls = dark ? 'field !border-line-dark !bg-pine-soft !text-paper placeholder:!text-paper/40' : 'field'

  if (step === 'done') {
    return (
      <div className={`rounded-2xl border p-8 text-center ${dark ? 'border-line-dark bg-pine-soft' : 'border-line bg-growth-soft'}`}>
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-growth text-white">
          <Check size={22} />
        </div>
        <h3 className={`font-display text-xl font-semibold ${dark ? 'text-paper' : 'text-ink'}`}>
          Thanks {f.name.split(' ')[0]} — you're in the queue.
        </h3>
        <p className={`mt-2 text-[14px] ${dark ? 'text-paper/70' : 'text-muted'}`}>
          A Keyplex consultant will call you shortly. We aim to respond within minutes, not days.
        </p>
      </div>
    )
  }

  if (step === 'qualify') {
    return (
      <div className={`rounded-2xl border p-6 ${dark ? 'border-line-dark bg-pine-soft' : 'border-line bg-card'}`}>
        <p className="eyebrow mb-1">One last thing</p>
        <h3 className={`font-display text-lg font-semibold ${dark ? 'text-paper' : 'text-ink'}`}>
          Help us match the right stock to you
        </h3>
        <p className={`mt-1 text-[13px] ${dark ? 'text-paper/60' : 'text-muted'}`}>
          Optional — 10 seconds. First home buyers, for example, unlock different grants and duty savings.
        </p>
        <div className="mt-5 space-y-4">
          <div>
            <span className={labelCls}>I am a…</span>
            <div className="flex flex-wrap gap-2">
              {BUYER_TYPES.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setQ((p) => ({ ...p, buyer: b }))}
                  className={`rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors ${
                    q.buyer === b
                      ? 'border-brass bg-brass text-pine'
                      : dark
                        ? 'border-line-dark text-paper/80 hover:border-brass'
                        : 'border-line text-muted hover:border-brass'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className={labelCls}>Deposit ready?</span>
            <div className="flex gap-2">
              {['Yes', 'Not yet'].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setQ((p) => ({ ...p, deposit: d }))}
                  className={`rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors ${
                    q.deposit === d
                      ? 'border-brass bg-brass text-pine'
                      : dark
                        ? 'border-line-dark text-paper/80 hover:border-brass'
                        : 'border-line text-muted hover:border-brass'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className={labelCls}>Timeframe</span>
            <div className="flex flex-wrap gap-2">
              {TIMEFRAMES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setQ((p) => ({ ...p, timeframe: t }))}
                  className={`rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors ${
                    q.timeframe === t
                      ? 'border-brass bg-brass text-pine'
                      : dark
                        ? 'border-line-dark text-paper/80 hover:border-brass'
                        : 'border-line text-muted hover:border-brass'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={submitQualifiers}
              disabled={busy}
              className="flex items-center gap-2 rounded-lg bg-pine px-5 py-2.5 text-[14px] font-semibold text-paper transition-all hover:shadow-lift disabled:opacity-60"
            >
              {busy && <Loader2 size={14} className="animate-spin" />}
              Finish
            </button>
            <button
              onClick={() => setStep('done')}
              className={`text-[13px] ${dark ? 'text-paper/50' : 'text-mist'} hover:underline`}
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={submit}
      className={`rounded-2xl border p-6 ${dark ? 'border-line-dark bg-pine-soft' : 'border-line bg-card'}`}
    >
      <div className={`grid gap-4 ${compact ? '' : 'sm:grid-cols-2'}`}>
        <div>
          <label htmlFor={`${uid}-name`} className={labelCls}>Name *</label>
          <input id={`${uid}-name`} required autoComplete="name" className={fieldCls} value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Full name" />
        </div>
        <div>
          <label htmlFor={`${uid}-email`} className={labelCls}>Email *</label>
          <input id={`${uid}-email`} required type="email" autoComplete="email" className={fieldCls} value={f.email} onChange={(e) => set('email', e.target.value)} placeholder="you@email.com" />
        </div>
        <div>
          <label htmlFor={`${uid}-phone`} className={labelCls}>Phone</label>
          <input id={`${uid}-phone`} type="tel" autoComplete="tel" className={fieldCls} value={f.phone} onChange={(e) => set('phone', e.target.value)} placeholder="04xx xxx xxx" />
        </div>
        <div>
          <label htmlFor={`${uid}-time`} className={labelCls}>Best time to call</label>
          <select id={`${uid}-time`} className={fieldCls} value={f.preferred_time} onChange={(e) => set('preferred_time', e.target.value)}>
            <option value="">Any time</option>
            <option>Morning</option>
            <option>Afternoon</option>
            <option>Evening</option>
          </select>
        </div>
      </div>
      <div className="mt-4">
        <label htmlFor={`${uid}-msg`} className={labelCls}>Message</label>
        <textarea id={`${uid}-msg`} rows={3} className={fieldCls} value={f.message} onChange={(e) => set('message', e.target.value)} placeholder="Tell us about your goals…" />
      </div>
      {error && <p className="mt-3 text-[13px] font-medium text-danger">{error}</p>}
      <button
        disabled={busy}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-brass px-5 py-3 text-[15px] font-semibold text-pine transition-all hover:bg-brass-bright hover:shadow-lift disabled:opacity-60"
      >
        {busy && <Loader2 size={16} className="animate-spin" />}
        Request a call back
      </button>
      <p className={`mt-3 text-center text-[11.5px] ${dark ? 'text-paper/40' : 'text-mist'}`}>
        We respond fast — usually within minutes during business hours.
      </p>
    </form>
  )
}
