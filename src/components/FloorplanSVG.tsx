import { useMemo, useState } from 'react'
import { flipStorey, type FpPlan, type FpStorey } from '../lib/floorplan'

const SCALE = 26 // px per metre
const PAD = 46

const ZONE_FILL: Record<string, string> = {
  living: '#FCFAF5',
  bed: '#F6F1E6',
  wet: '#EEF3EF',
  garage: '#F0EDE6',
  circulation: '#FCFAF5',
  store: '#F4F1EA',
  outdoor: 'transparent',
}

function StoreyPlan({ storey, showDims }: { storey: FpStorey; showDims: boolean }) {
  const w = storey.width * SCALE
  const preY = Math.min(...storey.rooms.map((r) => r.y), 0) // porch sits at negative y
  const postY = Math.max(...storey.rooms.map((r) => r.y + r.h), storey.depth)
  const h = (postY - preY) * SCALE
  const ox = PAD
  const oy = PAD + -preY * SCALE

  return (
    <svg
      viewBox={`0 0 ${w + PAD * 2} ${h + PAD * 1.6}`}
      className="w-full"
      role="img"
      aria-label={`${storey.label} concept floor plan`}
    >
      <defs>
        <pattern id="hatch" width="7" height="7" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="7" stroke="#D8D2C2" strokeWidth="1" />
        </pattern>
      </defs>

      {/* rooms */}
      {storey.rooms.map((r, i) => {
        const x = ox + r.x * SCALE
        const y = oy + r.y * SCALE
        const rw = r.w * SCALE
        const rh = r.h * SCALE
        const fontFit = rw > 58 && rh > 34
        const tiny = !fontFit && (rw < 40 || rh < 26)
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={rw}
              height={rh}
              fill={r.zone === 'garage' ? 'url(#hatch)' : ZONE_FILL[r.zone] ?? '#FCFAF5'}
              stroke={r.outdoor ? '#A8A192' : r.open ? '#B7AF9C' : '#3D463F'}
              strokeWidth={r.outdoor || r.open ? 1.1 : 1.4}
              strokeDasharray={r.outdoor || r.open ? '5 4' : undefined}
            />
            {r.name && !tiny && (
              <>
                <text
                  x={x + rw / 2}
                  y={y + rh / 2 + (fontFit && showDims ? -3 : 3)}
                  textAnchor="middle"
                  fontSize={fontFit ? 10.5 : 8.5}
                  fontWeight={600}
                  letterSpacing="0.06em"
                  fill={r.outdoor ? '#8d9a92' : '#232B25'}
                  style={{ textTransform: 'uppercase' }}
                >
                  {r.name}
                </text>
                {fontFit && showDims && (
                  <text x={x + rw / 2} y={y + rh / 2 + 11} textAnchor="middle" fontSize={8.5} fill="#8d9a92">
                    {r.w.toFixed(1)} × {r.h.toFixed(1)}
                  </text>
                )}
              </>
            )}
          </g>
        )
      })}

      {/* envelope outline (thick) */}
      <rect
        x={ox}
        y={oy}
        width={storey.width * SCALE}
        height={storey.depth * SCALE}
        fill="none"
        stroke="#16241D"
        strokeWidth={3}
      />

      {/* overall dimension lines */}
      <g stroke="#8d9a92" strokeWidth={1} fill="#8d9a92" fontSize={9.5}>
        <line x1={ox} y1={oy - 16} x2={ox + storey.width * SCALE} y2={oy - 16} />
        <line x1={ox} y1={oy - 20} x2={ox} y2={oy - 12} />
        <line x1={ox + storey.width * SCALE} y1={oy - 20} x2={ox + storey.width * SCALE} y2={oy - 12} />
        <text x={ox + (storey.width * SCALE) / 2} y={oy - 21} textAnchor="middle" stroke="none">
          {storey.width.toFixed(1)} m
        </text>
        <line x1={ox - 16} y1={oy} x2={ox - 16} y2={oy + storey.depth * SCALE} />
        <line x1={ox - 20} y1={oy} x2={ox - 12} y2={oy} />
        <line x1={ox - 20} y1={oy + storey.depth * SCALE} x2={ox - 12} y2={oy + storey.depth * SCALE} />
        <text
          x={ox - 21}
          y={oy + (storey.depth * SCALE) / 2}
          textAnchor="middle"
          stroke="none"
          transform={`rotate(-90 ${ox - 21} ${oy + (storey.depth * SCALE) / 2})`}
        >
          {storey.depth.toFixed(1)} m
        </text>
      </g>

      {/* storey label + scale bar */}
      <text x={ox} y={h + PAD * 1.28} fontSize={11} fontWeight={600} letterSpacing="0.14em" fill="#B08D57" style={{ textTransform: 'uppercase' }}>
        {storey.label}
      </text>
      <g>
        <line x1={ox + w - PAD - 2 * SCALE - 78} y1={h + PAD * 1.24} x2={ox + w - PAD - 78} y2={h + PAD * 1.24} stroke="#3D463F" strokeWidth={3} />
        <text x={ox + w - PAD - 72} y={h + PAD * 1.28} fontSize={9} fill="#8d9a92">
          2 m
        </text>
      </g>
    </svg>
  )
}

export default function FloorplanSVG({ plan }: { plan: FpPlan }) {
  const [active, setActive] = useState(0)
  const [showDims, setShowDims] = useState(true)
  const [flipped, setFlipped] = useState(false)
  const multi = plan.storeys.length > 1
  const storey = useMemo(() => {
    const base = plan.storeys[Math.min(active, plan.storeys.length - 1)]
    return flipped ? flipStorey(base) : base
  }, [plan, active, flipped])
  const schedule = plan

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-cream/60 px-6 py-4">
        <div>
          <p className="eyebrow">Concept floor plan</p>
          <p className="tnum mt-0.5 text-[13px] text-muted">
            ~{schedule.areaM2} m² · {(schedule.areaM2 / 9.29).toFixed(1)} squares
          </p>
        </div>
        <div className="flex items-center gap-2">
          {multi &&
            plan.storeys.map((s, i) => (
              <button
                key={s.label}
                onClick={() => setActive(i)}
                className={`rounded-lg px-3.5 py-2 text-[13px] font-semibold transition-colors ${
                  active === i ? 'bg-pine text-paper' : 'bg-cream text-muted hover:bg-line'
                }`}
              >
                {s.label}
              </button>
            ))}
          <button
            onClick={() => setShowDims(!showDims)}
            className={`rounded-lg px-3.5 py-2 text-[13px] font-semibold transition-colors ${
              showDims ? 'bg-brass-soft text-brass' : 'bg-cream text-muted'
            }`}
          >
            Dimensions
          </button>
          <button
            onClick={() => setFlipped(!flipped)}
            className={`rounded-lg px-3.5 py-2 text-[13px] font-semibold transition-colors ${
              flipped ? 'bg-brass-soft text-brass' : 'bg-cream text-muted'
            }`}
            title="Mirror the plan left-to-right"
          >
            Flip plan
          </button>
        </div>
      </div>
      {/* on phones the plan keeps a legible minimum width and pans horizontally */}
      <div className="overflow-x-auto bg-paper px-4 py-4">
        <div className="min-w-[520px] sm:min-w-0">
          <StoreyPlan storey={storey} showDims={showDims} />
        </div>
      </div>
      <p className="border-t border-line px-6 py-3 text-[11px] text-mist">
        <span className="sm:hidden">Swipe the plan to pan. </span>
        Auto-generated concept plan — indicative only, not for construction. Final working drawings are
        prepared by the builder and may differ. Dimensions approximate.
      </p>
    </div>
  )
}
