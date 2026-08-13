/**
 * Parametric concept floorplan generator.
 * Deterministic: same inputs + variant → same plan. All units in metres, y=0 at the front (street).
 * Produces schematic "concept plans — indicative only", not construction drawings.
 */

export type FpZone = 'living' | 'bed' | 'wet' | 'garage' | 'outdoor' | 'circulation' | 'store'

export interface FpRoom {
  name: string
  x: number
  y: number
  w: number
  h: number
  zone: FpZone
  /** drawn with dashed boundary + lighter label (alfresco, porch) */
  outdoor?: boolean
  /** part of the open-plan zone: internal boundaries drawn dashed */
  open?: boolean
}

export interface FpStorey {
  label: string
  rooms: FpRoom[]
  width: number
  depth: number
}

export interface FpPlan {
  storeys: FpStorey[]
  width: number
  depth: number
  areaM2: number
}

export interface FpInput {
  beds: number
  baths: number
  cars: number
  living: number
  study: boolean
  alfresco: boolean
  storeys: number
  houseArea: number
  lotWidth?: number | null
  variant?: number
}

const HALL_W = 1.4
const GARAGE_D = 6.0

function mirrorX(rooms: FpRoom[], width: number): FpRoom[] {
  return rooms.map((r) => ({ ...r, x: +(width - r.x - r.w).toFixed(2) }))
}

function r2(n: number) {
  return Math.round(n * 100) / 100
}

interface ColumnItem {
  name: string
  depth: number
  zone: FpZone
}

/** Greedy fill of two side columns, returns rooms + the max depth reached. */
function fillColumns(
  items: ColumnItem[],
  leftX: number,
  leftW: number,
  leftStartY: number,
  rightX: number,
  rightW: number,
  rightStartY: number,
): { rooms: FpRoom[]; maxY: number } {
  const rooms: FpRoom[] = []
  let ly = leftStartY
  let ry = rightStartY
  for (const item of items) {
    if (ly <= ry) {
      rooms.push({ name: item.name, x: leftX, y: r2(ly), w: leftW, h: item.depth, zone: item.zone })
      ly += item.depth
    } else {
      rooms.push({ name: item.name, x: rightX, y: r2(ry), w: rightW, h: item.depth, zone: item.zone })
      ry += item.depth
    }
  }
  // level the columns with a linen/store filler if the gap is meaningful
  const maxY = Math.max(ly, ry)
  const gapLeft = maxY - ly
  const gapRight = maxY - ry
  if (gapLeft > 0.8) rooms.push({ name: 'Linen', x: leftX, y: r2(ly), w: leftW, h: r2(gapLeft), zone: 'store' })
  else if (gapLeft > 0) {
    const last = rooms.filter((r) => r.x === leftX).pop()
    if (last) last.h = r2(last.h + gapLeft)
  }
  if (gapRight > 0.8) rooms.push({ name: 'Store', x: rightX, y: r2(ry), w: rightW, h: r2(gapRight), zone: 'store' })
  else if (gapRight > 0) {
    const last = rooms.filter((r) => r.x === rightX).pop()
    if (last) last.h = r2(last.h + gapRight)
  }
  return { rooms, maxY: r2(maxY) }
}

/** Open-plan rear zone: kitchen strip + meals + family, full width. */
function rearLivingZone(width: number, y: number, depth: number, kitchenLeft: boolean): FpRoom[] {
  const kitchenW = Math.min(3.4, width * 0.32)
  const restW = width - kitchenW
  const kx = kitchenLeft ? 0 : width - kitchenW
  const rx = kitchenLeft ? kitchenW : 0
  const pantryD = Math.min(1.6, depth * 0.28)
  return [
    { name: 'Pantry', x: kx, y, w: kitchenW, h: pantryD, zone: 'wet' },
    { name: 'Kitchen', x: kx, y: r2(y + pantryD), w: kitchenW, h: r2(depth - pantryD), zone: 'wet', open: true },
    { name: 'Meals', x: rx, y, w: restW / 2, h: depth, zone: 'living', open: true },
    { name: 'Family', x: r2(rx + restW / 2), y, w: restW / 2, h: depth, zone: 'living', open: true },
  ]
}

