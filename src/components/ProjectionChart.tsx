import { useMemo, useState } from 'react'
import type { ProjectionPoint } from '../lib/calc'
import { moneyShort } from '../lib/format'

const W = 560
const H = 250
const M = { l: 56, r: 14, t: 14, b: 28 }
const EQUITY = '#1E8055'
const CASHFLOW = '#C1862F'

function niceTicks(min: number, max: number, count = 4): number[] {
  const span = max - min || 1
  const step = Math.pow(10, Math.floor(Math.log10(span / count)))
  const err = span / count / step
  const mult = err >= 7.5 ? 10 : err >= 3.5 ? 5 : err >= 1.5 ? 2 : 1
  const s = mult * step
  const ticks: number[] = []
  for (let v = Math.ceil(min / s) * s; v <= max + 1e-9; v += s) ticks.push(v)
  return ticks
}

export default function ProjectionChart({ points }: { points: ProjectionPoint[] }) {
  const [hover, setHover] = useState<number | null>(null)

  const { xs, yEquity, yCash, ticks, yScale } = useMemo(() => {
    const values = points.flatMap((p) => [p.equity, p.cumulativeCashflow])
    const lo = Math.min(0, ...values)
    const hi = Math.max(0, ...values)
    const pad = (hi - lo) * 0.08
    const yMin = lo - (lo < 0 ? pad : 0)
    const yMax = hi + pad
    const yScale = (v: number) => M.t + (H - M.t - M.b) * (1 - (v - yMin) / (yMax - yMin || 1))
    const xScale = (i: number) => M.l + ((W - M.l - M.r) * i) / Math.max(points.length - 1, 1)
    return {
      xs: points.map((_, i) => xScale(i)),
      yEquity: points.map((p) => yScale(p.equity)),
      yCash: points.map((p) => yScale(p.cumulativeCashflow)),
      ticks: niceTicks(yMin, yMax),
      yScale,
    }
  }, [points])

  if (!points.length) return null

  const path = (ys: number[]) => ys.map((y, i) => `${i === 0 ? 'M' : 'L'}${xs[i]},${y}`).join(' ')
  const h = hover != null ? points[hover] : null

  return (
    <div className="relative">
      {/* legend — identity never by color alone (labels repeat at line ends) */}
      <div className="mb-2 flex items-center gap-5 text-[12px] font-medium text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-[3px] w-4 rounded-full" style={{ background: EQUITY }} /> Equity
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-[3px] w-4 rounded-full" style={{ background: CASHFLOW }} /> Cumulative cashflow
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const x = ((e.clientX - rect.left) / rect.width) * W
          let best = 0
          xs.forEach((px, i) => {
            if (Math.abs(px - x) < Math.abs(xs[best] - x)) best = i
          })
          setHover(best)
        }}
      >
        {/* grid + $ axis */}
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={M.l}
              x2={W - M.r}
              y1={yScale(t)}
              y2={yScale(t)}
              stroke={t === 0 ? '#8d9a92' : '#ece7db'}
              strokeWidth={t === 0 ? 1.2 : 1}
            />
            <text x={M.l - 8} y={yScale(t) + 3.5} textAnchor="end" fontSize={10.5} fill="#8d9a92">
              {moneyShort(t)}
            </text>
          </g>
        ))}
        {/* year labels */}
        {points.map((p, i) =>
          i % 2 === 1 || points.length <= 5 ? (
            <text key={p.year} x={xs[i]} y={H - 8} textAnchor="middle" fontSize={10.5} fill="#8d9a92">
              Y{p.year}
            </text>
          ) : null,
        )}

        {/* crosshair */}
        {hover != null && (
          <line x1={xs[hover]} x2={xs[hover]} y1={M.t} y2={H - M.b} stroke="#b08d57" strokeWidth={1} strokeDasharray="3 3" />
        )}

        <path d={path(yEquity)} fill="none" stroke={EQUITY} strokeWidth={2} strokeLinejoin="round" />
        <path d={path(yCash)} fill="none" stroke={CASHFLOW} strokeWidth={2} strokeLinejoin="round" />

        {/* direct labels at line ends */}
        <text x={xs[xs.length - 1] - 4} y={yEquity[yEquity.length - 1] - 8} textAnchor="end" fontSize={11} fontWeight={600} fill={EQUITY}>
          {moneyShort(points[points.length - 1].equity)}
        </text>
        <text
          x={xs[xs.length - 1] - 4}
          y={yCash[yCash.length - 1] + (Math.abs(yCash[yCash.length - 1] - yEquity[yEquity.length - 1]) < 20 ? 16 : -8)}
          textAnchor="end"
          fontSize={11}
          fontWeight={600}
          fill={CASHFLOW}
        >
          {moneyShort(points[points.length - 1].cumulativeCashflow)}
        </text>

        {/* hover markers */}
        {hover != null && (
          <>
            <circle cx={xs[hover]} cy={yEquity[hover]} r={4.5} fill={EQUITY} stroke="#fff" strokeWidth={2} />
            <circle cx={xs[hover]} cy={yCash[hover]} r={4.5} fill={CASHFLOW} stroke="#fff" strokeWidth={2} />
          </>
        )}
      </svg>

      {h && (
        <div
          className="pointer-events-none absolute rounded-lg border border-line bg-card px-3 py-2 text-[12px] shadow-lift"
          style={{
            left: `${(xs[hover!] / W) * 100}%`,
            top: 20,
            transform: xs[hover!] > W * 0.65 ? 'translateX(-108%)' : 'translateX(10px)',
          }}
        >
          <p className="font-semibold text-ink">Year {h.year}</p>
          <p className="tnum mt-0.5 text-muted">
            Equity <span className="font-semibold" style={{ color: EQUITY }}>{moneyShort(h.equity)}</span>
          </p>
          <p className="tnum text-muted">
            Cum. cashflow{' '}
            <span className="font-semibold" style={{ color: CASHFLOW }}>{moneyShort(h.cumulativeCashflow)}</span>
          </p>
        </div>
      )}

      {/* accessible table view */}
      <details className="mt-2">
        <summary className="cursor-pointer text-[12px] font-medium text-mist hover:text-brass">
          View as table
        </summary>
        <div className="mt-2 overflow-x-auto">
          <table className="tnum w-full text-left text-[12px] text-muted">
            <thead>
              <tr className="border-b border-line text-[11px] uppercase tracking-wide">
                <th className="py-1.5 pr-3">Year</th>
                <th className="py-1.5 pr-3">Value</th>
                <th className="py-1.5 pr-3">Loan</th>
                <th className="py-1.5 pr-3">Equity</th>
                <th className="py-1.5">Cum. cashflow</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.year} className="border-b border-line/60">
                  <td className="py-1.5 pr-3">{p.year}</td>
                  <td className="py-1.5 pr-3">{moneyShort(p.propertyValue)}</td>
                  <td className="py-1.5 pr-3">{moneyShort(p.loanBalance)}</td>
                  <td className="py-1.5 pr-3">{moneyShort(p.equity)}</td>
                  <td className="py-1.5">{moneyShort(p.cumulativeCashflow)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}
