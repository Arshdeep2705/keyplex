import { useEffect, useMemo, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { Home, Layers2 } from 'lucide-react'
import type { FpPlan, FpRoom } from '../lib/floorplan'

/**
 * A house model built from a room layout: real walls with thickness, windows on the
 * outside walls, a garage door, a front door, a hip roof with eaves, the pergola and a
 * driveway — projected with a turntable camera into plain SVG. No 3D library, so it is a
 * few KB, deterministic, and renders the same on a phone. The roof lifts off to show the
 * rooms ("dollhouse" view).
 */

const S = 22 // px per metre on the ground plane
const E = 0.52 // camera elevation (ground-plane squash)
const ZS = 0.95 // px per metre of height, relative to S
const WALL_H = 2.55
const EXT_T = 0.24
const INT_T = 0.11
const EAVE = 0.5
const STOREY_H = WALL_H + 0.45

type Vec3 = [number, number, number]

const FLOOR: Record<string, string> = {
  living: '#F4EFE4',
  bed: '#EFE7D8',
  wet: '#DEE9E3',
  garage: '#DAD6CE',
  circulation: '#F1ECE1',
  store: '#EAE4D6',
  outdoor: '#D6D2C8',
}

function hex(c: string): [number, number, number] {
  return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]
}
function rgb(c: [number, number, number], k: number) {
  return `rgb(${Math.round(Math.min(255, c[0] * k))} ${Math.round(Math.min(255, c[1] * k))} ${Math.round(Math.min(255, c[2] * k))})`
}

interface Face {
  pts: Vec3[]
  color: [number, number, number]
  stroke?: string
  strokeWidth?: number
  opacity?: number
  /** faces that must be drawn immediately after this one (windows, doors) */
  decals?: Face[]
  /** which stage of the draw-in reveals it */
  stage: 'floor' | 'wall' | 'roof'
  storey: number
}

interface Label {
  x: number
  y: number
  z: number
  text: string
  area: number
}

interface Seg {
  x1: number
  y1: number
  x2: number
  y2: number
  /** outward normal (away from the owning room) */
  nx: number
  ny: number
  room: FpRoom
  external: boolean
}

const near = (a: number, b: number, tol = 0.16) => Math.abs(a - b) <= tol

/** Splits one room edge into the parts covered by other rooms (internal) and the rest (external). */
function splitEdge(edge: Seg, others: FpRoom[]): Seg[] {
  const horizontal = near(edge.y1, edge.y2, 1e-6)
  const a0 = horizontal ? Math.min(edge.x1, edge.x2) : Math.min(edge.y1, edge.y2)
  const a1 = horizontal ? Math.max(edge.x1, edge.x2) : Math.max(edge.y1, edge.y2)
  const fixed = horizontal ? edge.y1 : edge.x1
  const cover: [number, number, FpRoom][] = []
  for (const o of others) {
    if (o === edge.room || o.outdoor) continue
    if (horizontal) {
      // other room's top or bottom edge on this line, and this edge lies on the far side of it
      const onTop = near(o.y, fixed) && edge.ny < 0
      const onBottom = near(o.y + o.h, fixed) && edge.ny > 0
      if (!onTop && !onBottom) continue
      const s = Math.max(a0, o.x)
      const e = Math.min(a1, o.x + o.w)
      if (e - s > 0.2) cover.push([s, e, o])
    } else {
      const onLeft = near(o.x, fixed) && edge.nx < 0
      const onRight = near(o.x + o.w, fixed) && edge.nx > 0
      if (!onLeft && !onRight) continue
      const s = Math.max(a0, o.y)
      const e = Math.min(a1, o.y + o.h)
      if (e - s > 0.2) cover.push([s, e, o])
    }
  }
  cover.sort((p, q) => p[0] - q[0])
  const out: Seg[] = []
  const mk = (s: number, e: number, external: boolean, other?: FpRoom): Seg => ({
    x1: horizontal ? s : fixed,
    y1: horizontal ? fixed : s,
    x2: horizontal ? e : fixed,
    y2: horizontal ? fixed : e,
    nx: edge.nx,
    ny: edge.ny,
    room: edge.room,
    external,
    ...(other ? { other } : {}),
  })
  let cur = a0
  for (const [s, e, o] of cover) {
    if (s - cur > 0.2) out.push(mk(cur, s, true))
    const isOpen = (r: FpRoom) => r.open || r.zone === 'circulation'
    // no wall at all between two open-plan rooms, or hall → open living
    if (!(isOpen(edge.room) && isOpen(o))) out.push(mk(Math.max(cur, s), e, false, o))
    cur = Math.max(cur, e)
  }
  if (a1 - cur > 0.2) out.push(mk(cur, a1, true))
  return out
}