function singleStorey(input: FpInput, W: number): FpStorey {
  const variant = input.variant ?? 0
  const garageW = input.cars >= 2 ? 5.7 : input.cars === 1 ? 3.4 : 0
  const rightX = garageW + HALL_W
  const rightW = W - rightX

  const rooms: FpRoom[] = []

  // ——— front block ———
  if (garageW > 0) {
    rooms.push({ name: input.cars >= 2 ? 'Double Garage' : 'Garage', x: 0, y: 0, w: garageW, h: GARAGE_D, zone: 'garage' })
  }
  // porch + entry sit on the hall axis
  rooms.push({ name: 'Porch', x: garageW, y: -1.6, w: HALL_W + 1.2, h: 1.6, zone: 'outdoor', outdoor: true })

  // master suite at front-right
  const masterD = 3.8
  const suiteD = 2.5
  rooms.push({ name: 'Master Suite', x: rightX, y: 0, w: rightW, h: masterD, zone: 'bed' })
  rooms.push({ name: 'WIR', x: rightX, y: masterD, w: rightW * 0.45, h: suiteD, zone: 'store' })
  rooms.push({ name: 'Ensuite', x: r2(rightX + rightW * 0.45), y: masterD, w: r2(rightW * 0.55), h: suiteD, zone: 'wet' })

  const leftStartY = garageW > 0 ? GARAGE_D : 0
  const rightStartY = masterD + suiteD

  // ——— middle items ———
  const items: ColumnItem[] = []
  const minorBeds = Math.max(input.beds - 1, 0)
  for (let i = 0; i < minorBeds; i++) items.push({ name: `Bed ${i + 2}`, depth: 3.2, zone: 'bed' })
  if (input.study) items.push({ name: 'Study', depth: 3.0, zone: 'living' })
  if (input.living >= 2) items.push({ name: 'Lounge', depth: 4.0, zone: 'living' })
  // main bath after the first minor bed for realism
  const bathItems: ColumnItem[] = [{ name: 'Bathroom', depth: 2.7, zone: 'wet' }]
  if (input.baths >= 3) bathItems.push({ name: 'Bath 3', depth: 2.5, zone: 'wet' })
  items.splice(Math.min(1, items.length), 0, ...bathItems)
  items.push({ name: 'Laundry', depth: 1.9, zone: 'wet' })
  if (input.baths >= 2) items.push({ name: 'WC', depth: 1.3, zone: 'wet' })

  const filled = fillColumns(items, 0, garageW || rightW, leftStartY, rightX, rightW, rightStartY)
  rooms.push(...filled.rooms)

  // hall from entry to the living zone
  rooms.push({ name: '', x: garageW, y: 0, w: HALL_W, h: filled.maxY, zone: 'circulation' })

  // ——— rear open-plan zone ———
  const targetD = input.houseArea / W
  const livingD = Math.max(4.8, r2(targetD - filled.maxY))
  const D = r2(filled.maxY + livingD)
  rooms.push(...rearLivingZone(W, filled.maxY, livingD, variant % 4 >= 2))

  if (input.alfresco) {
    rooms.push({ name: 'Alfresco', x: W - Math.min(4.6, W * 0.42), y: D, w: Math.min(4.6, W * 0.42), h: 3.4, zone: 'outdoor', outdoor: true })
  }

  const final = variant % 2 === 1 ? mirrorX(rooms, W) : rooms
  return { label: input.storeys > 1 ? 'Ground Floor' : 'Floor Plan', rooms: final, width: W, depth: D }
}

