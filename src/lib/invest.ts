/**
 * Investor cash-flow model for a new-build house & land package (Australia, FY2026-27).
 * Everything here is an estimate from stated assumptions — the UI must say so — but the
 * mechanics are the ones a buyer's accountant would use: land-only duty on two-part
 * contracts, holding costs during construction, Div 43 + Div 40 depreciation on a new
 * build, VIC land tax on the site value, and the after-tax position at the buyer's rate.
 */
import type { Pkg } from './types'
import { dutiableValue, stampDuty, monthlyRepayment } from './calc'

export interface InvestInputs {
  depositPct: number
  ratePct: number
  interestOnly: boolean
  /** marginal income-tax rate incl. Medicare, e.g. 0.32 */
  marginal: number
  weeklyRent: number
  growthPct: number
  rentGrowthPct: number
  vacancyWeeks: number
  years: number
}

export const TAX_BANDS = [
  { label: 'Under $45k · 15% + Medicare', rate: 0.17 },
  { label: '$45k – $135k · 30% + Medicare', rate: 0.32 },
  { label: '$135k – $190k · 37% + Medicare', rate: 0.39 },
  { label: 'Over $190k · 45% + Medicare', rate: 0.47 },
] as const

/** Sensible starting assumptions for a package. */
export function defaultInputs(pkg: Pkg): InvestInputs {
  return {
    depositPct: 20,
    ratePct: 6.25,
    interestOnly: true,
    marginal: 0.39,
    weeklyRent: pkg.total_weekly_rent ?? estimateRent(pkg),
    growthPct: pkg.est_capital_growth ?? 5,
    rentGrowthPct: 3.5,
    vacancyWeeks: pkg.vacancy_rate ? Math.max(1, Math.round((pkg.vacancy_rate / 100) * 52)) : 2,
    years: 10,
  }
}

/** Fallback when no rental appraisal is recorded: a conservative ~4.4% gross yield. */
export function estimateRent(pkg: Pick<Pkg, 'price'>): number {
  return Math.round((pkg.price * 0.044) / 52 / 5) * 5
}

/** VIC general land tax (2024–2033 rates incl. the temporary surcharge) on a single site value. */
export function vicLandTax(siteValue: number): number {
  const v = siteValue
  if (v < 50_000) return 0
  if (v < 100_000) return 500
  if (v < 300_000) return 975
  if (v < 600_000) return 1_350 + (v - 300_000) * 0.003
  if (v < 1_000_000) return 2_250 + (v - 600_000) * 0.006
  if (v < 1_800_000) return 4_650 + (v - 1_000_000) * 0.009
  return 11_850 + (v - 1_800_000) * 0.0165
}

/** SA land tax: a single greenfield lot sits well under the 2026-27 threshold. */
export function saLandTax(siteValue: number): number {
  return siteValue > 732_000 ? (siteValue - 732_000) * 0.005 : 0
}

export function landTax(state: string, siteValue: number): number {
  if (state === 'VIC') return vicLandTax(siteValue)
  if (state === 'SA') return saLandTax(siteValue)
  return 0
}

/**
 * Depreciation on a brand-new build. Capital works (Div 43) at 2.5% of the structure; plant &
 * equipment (Div 40) on the diminishing-value method. Splits are typical quantity-surveyor
 * proportions — a real schedule replaces these numbers.
 */
export function depreciation(buildCost: number, year: number): { div43: number; div40: number } {
  const structure = buildCost * 0.88
  const plant = buildCost * 0.12
  const div43 = structure * 0.025
  // ~7.5-year average effective life → 26.7% diminishing value
  const div40 = plant * 0.267 * Math.pow(1 - 0.267, year - 1)
  return { div43, div40 }
}

export interface YearRow {
  year: number
  value: number
  loan: number
  equity: number
  rent: number
  expenses: number
  interest: number
  depreciation: number
  taxEffect: number
  /** after-tax cash position for the year (negative = out of pocket) */
  netCash: number
  cumulativeCash: number
}