function buildScene(plan: FpPlan) {
  const faces: Face[] = []
  const labels: Label[] = []
  const preY = Math.min(0, ...plan.storeys.flatMap((s) => s.rooms.map((r) => r.y)))
  const postY = Math.max(plan.depth, ...plan.storeys.flatMap((s) => s.rooms.map((r) => r.y + r.h)))
  const W = plan.width
  const D = postY - preY
  const cx = W / 2
  const cy = preY + D / 2
  const T = (x: number, y: number): [number, number] => [x - cx, y - cy]

  const quad = (p: [number, number][], z0: number, z1: number): Vec3[][] => {
    // side faces of a prism given its footprint polygon (CCW in plan)
    const out: Vec3[][] = []
    for (let i = 0; i < p.length; i++) {
      const a = p[i]
      const b = p[(i + 1) % p.length]
      out.push([
        [a[0], a[1], z0],
        [b[0], b[1], z0],
        [b[0], b[1], z1],
        [a[0], a[1], z1],
      ])
    }
    return out
  }

  const wallColor = hex('#E9E3D7')
  const intColor = hex('#F3EEE4')
  const roofColor = hex('#464B4F')
  const glass = hex('#A9C0CE')
  const timber = hex('#6E4B32')
  const garageDoor = hex('#C8C4BC')

  plan.storeys.forEach((storey, si) => {
    const z0 = si * STOREY_H
    const rooms = storey.rooms
    const interior = rooms.filter((r) => !r.outdoor)

    // ——— floors + labels ———
    for (const r of rooms) {
      const [x0, y0] = T(r.x, r.y)
      const [x1, y1] = T(r.x + r.w, r.y + r.h)
      const zf = z0 + (r.outdoor ? 0.08 : 0.02)
      faces.push({
        pts: [
          [x0, y0, zf],
          [x1, y0, zf],
          [x1, y1, zf],
          [x0, y1, zf],
        ],
        color: hex(FLOOR[r.zone] ?? '#F4EFE4'),
        stroke: r.outdoor ? '#B9B3A6' : undefined,
        strokeWidth: 0.5,
        stage: 'floor',
        storey: si,
      })
      if (r.name && !r.outdoor && r.zone !== 'circulation' && r.w * r.h > 4) {
        labels.push({ x: (x0 + x1) / 2, y: (y0 + y1) / 2, z: zf, text: r.name, area: r.w * r.h })
      }
      if (r.outdoor && r.w * r.h > 4) labels.push({ x: (x0 + x1) / 2, y: (y0 + y1) / 2, z: zf, text: r.name, area: r.w * r.h })
    }

    // ——— walls ———
    const segs: Seg[] = []
    const seen = new Set<string>()
    for (const r of interior) {
      const edges: Seg[] = [
        { x1: r.x, y1: r.y, x2: r.x + r.w, y2: r.y, nx: 0, ny: -1, room: r, external: true },
        { x1: r.x + r.w, y1: r.y, x2: r.x + r.w, y2: r.y + r.h, nx: 1, ny: 0, room: r, external: true },
        { x1: r.x, y1: r.y + r.h, x2: r.x + r.w, y2: r.y + r.h, nx: 0, ny: 1, room: r, external: true },
        { x1: r.x, y1: r.y, x2: r.x, y2: r.y + r.h, nx: -1, ny: 0, room: r, external: true },
      ]
      for (const e of edges) {
        for (const part of splitEdge(e, interior)) {
          if (!part.external) {
            // internal walls are produced by both rooms — keep one
            const key = [part.x1, part.y1, part.x2, part.y2].map((v) => v.toFixed(1)).join(':')
            const rkey = [part.x2, part.y2, part.x1, part.y1].map((v) => v.toFixed(1)).join(':')
            if (seen.has(key) || seen.has(rkey)) continue
            seen.add(key)
          }
          segs.push(part)
        }
      }
    }

    const outdoorRooms = rooms.filter((r) => r.outdoor)
    const touchesOutdoor = (s: Seg) =>
      outdoorRooms.some((o) => {
        const horizontal = near(s.y1, s.y2, 1e-6)
        if (horizontal) {
          const onLine = near(o.y, s.y1) || near(o.y + o.h, s.y1)
          return onLine && Math.min(s.x2, o.x + o.w) - Math.max(s.x1, o.x) > 0.6
        }
        const onLine = near(o.x, s.x1) || near(o.x + o.w, s.x1)
        return onLine && Math.min(s.y2, o.y + o.h) - Math.max(s.y1, o.y) > 0.6
      })

    let frontDoorDone = false
    for (const s of segs) {
      const t = s.external ? EXT_T : INT_T
      const len = Math.hypot(s.x2 - s.x1, s.y2 - s.y1)
      // footprint: external walls sit outside the room line, internal walls straddle it
      const ox = s.external ? s.nx * t : s.nx * (t / 2)
      const oy = s.external ? s.ny * t : s.ny * (t / 2)
      const ix = s.external ? 0 : -s.nx * (t / 2)
      const iy = s.external ? 0 : -s.ny * (t / 2)
      const p1 = T(s.x1 + ix, s.y1 + iy)
      const p2 = T(s.x2 + ix, s.y2 + iy)
      const p3 = T(s.x2 + ox, s.y2 + oy)
      const p4 = T(s.x1 + ox, s.y1 + oy)
      const foot: [number, number][] = [p1, p2, p3, p4]
      const sides = quad(foot, z0, z0 + WALL_H)
      const color = s.external ? wallColor : intColor
      const decalsFor = (face: Vec3[]): Face[] => {
        // decorate only the outer face of external walls
        if (!s.external) return []
        const decals: Face[] = []
        const along: Vec3 = [face[1][0] - face[0][0], face[1][1] - face[0][1], 0]
        const L = Math.hypot(along[0], along[1]) || 1
        const u: Vec3 = [along[0] / L, along[1] / L, 0]
        const out: Vec3 = [s.nx * 0.015, s.ny * 0.015, 0]
        const rect = (start: number, width: number, zb: number, zt: number, col: [number, number, number], stroke?: string): Face => ({
          pts: [
            [face[0][0] + u[0] * start + out[0], face[0][1] + u[1] * start + out[1], z0 + zb],
            [face[0][0] + u[0] * (start + width) + out[0], face[0][1] + u[1] * (start + width) + out[1], z0 + zb],
            [face[0][0] + u[0] * (start + width) + out[0], face[0][1] + u[1] * (start + width) + out[1], z0 + zt],
            [face[0][0] + u[0] * start + out[0], face[0][1] + u[1] * start + out[1], z0 + zt],
          ],
          color: col,
          stroke,
          strokeWidth: 0.6,
          stage: 'wall',
          storey: si,
        })
        const r = s.room
        if (r.zone === 'garage' && len >= 2.4 && s.ny > 0.5) {
          const w = Math.min(len - 0.7, 5.2)
          const start = (len - w) / 2
          decals.push(rect(start, w, 0.05, 2.15, garageDoor, '#8F8A80'))
          for (const zz of [0.58, 1.1, 1.62]) decals.push(rect(start, w, zz, zz + 0.04, hex('#A9A49B')))
        } else if (r.zone === 'circulation' && !frontDoorDone && touchesOutdoor(s) && len >= 1.1) {
          decals.push(rect((len - 0.95) / 2, 0.95, 0.02, 2.1, timber, '#4A3222'))
          frontDoorDone = true
        } else if ((r.zone === 'bed' || r.zone === 'living' || /kitchen/i.test(r.name)) && len >= 2.0) {
          const w = Math.min(len - 0.9, 2.2)
          decals.push(rect((len - w) / 2, w, 0.9, 2.1, glass, '#F7F5F0'))
        }
        return decals
      }
      // sides: [inner, end, outer, end] for our footprint order
      sides.forEach((pts, k) => {
        faces.push({
          pts,
          color,
          stroke: '#8E877A',
          strokeWidth: 0.35,
          decals: k === 2 ? decalsFor(pts) : undefined,
          stage: 'wall',
          storey: si,
        })
      })
      // wall top
      faces.push({
        pts: foot.map((p) => [p[0], p[1], z0 + WALL_H] as Vec3),
        color: hex(s.external ? '#CFC7B8' : '#DDD6C7'),
        stroke: '#8E877A',
        strokeWidth: 0.35,
        stage: 'wall',
        storey: si,
      })
    }

    // ——— pergola: posts + open slatted roof ———
    for (const r of outdoorRooms) {
      if (!/pergola|alfresco/i.test(r.name)) continue
      const [x0, y0] = T(r.x, r.y)
      const [x1, y1] = T(r.x + r.w, r.y + r.h)
      const posts: [number, number][] = [
        [x0 + 0.15, y0 + 0.15],
        [x1 - 0.15, y0 + 0.15],
        [x1 - 0.15, y1 - 0.15],
        [x0 + 0.15, y1 - 0.15],
      ]
      for (const [px, py] of posts) {
        const foot: [number, number][] = [
          [px - 0.07, py - 0.07],
          [px + 0.07, py - 0.07],
          [px + 0.07, py + 0.07],
          [px - 0.07, py + 0.07],
        ]
        for (const pts of quad(foot, z0, z0 + 2.45)) faces.push({ pts, color: hex('#6D6A63'), stage: 'wall', storey: si })
      }
      faces.push({
        pts: [
          [x0, y0, z0 + 2.5],
          [x1, y0, z0 + 2.5],
          [x1, y1, z0 + 2.5],
          [x0, y1, z0 + 2.5],
        ],
        color: hex('#FFFFFF'),
        opacity: 0.55,
        stroke: '#9A958A',
        strokeWidth: 0.6,
        stage: 'wall',
        storey: si,
      })
    }

    // ——— hip roof over the enclosed footprint, with eaves ———
    if (interior.length) {
      const minX = Math.min(...interior.map((r) => r.x)) - EXT_T - EAVE
      const maxX = Math.max(...interior.map((r) => r.x + r.w)) + EXT_T + EAVE
      const minY = Math.min(...interior.map((r) => r.y)) - EXT_T - EAVE
      const maxY = Math.max(...interior.map((r) => r.y + r.h)) + EXT_T + EAVE
      const rw = maxX - minX
      const rd = maxY - minY
      const short = Math.min(rw, rd)
      const rise = short * 0.5 * 0.42 // ≈ 22° pitch
      const zb = z0 + WALL_H + 0.05
      const zt = zb + rise
      const [ax, ay] = T(minX, minY)
      const [bx, by] = T(maxX, maxY)
      const A: Vec3 = [ax, ay, zb]
      const B: Vec3 = [bx, ay, zb]
      const C: Vec3 = [bx, by, zb]
      const Dp: Vec3 = [ax, by, zb]
      const stroke = '#2C3134'
      if (rw >= rd) {
        const half = short / 2
        const R1: Vec3 = [ax + half, (ay + by) / 2, zt]
        const R2: Vec3 = [bx - half, (ay + by) / 2, zt]
        faces.push({ pts: [A, B, R2, R1], color: roofColor, stroke, strokeWidth: 0.5, stage: 'roof', storey: si })
        faces.push({ pts: [C, Dp, R1, R2], color: roofColor, stroke, strokeWidth: 0.5, stage: 'roof', storey: si })
        faces.push({ pts: [B, C, R2], color: roofColor, stroke, strokeWidth: 0.5, stage: 'roof', storey: si })
        faces.push({ pts: [Dp, A, R1], color: roofColor, stroke, strokeWidth: 0.5, stage: 'roof', storey: si })
      } else {
        const half = short / 2
        const R1: Vec3 = [(ax + bx) / 2, ay + half, zt]
        const R2: Vec3 = [(ax + bx) / 2, by - half, zt]
        faces.push({ pts: [B, C, R2, R1], color: roofColor, stroke, strokeWidth: 0.5, stage: 'roof', storey: si })
        faces.push({ pts: [Dp, A, R1, R2], color: roofColor, stroke, strokeWidth: 0.5, stage: 'roof', storey: si })
        faces.push({ pts: [A, B, R1], color: roofColor, stroke, strokeWidth: 0.5, stage: 'roof', storey: si })
        faces.push({ pts: [C, Dp, R2], color: roofColor, stroke, strokeWidth: 0.5, stage: 'roof', storey: si })
      }
      // fascia band under the eaves
      const band: [number, number][] = [
        [ax, ay],
        [bx, ay],
        [bx, by],
        [ax, by],
      ]
      for (const pts of quad(band, zb - 0.22, zb)) faces.push({ pts, color: hex('#F2F0EB'), stroke: '#B9B3A6', strokeWidth: 0.3, stage: 'roof', storey: si })
    }
  })

  // ——— ground: lot plate + driveway from the garage to the street (max y) ———
  const gx = W / 2 + 2.2
  const gy = D / 2 + 2.6
  const ground: Face = {
    pts: [
      [-gx, -gy, 0],
      [gx, -gy, 0],
      [gx, gy, 0],
      [-gx, gy, 0],
    ],
    color: hex('#DCE3D3'),
    stroke: '#C5CBB9',
    strokeWidth: 0.6,
    stage: 'floor',
    storey: -1,
  }
  const garage = plan.storeys[0]?.rooms.find((r) => r.zone === 'garage')
  const driveway: Face | null = garage
    ? {
        pts: [
          [T(garage.x + 0.3, garage.y + garage.h)[0], T(garage.x, garage.y + garage.h)[1] + EXT_T, 0.01],
          [T(garage.x + garage.w - 0.3, garage.y + garage.h)[0], T(garage.x, garage.y + garage.h)[1] + EXT_T, 0.01],
          [T(garage.x + garage.w - 0.3, 0)[0], gy, 0.01],
          [T(garage.x + 0.3, 0)[0], gy, 0.01],
        ],
        color: hex('#D9D6CF'),
        stroke: '#C2BEB5',
        strokeWidth: 0.4,
        stage: 'floor',
        storey: -1,
      }
    : null

  const R = Math.sqrt(gx * gx + gy * gy)
  const zmax = plan.storeys.length * STOREY_H + 3
  return { faces, labels, ground, driveway, R, zmax }
}

