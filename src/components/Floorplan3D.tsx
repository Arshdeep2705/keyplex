import { useEffect, useMemo, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import type { FpPlan, FpRoom } from '../lib/floorplan'

/**
 * Architectural massing model of a generated floorplan: every room is extruded into a block,
 * the storeys stack, and the whole model turns on a turntable. Pure SVG projection — no 3D
 * library, so it ships in a few KB and renders identically on a phone.
 */

const S = 22 // px per metre on the ground plane
const E = 0.55 // vertical squash of the ground plane (camera elevation)
const ZS = 0.95 // px per metre of height, relative to S
const WALL = 2.7
const SLAB = 0.35

const TOP: Record<string, string> = {
  living: '#FCFAF5',
  bed: '#F6F1E6',
  wet: '#E3EEE8',
  garage: '#E7E2D8',
  circulation: '#F8F4EC',
  store: '#F1ECE1',
  outdoor: '#E9E3D3',
}

interface Box {
  room: FpRoom
  z0: number
  h: number
  storey: number
  cx: number
  cy: number
}

function heightFor(r: FpRoom): number {
  if (r.outdoor) return 0.18
  if (r.zone === 'circulation') return 0.06
  return WALL
}

/** Wall shade from the rotated outward normal — light comes from the upper-left. */
function shade(nx: number): string {
  const t = (nx + 1) / 2 // 0 = facing left (dark) … 1 = facing right (light)
  const from = [201, 193, 174]
  const to = [236, 229, 214]
  const c = from.map((f, i) => Math.round(f + (to[i] - f) * t))
  return `rgb(${c[0]} ${c[1]} ${c[2]})`
}

export default function Floorplan3D({
  plan,
  className = '',
  spin = true,
  height,
}: {
  plan: FpPlan
  className?: string
  spin?: boolean
  height?: number
}) {
  const reduce = useReducedMotion()
  const ref = useRef<SVGSVGElement>(null)
  const angle = useRef(38)
  const progress = useRef(0)
  const idleUntil = useRef(0)
  const drag = useRef<{ x: number; a: number } | null>(null)
  const [, tick] = useState(0)
  const [seen, setSeen] = useState(false)

  // plan → boxes, centred on the origin so the turntable pivots around the middle of the house
  const { boxes, W, D, zmax } = useMemo(() => {
    const W = plan.width
    const preY = Math.min(0, ...plan.storeys.flatMap((s) => s.rooms.map((r) => r.y)))
    const postY = Math.max(plan.depth, ...plan.storeys.flatMap((s) => s.rooms.map((r) => r.y + r.h)))
    const D = postY - preY
    const boxes: Box[] = []
    plan.storeys.forEach((s, si) => {
      const z0 = si * (WALL + SLAB)
      for (const r of s.rooms) {
        boxes.push({
          room: r,
          z0,
          h: heightFor(r),
          storey: si,
          cx: r.x + r.w / 2 - W / 2,
          cy: r.y + r.h / 2 - preY - D / 2,
        })
      }
    })
    const zmax = (plan.storeys.length - 1) * (WALL + SLAB) + WALL
    return { boxes: boxes.map((b) => ({ ...b, room: { ...b.room, y: b.room.y - preY } })), W, D, zmax }
  }, [plan])

  // static viewBox that fits every rotation, so the frame never jumps while it spins
  const R = Math.sqrt((W / 2 + 1.6) ** 2 + (D / 2 + 1.6) ** 2)
  const vbX = -R * S
  const vbW = 2 * R * S
  const vbY = -R * S * E - zmax * S * ZS - 6
  const vbH = 2 * R * S * E + zmax * S * ZS + 24

  // draw-in + turntable: one rAF loop, only while on screen
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold: 0.15 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!seen) return
    if (reduce) {
      progress.current = 1
      tick((t) => t + 1)
      return
    }
    let raf = 0
    let last = performance.now()
    // draw-in is clocked on elapsed time, not frames, so a throttled tab or a slow phone
    // still finishes in ~1.6s instead of crawling one frame at a time
    const started = performance.now() - progress.current * 1600
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      let changed = false
      if (progress.current < 1) {
        progress.current = Math.min(1, (now - started) / 1600)
        changed = true
      }
      if (spin && !drag.current && now > idleUntil.current) {
        angle.current = (angle.current + dt * 9) % 360
        changed = true
      }
      if (changed) tick((t) => t + 1)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [seen, spin, reduce])

  function onDown(e: React.PointerEvent<SVGSVGElement>) {
    drag.current = { x: e.clientX, a: angle.current }
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }
  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!drag.current) return
    angle.current = (drag.current.a + (e.clientX - drag.current.x) * 0.6 + 360) % 360
    tick((t) => t + 1)
  }
  function onUp() {
    drag.current = null
    idleUntil.current = performance.now() + 3500
  }

  const th = (angle.current * Math.PI) / 180
  const cos = Math.cos(th)
  const sin = Math.sin(th)
  const p = (x: number, y: number, z: number) => {
    const rx = x * cos - y * sin
    const ry = x * sin + y * cos
    return { sx: rx * S, sy: ry * S * E - z * S * ZS, d: ry }
  }
  const pt = (q: { sx: number; sy: number }) => `${q.sx.toFixed(1)},${q.sy.toFixed(1)}`

  // painter's order: lower storey first, then far → near
  const ordered = boxes
    .map((b, i) => ({ b, i, d: b.cx * sin + b.cy * cos }))
    .sort((a, c) => a.b.storey - c.b.storey || a.d - c.d)

  const ease = (t: number) => 1 - Math.pow(1 - t, 3)

  // ground plate
  const gx = W / 2 + 1.4
  const gy = D / 2 + 1.4
  const plate = [p(-gx, -gy, -0.05), p(gx, -gy, -0.05), p(gx, gy, -0.05), p(-gx, gy, -0.05)]

  return (
    <svg
      ref={ref}
      viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
      className={`w-full touch-pan-y select-none ${drag.current ? 'cursor-grabbing' : 'cursor-grab'} ${className}`}
      style={height ? { height } : undefined}
      role="img"
      aria-label="3D massing model of the concept floor plan"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <defs>
        <radialGradient id="fp3d-shadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0f1512" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#0f1512" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* soft ground shadow + lot plate */}
      <ellipse cx={0} cy={4} rx={R * S * 0.78} ry={R * S * E * 0.62} fill="url(#fp3d-shadow)" />
      <polygon points={plate.map(pt).join(' ')} fill="#E4DFD1" stroke="#CFC7B4" strokeWidth={1} />

      {ordered.map(({ b, i }, order) => {
        const r = b.room
        const local = Math.max(0, Math.min(1, (progress.current - order * 0.045) / 0.55))
        const h = b.h * ease(local)
        if (local <= 0 && b.storey > 0) return null
        const x0 = r.x - W / 2
        const y0 = r.y - D / 2
        const x1 = x0 + r.w
        const y1 = y0 + r.h
        const corners = [
          [x0, y0],
          [x1, y0],
          [x1, y1],
          [x0, y1],
        ] as const
        const normals = [
          [0, -1],
          [1, 0],
          [0, 1],
          [-1, 0],
        ] as const
        const z1 = b.z0 + h
        const faces: { pts: string; fill: string; d: number }[] = []
        for (let k = 0; k < 4; k++) {
          const a = corners[k]
          const c = corners[(k + 1) % 4]
          const n = normals[k]
          const ny = n[0] * sin + n[1] * cos // faces the camera when positive
          if (ny <= 0.02 || h < 0.1) continue
          const nx = n[0] * cos - n[1] * sin
          const pts = [p(a[0], a[1], b.z0), p(c[0], c[1], b.z0), p(c[0], c[1], z1), p(a[0], a[1], z1)]
          faces.push({ pts: pts.map(pt).join(' '), fill: shade(nx), d: ny })
        }
        const top = corners.map(([x, y]) => p(x, y, z1))
        const centre = p((x0 + x1) / 2, (y0 + y1) / 2, z1)
        const area = r.w * r.h
        const label = r.name && !r.outdoor && area > 7 && local > 0.85
        const fs = Math.max(6.5, Math.min(9.5, Math.sqrt(area) * 1.6))
        return (
          <g key={i} opacity={Math.min(1, local * 1.6)}>
            {faces.map((f, k) => (
              <polygon key={k} points={f.pts} fill={f.fill} stroke="#6b6553" strokeWidth={0.35} strokeLinejoin="round" />
            ))}
            <polygon
              points={top.map(pt).join(' ')}
              fill={TOP[r.zone] ?? '#FCFAF5'}
              stroke={r.outdoor || r.open ? '#B7AF9C' : '#3D463F'}
              strokeWidth={r.outdoor || r.open ? 0.5 : 0.8}
              strokeDasharray={r.outdoor || r.open ? '3 2.5' : undefined}
              strokeLinejoin="round"
            />
            {label && (
              <text
                x={centre.sx}
                y={centre.sy + fs * 0.35}
                textAnchor="middle"
                fontSize={fs}
                fontWeight={600}
                letterSpacing="0.06em"
                fill="#232B25"
                style={{ textTransform: 'uppercase', pointerEvents: 'none' }}
              >
                {r.name}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
