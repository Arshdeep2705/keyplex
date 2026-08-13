import { G, Line, Rect, Svg, Text as SvgText } from '@react-pdf/renderer'
import type { FpStorey } from '../lib/floorplan'

const ZONE_FILL: Record<string, string> = {
  living: '#FCFAF5',
  bed: '#F6F1E6',
  wet: '#EEF3EF',
  garage: '#EDEAE2',
  circulation: '#FCFAF5',
  store: '#F4F1EA',
  outdoor: 'none',
}

/** Renders one storey's concept plan into a fixed-width react-pdf Svg. */
export default function FloorplanPdf({ storey, maxW, maxH }: { storey: FpStorey; maxW: number; maxH: number }) {
  const preY = Math.min(...storey.rooms.map((r) => r.y), 0)
  const postY = Math.max(...storey.rooms.map((r) => r.y + r.h), storey.depth)
  const planW = storey.width
  const planH = postY - preY
  const pad = 24
  const scale = Math.min((maxW - pad * 2) / planW, (maxH - pad * 2) / planH)
  const W = planW * scale + pad * 2
  const H = planH * scale + pad * 2
  const ox = pad
  const oy = pad + -preY * scale

  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {storey.rooms.map((r, i) => {
        const x = ox + r.x * scale
        const y = oy + r.y * scale
        const rw = r.w * scale
        const rh = r.h * scale
        const fits = rw > 46 && rh > 26
        return (
          <G key={i}>
            <Rect
              x={x}
              y={y}
              width={rw}
              height={rh}
              fill={ZONE_FILL[r.zone] ?? '#FCFAF5'}
              stroke={r.outdoor ? '#A8A192' : r.open ? '#B7AF9C' : '#3D463F'}
              strokeWidth={r.outdoor || r.open ? 0.8 : 1}
              strokeDasharray={r.outdoor || r.open ? '4 3' : undefined}
            />
            {r.name && fits ? (
              <SvgText
                x={x + rw / 2}
                y={y + rh / 2 - (rh > 40 ? 2 : -2)}
                textAnchor="middle"
                style={{ fontSize: 6.5, fontFamily: 'Archivo', fontWeight: 600, fill: r.outdoor ? '#8d9a92' : '#232B25' }}
              >
                {r.name.toUpperCase()}
              </SvgText>
            ) : null}
            {r.name && fits && rh > 40 ? (
              <SvgText
                x={x + rw / 2}
                y={y + rh / 2 + 8}
                textAnchor="middle"
                style={{ fontSize: 5.5, fontFamily: 'Archivo', fill: '#8d9a92' }}
              >
                {`${r.w.toFixed(1)} x ${r.h.toFixed(1)}`}
              </SvgText>
            ) : null}
          </G>
        )
      })}
      <Rect x={ox} y={oy} width={storey.width * scale} height={storey.depth * scale} fill="none" stroke="#16241D" strokeWidth={2.2} />
      {/* overall dims */}
      <Line x1={ox} y1={oy - 10} x2={ox + storey.width * scale} y2={oy - 10} stroke="#8d9a92" strokeWidth={0.7} />
      <SvgText x={ox + (storey.width * scale) / 2} y={oy - 13} textAnchor="middle" style={{ fontSize: 6, fontFamily: 'Archivo', fill: '#5A655E' }}>
        {`${storey.width.toFixed(1)} m`}
      </SvgText>
      <Line x1={ox - 10} y1={oy} x2={ox - 10} y2={oy + storey.depth * scale} stroke="#8d9a92" strokeWidth={0.7} />
      <SvgText x={ox - 13} y={oy + (storey.depth * scale) / 2} textAnchor="middle" style={{ fontSize: 6, fontFamily: 'Archivo', fill: '#5A655E' }}>
        {`${storey.depth.toFixed(1)}`}
      </SvgText>
    </Svg>
  )
}