/** Start the turntable on the front corner nearest the garage, so the driveway side reads first. */
function startAngle(plan: FpPlan): number {
  const g = plan.storeys[0]?.rooms.find((r) => r.zone === 'garage')
  if (!g) return 32
  return g.x + g.w / 2 < plan.width / 2 ? 328 : 32
}

function normal(pts: Vec3[]): Vec3 {
  // Newell's method
  let nx = 0
  let ny = 0
  let nz = 0
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]
    const b = pts[(i + 1) % pts.length]
    nx += (a[1] - b[1]) * (a[2] + b[2])
    ny += (a[2] - b[2]) * (a[0] + b[0])
    nz += (a[0] - b[0]) * (a[1] + b[1])
  }
  const l = Math.hypot(nx, ny, nz) || 1
  return [nx / l, ny / l, nz / l]
}

export default function Floorplan3D({
  plan,
  className = '',
  spin = true,
  height,
  defaultRoof = true,
}: {
  plan: FpPlan
  className?: string
  spin?: boolean
  height?: number
  defaultRoof?: boolean
}) {
  const reduce = useReducedMotion()
  const ref = useRef<SVGSVGElement>(null)
  const angle = useRef(startAngle(plan))
  const progress = useRef(0)
  const idleUntil = useRef(0)
  const drag = useRef<{ x: number; a: number; moved: boolean } | null>(null)
  const [, tick] = useState(0)
  const [seen, setSeen] = useState(false)
  const [roof, setRoof] = useState(defaultRoof)

  const scene = useMemo(() => buildScene(plan), [plan])
  const { R, zmax } = scene
  const vbX = -R * S
  const vbW = 2 * R * S
  const vbY = -R * S * E - zmax * S * ZS
  const vbH = 2 * R * S * E + zmax * S * ZS + 16

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
    const started = performance.now() - progress.current * 2200
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      let changed = false
      if (progress.current < 1) {
        progress.current = Math.min(1, (now - started) / 2200)
        changed = true
      }
      if (spin && !drag.current && now > idleUntil.current) {
        angle.current = (angle.current + dt * 7) % 360
        changed = true
      }
      if (changed) tick((t) => t + 1)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [seen, spin, reduce])

  function onDown(e: React.PointerEvent<SVGSVGElement>) {
    drag.current = { x: e.clientX, a: angle.current, moved: false }
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }
  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!drag.current) return
    drag.current.moved = true
    angle.current = (drag.current.a + (e.clientX - drag.current.x) * 0.6 + 360) % 360
    tick((t) => t + 1)
  }
  function onUp() {
    drag.current = null
    idleUntil.current = performance.now() + 4000
  }

  const th = (angle.current * Math.PI) / 180
  const cos = Math.cos(th)
  const sin = Math.sin(th)
  const p = (v: Vec3) => {
    const rx = v[0] * cos - v[1] * sin
    const ry = v[0] * sin + v[1] * cos
    return { sx: rx * S, sy: ry * S * E - v[2] * S * ZS, d: ry + v[2] * 0.001 }
  }
  const pts = (poly: Vec3[]) => poly.map((v) => { const q = p(v); return `${q.sx.toFixed(1)},${q.sy.toFixed(1)}` }).join(' ')

  // draw-in: floors → walls rise → roof settles
  const t = progress.current
  const wallT = Math.max(0, Math.min(1, (t - 0.15) / 0.5))
  const roofT = Math.max(0, Math.min(1, (t - 0.7) / 0.3))
  const ease = (x: number) => 1 - Math.pow(1 - x, 3)

  // camera-space light: from the upper-left-front
  const light: Vec3 = [-0.45, -0.5, 0.74]
  const shadeOf = (poly: Vec3[]) => {
    const n = normal(poly)
    // rotate the normal with the turntable
    const rn: Vec3 = [n[0] * cos - n[1] * sin, n[0] * sin + n[1] * cos, n[2]]
    const dot = rn[0] * light[0] + rn[1] * light[1] + rn[2] * light[2]
    return 0.62 + 0.42 * Math.max(0, dot)
  }

  const renderFace = (f: Face, key: string) => {
    let poly = f.pts
    if (f.stage === 'wall' && wallT < 1) {
      const z0 = Math.min(...poly.map((v) => v[2]))
      poly = poly.map((v) => [v[0], v[1], z0 + (v[2] - z0) * ease(wallT)] as Vec3)
    }
    if (f.stage === 'roof') {
      if (!roof && !(f.opacity != null)) return null // pergola roof (has opacity) stays when the house roof lifts
      if (roofT <= 0) return null
      const lift = (1 - ease(roofT)) * 1.6
      poly = poly.map((v) => [v[0], v[1], v[2] + lift] as Vec3)
    }
    const k = shadeOf(poly)
    return (
      <g key={key}>
        <polygon
          points={pts(poly)}
          fill={rgb(f.color, k)}
          fillOpacity={f.opacity != null ? f.opacity * (f.stage === 'roof' ? ease(roofT) : 1) : f.stage === 'roof' ? ease(roofT) : 1}
          stroke={f.stroke}
          strokeWidth={f.strokeWidth ?? 0}
          strokeLinejoin="round"
        />
        {f.decals?.map((d, i) => {
          let dp = d.pts
          if (wallT < 1) {
            const z0 = Math.min(...poly.map((v) => v[2]))
            dp = dp.map((v) => [v[0], v[1], z0 + (v[2] - z0) * ease(wallT)] as Vec3)
          }
          return <polygon key={i} points={pts(dp)} fill={rgb(d.color, k)} stroke={d.stroke} strokeWidth={d.strokeWidth ?? 0} />
        })}
      </g>
    )
  }

  // painter's order: lower storeys first; within a storey floors, then walls far → near, then the
  // roof (it sits above everything on its storey, so nothing there can occlude it from this camera)
  const STAGE_ORDER = { floor: 0, wall: 1, roof: 2 } as const
  const ordered = scene.faces
    .map((f, i) => {
      const c = f.pts.reduce((a, v) => [a[0] + v[0], a[1] + v[1], a[2] + v[2]] as Vec3, [0, 0, 0] as Vec3).map((v) => v / f.pts.length) as Vec3
      const d = c[0] * sin + c[1] * cos + c[2] * 0.35
      return { f, i, d }
    })
    .sort((a, b) => a.f.storey - b.f.storey || STAGE_ORDER[a.f.stage] - STAGE_ORDER[b.f.stage] || a.d - b.d)

  const showLabels = !roof || roofT <= 0

  return (
    <div className="relative">
      <svg
        ref={ref}
        viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
        className={`w-full touch-pan-y select-none ${drag.current ? 'cursor-grabbing' : 'cursor-grab'} ${className}`}
        style={height ? { height } : undefined}
        role="img"
        aria-label="3D model of the home built from its floor plan"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <defs>
          <radialGradient id="fp3d-shadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0f1512" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#0f1512" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx={0} cy={6} rx={R * S * 0.8} ry={R * S * E * 0.6} fill="url(#fp3d-shadow)" />
        {renderFace(scene.ground, 'ground')}
        {scene.driveway && renderFace(scene.driveway, 'drive')}
        {ordered.map(({ f, i }) => renderFace(f, String(i)))}
        {showLabels &&
          scene.labels.map((l, i) => {
            const q = p([l.x, l.y, l.z])
            const fs = Math.max(6, Math.min(8.5, Math.sqrt(l.area) * 1.5))
            return (
              <text
                key={i}
                x={q.sx}
                y={q.sy + fs * 0.35}
                textAnchor="middle"
                fontSize={fs}
                fontWeight={600}
                letterSpacing="0.06em"
                fill="#3D463F"
                opacity={ease(wallT)}
                style={{ textTransform: 'uppercase', pointerEvents: 'none' }}
              >
                {l.text}
              </text>
            )
          })}
      </svg>

      <div className="absolute right-2 top-2 flex rounded-lg border border-line bg-card/90 p-0.5 text-[11.5px] font-semibold shadow-sm backdrop-blur">
        <button
          onClick={() => setRoof(true)}
          aria-pressed={roof}
          className={`flex items-center gap-1 rounded-md px-2 py-1 transition-colors ${roof ? 'bg-pine text-paper' : 'text-muted hover:text-ink'}`}
        >
          <Home size={12} /> Roof
        </button>
        <button
          onClick={() => setRoof(false)}
          aria-pressed={!roof}
          className={`flex items-center gap-1 rounded-md px-2 py-1 transition-colors ${!roof ? 'bg-pine text-paper' : 'text-muted hover:text-ink'}`}
        >
          <Layers2 size={12} /> Rooms
        </button>
      </div>
    </div>
  )
}
