import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, TrendingUp } from 'lucide-react'
import type { Pkg } from '../lib/types'
import { TAX_BANDS, defaultInputs, runModel, type InvestInputs, type YearRow } from '../lib/invest'
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
        <span className="tnum rounded-md bg-cream px-2 py-0.5 text-[12.5px] font-semibold text-ink">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        aria-valuetext={format(value)}
        style={{ '--fill': `${fill}%` } as React.CSSProperties}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  )
}

const k = (n: number) => `$${Math.round(n / 1000)}k`

/** Property value vs loan balance over the projection — one axis, two series, direct-labelled. */
function EquityChart({ rows }: { rows: YearRow[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const W = 640
  const H = 230
  const padL = 48
  const padR = 16
  const padT = 14
  const padB = 28
  const max = Math.max(...rows.map((r) => r.value)) * 1.05
  const x = (i: number) => padL + (i / Math.max(1, rows.length - 1)) * (W - padL - padR)
  const y = (v: number) => padT + (1 - v / max) * (H - padT - padB)
  const path = (key: 'value' | 'loan') => rows.map((r, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(r[key]).toFixed(1)}`).join(' ')
  const area = `${path('value')} L${x(rows.length - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z`
  const ticks = [0, 0.5, 1].map((t) => t * max)
  const hv = hover != null ? rows[hover] : null

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="Projected property value and loan balance by year"
        onPointerMove={(e) => {
          const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect()
          const px = ((e.clientX - r.left) / r.width) * W
          const i = Math.round(((px - padL) / (W - padL - padR)) * (rows.length - 1))
          setHover(Math.max(0, Math.min(rows.length - 1, i)))
        }}
        onPointerLeave={() => setHover(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke="#e6e0d2" strokeWidth={1} />
            <text x={padL - 8} y={y(t) + 4} textAnchor="end" fontSize={10} fill="#6f7d75">{k(t)}</text>
          </g>
        ))}
        <path d={area} fill="#cba76f" fillOpacity={0.12} />
        <path d={path('value')} fill="none" stroke="#b08d57" strokeWidth={2} strokeLinejoin="round" />
        <path d={path('loan')} fill="none" stroke="#16241d" strokeWidth={2} strokeLinejoin="round" strokeDasharray="5 4" />
        {rows.map((r, i) => (
          <text key={r.year} x={x(i)} y={H - 8} textAnchor="middle" fontSize={10} fill="#6f7d75">
            {i === 0 ? 'Yr 1' : r.year}
          </text>
        ))}
        {hv && hover != null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={padT} y2={H - padB} stroke="#b08d57" strokeWidth={1} strokeDasharray="3 3" />
            <circle cx={x(hover)} cy={y(hv.value)} r={5} fill="#b08d57" stroke="#faf7f1" strokeWidth={2} />
            <circle cx={x(hover)} cy={y(hv.loan)} r={5} fill="#16241d" stroke="#faf7f1" strokeWidth={2} />
          </g>
        )}
        <text x={x(rows.length - 1) - 4} y={y(rows[rows.length - 1].value) - 8} textAnchor="end" fontSize={10.5} fontWeight={600} fill="#b08d57">Value</text>
        <text x={x(rows.length - 1) - 4} y={y(rows[rows.length - 1].loan) + 14} textAnchor="end" fontSize={10.5} fontWeight={600} fill="#16241d">Loan</text>
      </svg>
      {hv && (
        <div className="tnum pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 rounded-lg border border-line bg-card px-3 py-2 text-[12px] shadow-lift">
          <span className="font-semibold text-ink">Year {hv.year}</span> · value {money(Math.round(hv.value))} · loan {money(Math.round(hv.loan))} ·{' '}
          <span className="font-semibold text-growth">equity {money(Math.round(hv.equity))}</span>
        </div>
      )}
      <div className="mt-1 flex items-center gap-4 text-[11.5px] text-muted">
        <span className="flex items-center gap-1.5"><span className="inline-block h-0.5 w-4 bg-brass" /> Property value</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-0.5 w-4 border-t-2 border-dashed border-pine" /> Loan balance</span>
      </div>
    </div>
  )
}

/** After-tax annual cash position — polarity, so two hues around a neutral baseline. */
function CashBars({ rows }: { rows: YearRow[] }) {
  const W = 640
  const H = 150
  const padL = 48
  const padR = 16
  const padT = 12
  const padB = 24
  const lim = Math.max(1, ...rows.map((r) => Math.abs(r.netCash))) * 1.15
  const zero = padT + (H - padT - padB) / 2
  const scale = (H - padT - padB) / 2 / lim
  const bw = ((W - padL - padR) / rows.length) * 0.62
  const x = (i: number) => padL + ((i + 0.5) / rows.length) * (W - padL - padR) - bw / 2
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="After-tax annual cash position by year">
      <line x1={padL} x2={W - padR} y1={zero} y2={zero} stroke="#3d463f" strokeWidth={1} />
      <text x={padL - 8} y={zero + 4} textAnchor="end" fontSize={10} fill="#6f7d75">$0</text>
      {rows.map((r, i) => {
        const h = Math.abs(r.netCash) * scale
        const up = r.netCash >= 0
        return (
          <g key={r.year}>
            <rect x={x(i)} y={up ? zero - h : zero} width={bw} height={h} rx={3} fill={up ? '#2e7d5b' : '#b3543e'}>
              <title>{`Year ${r.year}: ${money(Math.round(r.netCash))} after tax`}</title>
            </rect>
            <text x={x(i) + bw / 2} y={H - 8} textAnchor="middle" fontSize={10} fill="#6f7d75">{r.year}</text>
            {(i === 0 || i === rows.length - 1) && (
              <text x={x(i) + bw / 2} y={up ? zero - h - 5 : zero + h + 11} textAnchor="middle" fontSize={10} fontWeight={600} fill={up ? '#2e7d5b' : '#b3543e'}>
                {k(r.netCash)}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

export default function InvestorPanel({
  pkg,
  onSummary,
}: {
  pkg: Pkg
  onSummary?: (summary: Record<string, unknown>) => void
}) {
  const [inp, setInp] = useState<InvestInputs>(() => defaultInputs(pkg))
  const [showExpenses, setShowExpenses] = useState(false)
  const set = <K extends keyof InvestInputs>(key: K, v: InvestInputs[K]) => setInp((p) => ({ ...p, [key]: v }))
  const r = useMemo(() => runModel(pkg, inp), [pkg, inp])
  const rentIsEstimate = !pkg.total_weekly_rent

  useEffect(() => {
    onSummary?.({
      assumptions: inp,
      weekly_after_tax: Math.round(r.weeklyOutOfPocket),
      weekly_pre_tax: Math.round(r.weeklyPreTax),
      gross_yield_pct: +(r.grossYield * 100).toFixed(2),
      net_yield_pct: +(r.netYield * 100).toFixed(2),
      year1_depreciation: Math.round(r.year1.depreciation),
      year1_tax_effect: Math.round(r.year1.taxEffect),
      stamp_duty: Math.round(r.duty),
      dutiable_value: r.dutiable,
      upfront_cash: Math.round(r.upfront),
      holding_cost_during_build: Math.round(r.holdingDuringBuild),
      land_tax_annual: Math.round(r.landTax),
      equity_year10: Math.round(r.rows[r.rows.length - 1].equity),
      break_even_year: r.breakEvenYear,
      rent_is_estimate: rentIsEstimate,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r])

  const tile = (label: string, value: string, sub?: string, tone: 'default' | 'good' | 'bad' = 'default') => (
    <div className={`rounded-xl px-4 py-3.5 ${tone === 'good' ? 'bg-growth-soft' : tone === 'bad' ? 'bg-danger-soft' : 'bg-cream'}`}>
      <p className={`text-[11px] font-semibold uppercase tracking-[0.1em] ${tone === 'good' ? 'text-growth' : tone === 'bad' ? 'text-danger' : 'text-muted'}`}>{label}</p>
      <p className="tnum mt-1 font-display text-[22px] font-semibold text-ink">{value}</p>
      {sub && <p className="tnum mt-0.5 text-[11.5px] text-mist">{sub}</p>}
    </div>
  )

  const wk = r.weeklyOutOfPocket

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-card">
      <div className="flex items-center gap-3 border-b border-line bg-pine px-6 py-5 text-paper">
        <TrendingUp size={20} className="text-brass-bright" />
        <div>
          <p className="eyebrow !text-brass-bright">Investor view</p>
          <h3 className="mt-0.5 font-display text-[18px] font-semibold">Cash flow after tax, and where it goes over 10 years</h3>
        </div>
      </div>

      <div className="grid gap-8 p-6 lg:grid-cols-[320px_1fr]">
        {/* assumptions */}
        <div className="space-y-5">
          <Slider label="Weekly rent" value={inp.weeklyRent} min={300} max={1500} step={5} format={(v) => `${money(v)}/wk${rentIsEstimate ? ' (est.)' : ''}`} onChange={(v) => set('weeklyRent', v)} />
          <Slider label="Deposit" value={inp.depositPct} min={5} max={40} step={1} format={(v) => `${v}% · ${money(Math.round((pkg.price * v) / 100))}`} onChange={(v) => set('depositPct', v)} />
          <Slider label="Investor interest rate" value={inp.ratePct} min={4.5} max={8.5} step={0.05} format={(v) => `${v.toFixed(2)}% p.a.`} onChange={(v) => set('ratePct', v)} />
          <Slider label="Capital growth" value={inp.growthPct} min={0} max={9} step={0.25} format={(v) => `${v.toFixed(2)}% p.a.`} onChange={(v) => set('growthPct', v)} />
          <Slider label="Vacancy allowance" value={inp.vacancyWeeks} min={0} max={8} step={1} format={(v) => `${v} wk${v === 1 ? '' : 's'}/yr`} onChange={(v) => set('vacancyWeeks', v)} />

          <div className="flex items-center justify-between rounded-xl border border-line px-4 py-3">
            <span className="text-[13px] font-medium text-muted">Repayments</span>
            <div className="flex overflow-hidden rounded-lg border border-line text-[12.5px] font-semibold">
              <button onClick={() => set('interestOnly', true)} className={`px-3.5 py-1.5 transition-colors ${inp.interestOnly ? 'bg-pine text-paper' : 'bg-card text-muted'}`}>Interest only</button>
              <button onClick={() => set('interestOnly', false)} className={`px-3.5 py-1.5 transition-colors ${!inp.interestOnly ? 'bg-pine text-paper' : 'bg-card text-muted'}`}>P&amp;I</button>
            </div>
          </div>

          <div>
            <label className="field-label" htmlFor="tax-band">Your taxable income</label>
            <select id="tax-band" className="field !py-2.5 text-[13.5px]" value={inp.marginal} onChange={(e) => set('marginal', Number(e.target.value))}>
              {TAX_BANDS.map((b) => (
                <option key={b.rate} value={b.rate}>{b.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* results */}
        <div className="min-w-0">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {tile(
              wk >= 0 ? 'Cash positive' : 'Out of pocket',
              `${money(Math.round(Math.abs(wk)))}/wk`,
              `after tax · ${money(Math.round(Math.abs(r.weeklyPreTax)))}/wk before`,
              wk >= 0 ? 'good' : 'bad',
            )}
            {tile('Gross yield', `${(r.grossYield * 100).toFixed(1)}%`, `net ${(r.netYield * 100).toFixed(1)}% after costs`)}
            {tile('Year-1 depreciation', money(Math.round(r.year1.depreciation)), `≈ ${money(Math.round(r.year1.depreciation * inp.marginal))} tax back`)}
            {tile('Equity at year 10', money(Math.round(r.rows[r.rows.length - 1].equity)), `at ${inp.growthPct.toFixed(2)}% growth`)}
          </div>

          <div className="mt-6">
            <EquityChart rows={r.rows} />
          </div>
          <div className="mt-6">
            <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-muted">After-tax cash each year</p>
            <p className="mt-0.5 text-[12.5px] text-mist">
              {r.breakEvenYear
                ? `Turns cash-positive in year ${r.breakEvenYear} as rent grows against a fixed rate.`
                : 'Stays negatively geared across the projection at these assumptions.'}
            </p>
            <CashBars rows={r.rows} />
          </div>

          <div className="tnum mt-5 grid gap-2.5 rounded-xl border border-line px-5 py-4 text-[13.5px] sm:grid-cols-2">
            <div className="flex justify-between"><span className="text-muted">Deposit ({inp.depositPct}%)</span><span className="font-semibold text-ink">{money(Math.round(r.deposit))}</span></div>
            <div className="flex justify-between"><span className="text-muted">Transfer duty {pkg.contract_type === 'two_part' && pkg.land_price ? '(land only)' : ''}</span><span className="font-semibold text-ink">{money(Math.round(r.duty))}</span></div>
            <div className="flex justify-between"><span className="text-muted">Legals &amp; conveyancing</span><span className="font-semibold text-ink">{money(r.legals)}</span></div>
            {r.lmi > 0 && <div className="flex justify-between"><span className="text-muted">LMI (est., added to loan)</span><span className="font-semibold text-ink">{money(Math.round(r.lmi))}</span></div>}
            <div className="flex justify-between"><span className="text-muted">Holding cost during build (no rent yet)</span><span className="font-semibold text-ink">{money(Math.round(r.holdingDuringBuild))}</span></div>
            <div className="flex justify-between rounded-lg bg-cream px-3 py-2 sm:col-span-2"><span className="font-semibold text-ink">Upfront cash needed</span><span className="font-bold text-ink">{money(Math.round(r.upfront))}</span></div>
          </div>

          <button
            onClick={() => setShowExpenses(!showExpenses)}
            className="mt-4 flex items-center gap-1.5 text-[13px] font-semibold text-growth hover:underline"
            aria-expanded={showExpenses}
          >
            Year-1 running costs {money(Math.round(r.year1.expenses))}/yr
            <ChevronDown size={14} className={`transition-transform ${showExpenses ? 'rotate-180' : ''}`} />
          </button>
          {showExpenses && (
            <ul className="tnum mt-2 grid gap-1.5 rounded-xl bg-cream px-5 py-4 text-[13px] sm:grid-cols-2">
              {r.expenseBreakdown.map((e) => (
                <li key={e.label} className="flex justify-between"><span className="text-muted">{e.label}</span><span className="font-semibold text-ink">{money(Math.round(e.amount))}</span></li>
              ))}
              <li className="flex justify-between"><span className="text-muted">Interest (year 1)</span><span className="font-semibold text-ink">{money(Math.round(r.year1.interest))}</span></li>
              <li className="flex justify-between"><span className="text-muted">Rent received (year 1)</span><span className="font-semibold text-growth">+{money(Math.round(r.year1.rent))}</span></li>
              <li className="flex justify-between"><span className="text-muted">Tax effect (year 1)</span><span className="font-semibold text-growth">{r.year1.taxEffect >= 0 ? '+' : ''}{money(Math.round(r.year1.taxEffect))}</span></li>
            </ul>
          )}

          <p className="mt-4 text-[11.5px] leading-relaxed text-mist">
            *Estimates from the assumptions shown, FY2026-27 rates. {rentIsEstimate ? 'No rental appraisal is recorded for this package, so the rent is an estimate — adjust it. ' : 'Rent is the recorded appraisal, a projection not a guarantee. '}
            Depreciation uses typical quantity-surveyor splits for a new build (a schedule is required to claim). Land tax on the site value at {pkg.state} general rates; rates, insurance and management are typical growth-corridor figures. Not financial or tax advice — take these numbers to your accountant and broker.
          </p>
        </div>
      </div>
    </div>
  )
}