function doubleStorey(input: FpInput, W: number): FpStorey[] {
  const variant = input.variant ?? 0
  const groundArea = input.houseArea * 0.55
  const upperArea = input.houseArea * 0.45

  // ——— ground: garage, entry, study/guest, laundry, powder, open plan ———
  const garageW = input.cars >= 2 ? 5.7 : 3.4
  const rightX = garageW + HALL_W
  const rightW = W - rightX
  const rooms: FpRoom[] = [
    { name: input.cars >= 2 ? 'Double Garage' : 'Garage', x: 0, y: 0, w: garageW, h: GARAGE_D, zone: 'garage' },
    { name: 'Porch', x: garageW, y: -1.6, w: HALL_W + 1.2, h: 1.6, zone: 'outdoor', outdoor: true },
  ]
  let rightY = 0
  if (input.study) {
    rooms.push({ name: 'Study', x: rightX, y: 0, w: rightW, h: 3.0, zone: 'living' })
    rightY = 3.0
  }
  rooms.push({ name: 'Powder', x: rightX, y: rightY, w: rightW * 0.5, h: 1.6, zone: 'wet' })
  rooms.push({ name: 'Stairs', x: r2(rightX + rightW * 0.5), y: rightY, w: r2(rightW * 0.5), h: 2.9, zone: 'circulation' })
  rooms.push({ name: 'Laundry', x: rightX, y: r2(rightY + 1.6), w: rightW * 0.5, h: 2.0, zone: 'wet' })
  const groundUsedY = Math.max(GARAGE_D, rightY + 3.6)
  const targetGroundD = groundArea / W
  const livingD = Math.max(5.2, r2(targetGroundD - groundUsedY))
  const groundD = r2(groundUsedY + livingD)
  rooms.push({ name: '', x: garageW, y: 0, w: HALL_W, h: groundUsedY, zone: 'circulation' })
  rooms.push(...rearLivingZone(W, groundUsedY, livingD, variant % 4 >= 2))
  if (input.alfresco) {
    rooms.push({ name: 'Alfresco', x: W - Math.min(4.6, W * 0.42), y: groundD, w: Math.min(4.6, W * 0.42), h: 3.4, zone: 'outdoor', outdoor: true })
  }

  // ——— upper: master suite + minor beds + bath + retreat ———
  const upperW = r2(W * 0.86)
  const upRightX = HALL_W + 0.6
  const upRooms: FpRoom[] = []
  const masterD = 3.8
  upRooms.push({ name: 'Master Suite', x: upRightX, y: 0, w: upperW - upRightX, h: masterD, zone: 'bed' })
  upRooms.push({ name: 'WIR', x: upRightX, y: masterD, w: (upperW - upRightX) * 0.45, h: 2.4, zone: 'store' })
  upRooms.push({ name: 'Ensuite', x: r2(upRightX + (upperW - upRightX) * 0.45), y: masterD, w: r2((upperW - upRightX) * 0.55), h: 2.4, zone: 'wet' })
  const items: ColumnItem[] = []
  for (let i = 0; i < Math.max(input.beds - 1, 0); i++) items.push({ name: `Bed ${i + 2}`, depth: 3.2, zone: 'bed' })
  items.splice(1, 0, { name: 'Bathroom', depth: 2.7, zone: 'wet' })
  if (input.living >= 2) items.push({ name: 'Retreat', depth: 3.6, zone: 'living' })
  const filled = fillColumns(items, 0, 3.4, 0, upRightX, upperW - upRightX, masterD + 2.4)
  upRooms.push(...filled.rooms)
  upRooms.push({ name: '', x: 3.4, y: 0, w: HALL_W, h: filled.maxY, zone: 'circulation' })
  const upperD = Math.max(filled.maxY, upperArea / upperW)

  const g = variant % 2 === 1 ? mirrorX(rooms, W) : rooms
  const u = variant % 2 === 1 ? mirrorX(upRooms, upperW) : upRooms
  return [
    { label: 'Ground Floor', rooms: g, width: W, depth: groundD },
    { label: 'First Floor', rooms: u, width: upperW, depth: r2(upperD) },
  ]
}

export function generateFloorplan(input: FpInput): FpPlan {
  const area = Math.max(input.houseArea || 180, 80)
  // envelope width from the lot, allowing 2.5m combined side setbacks —
  // but never narrower than garage + hall + a livable master suite column
  const garageW = input.cars >= 2 ? 5.7 : input.cars === 1 ? 3.4 : 0
  let W = input.lotWidth ? input.lotWidth - 2.5 : 12
  W = Math.min(Math.max(W, 8.6, garageW + HALL_W + 3.6), 15.5)
  W = r2(W)

  const storeys =
    input.storeys > 1 ? doubleStorey({ ...input, houseArea: area }, W) : [singleStorey({ ...input, houseArea: area }, W)]

  const width = Math.max(...storeys.map((s) => s.width))
  const depth = Math.max(...storeys.map((s) => s.depth))
  const areaM2 = storeys.reduce((sum, s) => sum + s.width * s.depth, 0)
  return { storeys, width, depth, areaM2: Math.round(areaM2) }
}

/** Mirror a storey left-to-right (the industry-standard "flip plan" option). */
export function flipStorey(storey: FpStorey): FpStorey {
  return { ...storey, rooms: mirrorX(storey.rooms, storey.width) }
}

/** Rooms worth listing in a schedule (skips halls, stores, outdoor). */
export function roomSchedule(plan: FpPlan): { storey: string; name: string; dims: string; area: string }[] {
  const out: { storey: string; name: string; dims: string; area: string }[] = []
  for (const s of plan.storeys) {
    for (const r of s.rooms) {
      if (!r.name || r.outdoor || r.zone === 'circulation' || r.zone === 'store') continue
      out.push({
        storey: s.label,
        name: r.name,
        dims: `${r.w.toFixed(1)} × ${r.h.toFixed(1)} m`,
        area: `${(r.w * r.h).toFixed(1)} m²`,
      })
    }
  }
  return out
}
