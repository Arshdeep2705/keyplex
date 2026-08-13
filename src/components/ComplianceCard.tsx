import { CheckCircle2, ExternalLink, Info, ShieldCheck, XCircle } from 'lucide-react'
import type { Pkg } from '../lib/types'
import { getCompliance } from '../lib/compliance'

export default function ComplianceCard({ pkg }: { pkg: Pkg }) {
  const c = getCompliance(pkg)

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-card">
      <div className="flex items-start gap-3 border-b border-line bg-cream/60 px-6 py-5">
        <ShieldCheck className="mt-0.5 shrink-0 text-growth" size={20} />
        <div>
          <p className="eyebrow">Compliance pathway · {pkg.state}</p>
          <h3 className="mt-1 font-display text-[18px] font-semibold text-ink">{c.classification}</h3>
        </div>
      </div>

      <div className="px-6 py-5">
        <p className="text-[14px] leading-relaxed text-muted">{c.summary}</p>

        {c.checks.length > 0 && (
          <ul className="mt-5 space-y-2.5">
            {c.checks.map((ch) => (
              <li key={ch.label} className="flex items-center justify-between gap-3 text-[13.5px]">
                <span className="flex items-center gap-2 text-ink">
                  {ch.pass === true ? (
                    <CheckCircle2 size={16} className="shrink-0 text-growth" />
                  ) : ch.pass === false ? (
                    <XCircle size={16} className="shrink-0 text-danger" />
                  ) : (
                    <Info size={16} className="shrink-0 text-brass" />
                  )}
                  {ch.label}
                </span>
                <span className="tnum whitespace-nowrap font-medium text-muted">{ch.value}</span>
              </li>
            ))}
          </ul>
        )}

        {c.layers.length > 0 && (
          <div className="mt-5 space-y-4 border-t border-line pt-5">
            {c.layers.map((l) => (
              <div key={l.title}>
                <p className="text-[13px] font-semibold text-ink">{l.title}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">{l.body}</p>
                {l.link && (
                  <a
                    href={l.link}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 text-[12.5px] font-medium text-growth hover:underline"
                  >
                    {l.linkLabel ?? l.link} <ExternalLink size={12} />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {c.financeNote && (
          <div className="mt-5 rounded-xl bg-brass-soft px-4 py-3.5">
            <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-brass">Finance readiness</p>
            <p className="mt-1 text-[13px] leading-relaxed text-ink/80">{c.financeNote}</p>
          </div>
        )}

        <p className="mt-4 text-[11.5px] text-mist">
          General information only, not legal advice. Compliance information last verified {c.lastVerified}.
        </p>
      </div>
    </div>
  )
}
