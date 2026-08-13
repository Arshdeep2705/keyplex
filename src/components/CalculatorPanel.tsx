import { useMemo, useState } from 'react'
import { Calculator } from 'lucide-react'
import type { Pkg } from '../lib/types'
import { dutiableValue, dutyWithConcession, fhog, monthlyRepayment } from '../lib/calc'
import { money } from '../lib/format'

function Slider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  format: (v: number) => string
  onChange: (v: number) => void
}) {
  const fill = ((value - min) / (max - min)) * 100
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[12.5px] font-medium text-muted">{label}</span>
        <span className="tnum rounded-md bg-cream px-2 py-0.5 text-[12.5px] font-semibold text-ink">
          {format(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ '--fill': `${fill}%` } as React.CSSProperties}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  )
}

export default function CalculatorPanel({ pkg }: { pkg: Pkg }) {
  const [depositPct, setDepositPct] = useState(10)
  const [ratePct, setRatePct] = useState(5.9)
  const [years, setYears] = useState(30)
  const [isFHB, setIsFHB] = useState(true)

  const r = useMemo(() => {
    const deposit = pkg.price * (depositPct / 100)
    const loan = pkg.price - deposit
    const monthly = monthlyRepayment(loan, ratePct, years, false)
    const dutiable = dutiableValue(pkg)
    const duty = dutyWithConcession(pkg.state, dutiable, isFHB)
    const grant = isFHB ? fhog(pkg.state, pkg.price) : 0
    const upfront = deposit + duty.duty + 3_000 - grant
    return { deposit, loan, monthly, weekly: (monthly * 12) / 52, duty, grant, upfront, dutiable }
  }, [pkg, depositPct, ratePct, years, isFHB])

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-card">
      <div className="flex items-center gap-3 border-b border-line bg-cream/60 px-6 py-5">
        <Calculator size={20} className="text-brass" />
        <div>
          <p className="eyebrow">What would it cost you?</p>
          <h3 className="mt-0.5 font-display text-[18px] font-semibold text-ink">
            Repayments, duty &amp; grants
          </h3>
        </div>
      </div>

      <div className="grid gap-8 p-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-5">
          <Slider label="Deposit" value={depositPct} min={5} max={40} step={1} format={(v) => `${v}% · ${money(Math.round((pkg.price * v) / 100))}`} onChange={setDepositPct} />
          <Slider label="Interest rate" value={ratePct} min={4} max={8.5} step={0.05} format={(v) => `${v.toFixed(2)}% p.a.`} onChange={setRatePct} />
          <Slider label="Loan term" value={years} min={15} max={30} step={5} format={(v) => `${v} years`} onChange={setYears} />

          <div className="flex items-center justify-between rounded-xl border border-line px-4 py-3">
            <span className="text-[13px] font-medium text-muted">First home buyer?</span>
            <div className="flex overflow-hidden rounded-lg border border-line text-[12.5px] font-semibold">
              <button
                onClick={() => setIsFHB(true)}
                className={`px-3.5 py-1.5 transition-colors ${isFHB ? 'bg-pine text-paper' : 'bg-card text-muted'}`}
              >
                Yes
              </button>
              <button
                onClick={() => setIsFHB(false)}
                className={`px-3.5 py-1.5 transition-colors ${!isFHB ? 'bg-pine text-paper' : 'bg-card text-muted'}`}
              >
                No
              </button>
            </div>
          </div>

          {depositPct < 20 && (
            <p className="rounded-xl bg-brass-soft px-4 py-3 text-[12px] leading-relaxed text-ink/80">
              Under 20% deposit? This package sits inside the federal <strong>Home Guarantee Scheme</strong>{' '}
              price caps — eligible buyers purchase with just <strong>5% deposit ({money(Math.round(pkg.price * 0.05))})</strong>{' '}
              and pay no LMI. No income caps since Oct 2025.
            </p>
          )}
        </div>

        <div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-growth-soft px-4 py-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-growth">Per week</p>
              <p className="tnum mt-1 font-display text-[22px] font-semibold text-ink">{money(Math.round(r.weekly))}</p>
            </div>
            <div className="rounded-xl bg-cream px-4 py-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">Per month</p>
              <p className="tnum mt-1 font-display text-[22px] font-semibold text-ink">{money(Math.round(r.monthly))}</p>
            </div>
            <div className="rounded-xl bg-cream px-4 py-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">Loan amount</p>
              <p className="tnum mt-1 font-display text-[22px] font-semibold text-ink">{money(Math.round(r.loan))}</p>
            </div>
            <div className="rounded-xl bg-cream px-4 py-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">Upfront cash</p>
              <p className="tnum mt-1 font-display text-[22px] font-semibold text-ink">{money(Math.round(Math.max(r.upfront, 0)))}</p>
            </div>
          </div>

          <div className="mt-5 space-y-2.5 rounded-xl border border-line px-5 py-4">
            <div className="tnum flex items-center justify-between text-[13.5px]">
              <span className="text-muted">
                Transfer duty{' '}
                {pkg.contract_type === 'two_part' && pkg.land_price
                  ? `— charged on the land only (${money(r.dutiable)})`
                  : '— on the full price'}
              </span>
              <span className="font-bold text-ink">
                {r.duty.duty === 0 ? <span className="text-growth">$0</span> : money(Math.round(r.duty.duty))}
              </span>
            </div>
            {r.duty.saving > 0 && (
              <div className="tnum flex items-center justify-between text-[13px]">
                <span className="text-muted">{r.duty.note}</span>
                <span className="font-semibold text-growth">saves {money(Math.round(r.duty.saving))}</span>
              </div>
            )}
            {r.grant > 0 && (
              <div className="tnum flex items-center justify-between text-[13px]">
                <span className="text-muted">First Home Owner Grant ({pkg.state}, new build)</span>
                <span className="font-semibold text-growth">+{money(r.grant)}</span>
              </div>
            )}
            <div className="tnum flex items-center justify-between text-[13px]">
              <span className="text-muted">Legals &amp; conveyancing (est.)</span>
              <span className="font-semibold text-ink">{money(3000)}</span>
            </div>
            {isFHB && r.duty.saving + r.grant > 0 && (
              <div className="tnum flex items-center justify-between rounded-lg bg-growth-soft px-3 py-2.5 text-[13.5px]">
                <span className="font-semibold text-ink">Total government savings</span>
                <span className="font-bold text-growth">{money(Math.round(r.duty.saving + r.grant))}</span>
              </div>
            )}
          </div>

          {pkg.total_weekly_rent ? (
            <p className="tnum mt-4 rounded-xl bg-growth-soft px-4 py-3 text-[13px] text-ink/85">
              <strong>Investing?</strong> This package has a rental appraisal of{' '}
              <strong>{money(pkg.total_weekly_rent)}/week</strong> (
              {(((pkg.total_weekly_rent * 52) / pkg.price) * 100).toFixed(1)}% gross yield, projected — not
              guaranteed).
            </p>
          ) : null}

          <p className="mt-4 text-[11.5px] leading-relaxed text-mist">
            *Estimates only, based on the inputs shown, principal &amp; interest repayments and 2026 VIC/SA
            first-home-buyer rules for new builds (verified August 2026). Grants and concessions are
            subject to eligibility. Not a loan offer, not financial advice — confirm with your broker and
            conveyancer.
          </p>
        </div>
      </div>
    </div>
  )
}
