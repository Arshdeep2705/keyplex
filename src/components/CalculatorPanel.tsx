import { useMemo, useState } from 'react'
import { Calculator } from 'lucide-react'
import type { Pkg } from '../lib/types'
import {
  cashflow,
  defaultCashflowInputs,
  dutiableValue,
  project,
  stampDuty,
  type CashflowInputs,
} from '../lib/calc'
import { money, pct } from '../lib/format'
import ProjectionChart from './ProjectionChart'

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
  const [inputs, setInputs] = useState<CashflowInputs>(() => defaultCashflowInputs(pkg))
  const set = (patch: Partial<CashflowInputs>) => setInputs((p) => ({ ...p, ...patch }))

  const result = useMemo(() => cashflow(inputs), [inputs])
  const points = useMemo(
    () => project(inputs, pkg.est_capital_growth ?? 5),
    [inputs, pkg.est_capital_growth],
  )
  const duty = useMemo(() => stampDuty(pkg.state, dutiableValue(pkg)), [pkg])
  const cashNeeded = result.deposit + duty + 3_000

  if (!pkg.total_weekly_rent) return null

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-card">
      <div className="flex items-center gap-3 border-b border-line bg-cream/60 px-6 py-5">
        <Calculator size={20} className="text-brass" />
        <div>
          <p className="eyebrow">Run your own numbers</p>
          <h3 className="mt-0.5 font-display text-[18px] font-semibold text-ink">
            Cashflow &amp; equity modeller
          </h3>
        </div>
      </div>

      <div className="grid gap-8 p-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-5">
          <Slider
            label="Weekly rent (all rooms)"
            value={inputs.weeklyRent}
            min={Math.round((pkg.total_weekly_rent ?? 500) * 0.6)}
            max={Math.round((pkg.total_weekly_rent ?? 500) * 1.4)}
            step={10}
            format={(v) => `${money(v)}/wk`}
            onChange={(v) => set({ weeklyRent: v })}
          />
          <Slider label="Deposit" value={inputs.depositPct} min={10} max={50} step={5} format={(v) => `${v}%`} onChange={(v) => set({ depositPct: v })} />
          <Slider label="Interest rate" value={inputs.ratePct} min={4} max={9} step={0.1} format={(v) => `${v.toFixed(1)}%`} onChange={(v) => set({ ratePct: v })} />
          <Slider label="Vacancy allowance" value={inputs.vacancyPct} min={0} max={15} step={1} format={(v) => `${v}%`} onChange={(v) => set({ vacancyPct: v })} />
          <Slider label="Management fee" value={inputs.mgmtPct} min={5} max={25} step={1} format={(v) => `${v}%`} onChange={(v) => set({ mgmtPct: v })} />

          <div className="flex items-center justify-between rounded-xl border border-line px-4 py-3">
            <span className="text-[13px] font-medium text-muted">Repayment type</span>
            <div className="flex overflow-hidden rounded-lg border border-line text-[12.5px] font-semibold">
              <button
                onClick={() => set({ interestOnly: true })}
                className={`px-3 py-1.5 transition-colors ${inputs.interestOnly ? 'bg-pine text-paper' : 'bg-card text-muted'}`}
              >
                Interest only
              </button>
              <button
                onClick={() => set({ interestOnly: false })}
                className={`px-3 py-1.5 transition-colors ${!inputs.interestOnly ? 'bg-pine text-paper' : 'bg-card text-muted'}`}
              >
                P&amp;I
              </button>
            </div>
          </div>
        </div>

        <div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-growth-soft px-4 py-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-growth">Gross yield</p>
              <p className="tnum mt-1 font-display text-[22px] font-semibold text-ink">{pct(result.grossYieldPct)}</p>
            </div>
            <div className="rounded-xl bg-cream px-4 py-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">Net yield</p>
              <p className="tnum mt-1 font-display text-[22px] font-semibold text-ink">{pct(result.netYieldPct)}</p>
            </div>
            <div className={`rounded-xl px-4 py-3.5 ${result.weeklyCashflow >= 0 ? 'bg-growth-soft' : 'bg-danger-soft'}`}>
              <p className={`text-[11px] font-semibold uppercase tracking-[0.1em] ${result.weeklyCashflow >= 0 ? 'text-growth' : 'text-danger'}`}>
                Weekly cashflow
              </p>
              <p className="tnum mt-1 font-display text-[22px] font-semibold text-ink">
                {result.weeklyCashflow >= 0 ? '+' : ''}
                {money(Math.round(result.weeklyCashflow))}
              </p>
            </div>
            <div className="rounded-xl bg-cream px-4 py-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">Cash to start</p>
              <p className="tnum mt-1 font-display text-[22px] font-semibold text-ink">{money(Math.round(cashNeeded))}</p>
            </div>
          </div>

          <p className="tnum mt-2.5 text-[12px] text-mist">
            Incl. transfer duty ≈ {money(Math.round(duty))} on{' '}
            {pkg.contract_type === 'two_part' && pkg.land_price
              ? `the land component only (two-part contract, ${pkg.state})`
              : `the full price (single-part contract, ${pkg.state})`}{' '}
            + ~$3k legals.
          </p>

          <div className="mt-6">
            <ProjectionChart points={points} />
          </div>

          <p className="mt-4 text-[11.5px] leading-relaxed text-mist">
            *Projected, not guaranteed. Assumes {pct(pkg.est_capital_growth ?? 5)} capital growth, 3% annual
            rent growth, {inputs.vacancyPct}% vacancy, {inputs.mgmtPct}% management,{' '}
            {money(inputs.insurancePerYear)} insurance, {money(inputs.ratesPerYear)} rates,{' '}
            {money(inputs.maintenancePerYear)} maintenance
            {inputs.utilitiesPerYear > 0 ? `, ${money(inputs.utilitiesPerYear)} owner-paid utilities` : ''}.
            General information only — not financial advice. Seek independent advice before investing.
          </p>
        </div>
      </div>
    </div>
  )
}
