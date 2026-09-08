import type { Pkg } from './types'

/** Last month index (0-based) of each calendar quarter. */
const Q_END: Record<string, number> = { '1': 2, '2': 5, '3': 8, '4': 11 }

function addWeeks(d: Date, w: number) {
  return new Date(d.getTime() + w * 7 * 86_400_000)
}

function monthYear(d: Date) {
  return d.toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })
}

export interface MoveIn {
  /** e.g. "Aug 2027" */
  moveIn: string
  /** e.g. "Site start ≈ Nov 2026" or "Construction underway" */
  startLabel: string
  /** weeks from today until the estimated move-in */
  weeksAway: number
  titled: boolean
}

/**
 * Rough move-in window from the land status + build time. Assumptions, stated on the UI:
 * titled land starts ~8 weeks after contract; forecast titles register at quarter end then
 * settle and start ~6 weeks later; handover adds ~3 weeks after practical completion.
 */
export function moveInEstimate(
  pkg: Pick<Pkg, 'title_status' | 'build_time_weeks'>,
  now = new Date(),
): MoveIn {
  const status = (pkg.title_status ?? '').toLowerCase()
  const build = pkg.build_time_weeks ?? 28
  const q = status.match(/q([1-4])\s*(20\d\d)/)

  if (/under construction|completion/.test(status)) {
    const done = q ? new Date(Number(q[2]), Q_END[q[1]], 28) : addWeeks(now, build)
    const moveIn = addWeeks(done, 2)
    return {
      moveIn: monthYear(moveIn),
      startLabel: 'Construction underway',
      weeksAway: Math.max(0, Math.round((moveIn.getTime() - now.getTime()) / (7 * 86_400_000))),
      titled: true,
    }
  }

  let start: Date
  let titled = false
  if (q) {
    start = addWeeks(new Date(Number(q[2]), Q_END[q[1]], 28), 6)
    if (start < addWeeks(now, 8)) start = addWeeks(now, 8)
  } else if (/titled/.test(status)) {
    titled = true
    start = addWeeks(now, 8)
  } else {
    start = addWeeks(now, 16)
  }
  const moveIn = addWeeks(start, build + 3)
  return {
    moveIn: monthYear(moveIn),
    startLabel: `Site start ≈ ${monthYear(start)}`,
    weeksAway: Math.round((moveIn.getTime() - now.getTime()) / (7 * 86_400_000)),
    titled,
  }
}
