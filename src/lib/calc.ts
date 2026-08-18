import type { Pkg } from './types'

/** Gross yield % from weekly rent and price. */
export function grossYield(price: number, weeklyRent: number | null | undefined): number | null {
  if (!price || !weeklyRent) return null
  return ((weeklyRent * 52) / price) * 100
}

export function pkgYield(pkg: Pkg): number | null {
  return grossYield(pkg.price, pkg.total_weekly_rent)
}

/**
 * Transfer (stamp) duty on investment property, general rates.
 * VIC: two-part H&L contracts are typically assessed on the LAND component only —
 * a material saving surfaced by `dutiableValue`.
 */
export function stampDuty(state: string, v: number): number {
  if (v <= 0) return 0
  if (state === 'VIC') {
    if (v <= 25_000) return v * 0.014
    if (v <= 130_000) return 350 + (v - 25_000) * 0.024
    if (v <= 960_000) return 2_870 + (v - 130_000) * 0.06
    if (v <= 2_000_000) return v * 0.055
    return 110_000 + (v - 2_000_000) * 0.065
  }
  if (state === 'SA') {
    if (v <= 12_000) return v * 0.01
    if (v <= 30_000) return 120 + (v - 12_000) * 0.02
    if (v <= 50_000) return 480 + (v - 30_000) * 0.03
    if (v <= 100_000) return 1_080 + (v - 50_000) * 0.035
    if (v <= 200_000) return 2_830 + (v - 100_000) * 0.04
    if (v <= 250_000) return 6_830 + (v - 200_000) * 0.0425
    if (v <= 300_000) return 8_955 + (v - 250_000) * 0.0475
    if (v <= 500_000) return 11_330 + (v - 300_000) * 0.05
    return 21_330 + (v - 500_000) * 0.055
  }
  // conservative generic estimate for other states
  return v * 0.05
}

/** The amount duty is charged on: land-only for two-part H&L contracts. */
export function dutiableValue(pkg: Pick<Pkg, 'price' | 'land_price' | 'contract_type'>): number {
  if (pkg.contract_type === 'two_part' && pkg.land_price) return pkg.land_price
  return pkg.price
}

export interface DutyResult {
  duty: number
  baseDuty: number
  saving: number
  note: string
}

/**
 * Transfer duty with first-home-buyer treatment for NEW builds (as at 2026):
 * VIC — full exemption when dutiable value ≤ $600k, sliding concession to $750k.
 * SA — FHB duty abolished for eligible buyers of new homes / vacant land to build (no cap).
 */
export function dutyWithConcession(state: string, dutiable: number, firstHomeBuyer: boolean): DutyResult {
  const base = stampDuty(state, dutiable)
  if (!firstHomeBuyer) {
    return { duty: base, baseDuty: base, saving: 0, note: 'Investor / non-FHB rates' }
  }
  if (state === 'VIC') {
    if (dutiable <= 600_000) return { duty: 0, baseDuty: base, saving: base, note: 'VIC FHB exemption (≤ $600k dutiable value)' }
    if (dutiable <= 750_000) {
      const duty = base * ((dutiable - 600_000) / 150_000)
      return { duty, baseDuty: base, saving: base - duty, note: 'VIC FHB sliding concession ($600k–$750k)' }
    }
    return { duty: base, baseDuty: base, saving: 0, note: 'Above the VIC FHB concession threshold' }
  }
  if (state === 'SA') {
    return { duty: 0, baseDuty: base, saving: base, note: 'SA: no stamp duty for FHBs building or buying a new home' }
  }
  return { duty: base, baseDuty: base, saving: 0, note: 'Check your state FHB concessions' }
}

/** First Home Owner Grant for NEW homes (2026). */
export function fhog(state: string, price: number): number {
  if (state === 'VIC') return price <= 750_000 ? 10_000 : 0
  if (state === 'SA') return 15_000
  return 0
}

/** Headline weekly repayment for cards: 10% deposit, 5.90% p.a. (avg variable, mid-2026), 30-year P&I. */
export function estWeeklyRepayment(price: number, depositPct = 10, ratePct = 5.9): number {
  const loan = price * (1 - depositPct / 100)
  return (monthlyRepayment(loan, ratePct, 30, false) * 12) / 52
}

/** Home Guarantee Scheme price caps (from 1 Oct 2025: no income caps, no place limits). */
export function hgsEligible(state: string, price: number, metro = true): boolean {
  if (state === 'VIC') return price <= (metro ? 950_000 : 650_000)
  if (state === 'SA') return price <= (metro ? 900_000 : 500_000)
  return false
}

/** Average variable owner-occupier rate used for headline "From $X/wk" figures (mid-2026). */
export const HEADLINE_RATE = 5.9

/** Monthly loan repayment (principal & interest, or interest-only). */
export function monthlyRepayment(
  principal: number,
  annualRatePct: number,
  years: number,
  interestOnly: boolean,
): number {
  const r = annualRatePct / 100 / 12
  if (principal <= 0) return 0
  if (interestOnly) return principal * r
  if (r === 0) return principal / (years * 12)
  const n = years * 12
  return (principal * r) / (1 - Math.pow(1 + r, -n))
}