export interface InvestResult {
  deposit: number
  loan: number
  lmi: number
  duty: number
  dutiable: number
  legals: number
  upfront: number
  holdingDuringBuild: number
  grossYield: number
  netYield: number
  year1: YearRow
  weeklyOutOfPocket: number
  weeklyPreTax: number
  rows: YearRow[]
  breakEvenYear: number | null
  expenseBreakdown: { label: string; amount: number }[]
  landTax: number
}

export function runModel(pkg: Pkg, inp: InvestInputs): InvestResult {
  const price = pkg.price
  const build = pkg.build_price ?? Math.round(price * 0.52)
  const land = pkg.land_price ?? price - build
  const deposit = price * (inp.depositPct / 100)
  const baseLoan = price - deposit
  const lvr = baseLoan / price
  // rough LMI curve for investors above 80% LVR
  const lmi = lvr > 0.8 ? baseLoan * (lvr > 0.9 ? 0.034 : lvr > 0.85 ? 0.021 : 0.011) : 0
  const loan = baseLoan + lmi
  const dutiable = dutiableValue(pkg)
  const duty = stampDuty(pkg.state, dutiable)
  const legals = 3_000
  const upfront = deposit + duty + legals

  // construction phase: interest on the land loan plus progressive build draws, no rent yet
  const buildWeeks = pkg.build_time_weeks ?? 28
  const landLoan = Math.min(loan, land * (1 - inp.depositPct / 100))
  const buildLoan = loan - landLoan
  const holdingDuringBuild = ((landLoan + buildLoan * 0.5) * (inp.ratePct / 100) * buildWeeks) / 52

  const ltax = landTax(pkg.state, land)
  const rates = pkg.state === 'SA' ? 2_000 : 2_300
  const water = 950
  const insurance = 1_650
  const maintenance = 900
  const rows: YearRow[] = []
  let cumulative = -holdingDuringBuild
  let balance = loan
  let breakEvenYear: number | null = null
  const monthlyPI = monthlyRepayment(loan, inp.ratePct, 30, false)

  for (let y = 1; y <= inp.years; y++) {
    const rentWk = inp.weeklyRent * Math.pow(1 + inp.rentGrowthPct / 100, y - 1)
    const rent = rentWk * (52 - inp.vacancyWeeks)
    const pm = rent * 0.07 + rentWk // 7% management + one week letting fee
    const expenses = pm + rates + water + insurance + maintenance + ltax
    const interest = balance * (inp.ratePct / 100)
    const dep = depreciation(build, y)
    const depTotal = dep.div43 + dep.div40
    const taxable = rent - expenses - interest - depTotal
    const taxEffect = -taxable * inp.marginal // positive = refund
    const principal = inp.interestOnly ? 0 : Math.max(0, monthlyPI * 12 - interest)
    const netCash = rent - expenses - interest - principal + taxEffect
    cumulative += netCash
    balance = Math.max(0, balance - principal)
    const value = price * Math.pow(1 + inp.growthPct / 100, y)
    rows.push({
      year: y,
      value,
      loan: balance,
      equity: value - balance,
      rent,
      expenses,
      interest,
      depreciation: depTotal,
      taxEffect,
      netCash,
      cumulativeCash: cumulative,
    })
    if (breakEvenYear === null && netCash >= 0) breakEvenYear = y
  }

  const y1 = rows[0]
  const grossYield = (inp.weeklyRent * 52) / price
  const netYield = (y1.rent - y1.expenses) / price
  return {
    deposit,
    loan,
    lmi,
    duty,
    dutiable,
    legals,
    upfront,
    holdingDuringBuild,
    grossYield,
    netYield,
    year1: y1,
    weeklyOutOfPocket: y1.netCash / 52,
    weeklyPreTax: (y1.netCash - y1.taxEffect) / 52,
    rows,
    breakEvenYear,
    landTax: ltax,
    expenseBreakdown: [
      { label: 'Property management (7% + letting)', amount: y1.rent * 0.07 + inp.weeklyRent },
      { label: 'Council rates', amount: rates },
      { label: 'Water', amount: water },
      { label: 'Landlord insurance', amount: insurance },
      { label: 'Maintenance (new build)', amount: maintenance },
      { label: `${pkg.state} land tax on site value`, amount: ltax },
    ],
  }
}
