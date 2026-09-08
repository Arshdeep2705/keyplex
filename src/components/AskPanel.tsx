import { useEffect, useRef, useState } from 'react'
import { Loader2, Send, Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Pkg } from '../lib/types'

interface Turn {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTED = [
  'Is this a good investment for me?',
  'What are the risks with this package?',
  'How does the land-only stamp duty work here?',
  "What's planned for this area?",
  'Compare renting this out vs living in it',
]

/**
 * "Ask about this package" — an on-page analyst grounded in the listing's real numbers, the
 * area's sourced infrastructure list and the investor model, instead of a generic chatbot.
 * Renders nothing until the backend confirms it is configured.
 */
export default function AskPanel({
  pkg,
  context,
}: {
  pkg: Pkg
  /** extra grounding the page already computed (investor model, nearby places, area projects) */
  context: Record<string, unknown>
}) {
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [turns, setTurns] = useState<Turn[]>([])
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.functions
      .invoke('ask', { body: { ping: true } })
      .then(({ data, error }) => setEnabled(!error && !!(data as { configured?: boolean })?.configured))
      .catch(() => setEnabled(false))
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [turns, busy])

  async function ask(question: string) {
    const text = question.trim()
    if (!text || busy) return
    if (turns.filter((t) => t.role === 'user').length >= 8) {
      setError('That is the limit for one session — call us for the rest.')
      return
    }
    setError('')
    setQ('')
    const next: Turn[] = [...turns, { role: 'user', content: text }]
    setTurns(next)
    setBusy(true)
    try {
      const { data, error } = await supabase.functions.invoke('ask', {
        body: { slug: pkg.slug, question: text, history: next.slice(-6, -1), context },
      })
      if (error) throw error
      const answer = (data as { answer?: string })?.answer
      if (!answer) throw new Error('empty')
      setTurns([...next, { role: 'assistant', content: answer }])
    } catch {
      setError("Couldn't get an answer just now — try again in a moment.")
      setTurns(next.slice(0, -1))
    } finally {
      setBusy(false)
    }
  }

  if (!enabled) return null

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-card">
      <div className="flex items-center gap-3 border-b border-line bg-pine px-5 py-4 text-paper">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brass/20 text-brass-bright">
          <Sparkles size={17} />
        </span>
        <div>
          <p className="eyebrow !text-brass-bright">Ask about this package</p>
          <p className="text-[13px] text-paper/65">Answers from the listing's own numbers and the area's public record</p>
        </div>
      </div>

      <div className="max-h-[420px] space-y-3 overflow-y-auto px-5 py-4">
        {turns.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {SUGGESTED.map((s) => (
              <button
                key={s}
                onClick={() => ask(s)}
                className="rounded-lg border border-line bg-paper px-3 py-1.5 text-left text-[13px] text-ink transition-colors hover:border-brass"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {turns.map((t, i) => (
          <div
            key={i}
            className={`max-w-[92%] whitespace-pre-wrap rounded-xl px-4 py-3 text-[13.5px] leading-relaxed ${
              t.role === 'user' ? 'ml-auto bg-pine text-paper' : 'bg-cream text-ink'
            }`}
          >
            {t.content}
          </div>
        ))}
        {busy && (
          <div className="flex items-center gap-2 text-[13px] text-muted">
            <Loader2 size={14} className="animate-spin" /> Working through the numbers…
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          ask(q)
        }}
        className="flex items-center gap-2 border-t border-line px-4 py-3"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ask anything about this package or area…"
          aria-label="Your question"
          className="field !py-2.5 text-[14px]"
          maxLength={400}
        />
        <button
          disabled={busy || !q.trim()}
          aria-label="Send"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brass text-pine transition-colors hover:bg-brass-bright disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </form>
      {error && <p className="px-5 pb-3 text-[12.5px] font-medium text-danger">{error}</p>}
      <p className="border-t border-line px-5 py-3 text-[11px] text-mist">
        AI-generated general information from this listing and public sources — not personal
        financial, legal or tax advice. Check anything that matters with a licensed adviser.
      </p>
    </div>
  )
}
