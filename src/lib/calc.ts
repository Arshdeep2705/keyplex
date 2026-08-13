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

/** Monthly loan repayment (principal & interest, or interest-only). */
export function monthlyRepayment(
  principal: number,
  annualRatePct: number,
  years: number,
  interestOnly: boolean,
): number {
  const r = annualRatePct / 100 / 12
  if (principal <= 0) return 0
  if (interestOnly || r === 0) return principal * r
  const n = years * 12
  return (principal * r) / (1 - Math.pow(1 + r, -n))
}

export interface CashflowInputs {
  price: number
  weeklyRent: number
  depositPct: number
  ratePct: number
  loanYears: number
  interestOnly: boolean
  vacancyPct: number
  mgmtPct: number
  insurancePerYear: number
  ratesPerYear: number
  maintenancePerYear: number
  utilitiesPerYear: number
}

export interface CashflowResult {
  loanAmount: number
  deposit: number
  grossAnnualRent: number
  collectedRent: number
  mgmtFee: number
  totalExpenses: number
  annualLoanCost: number
  netAnnualCashflow: number
  weeklyCashflow: number
  grossYieldPct: number
  netYieldPct: number
}

export function cashflow(i: CashflowInputs): CashflowResult {
  const deposit = i.price * (i.depositPct / 100)
  const loanAmount = i.price - deposit
  const grossAnnualRent = i.weeklyRent * 52
  const collectedRent = grossAnnualRent * (1 - i.vacancyPct / 100)
  const mgmtFee = collectedRent * (i.mgmtPct / 100)
  const opex = mgmtFee + i.insurancePerYear + i.ratesPerYear + i.maintenancePerYear + i.utilitiesPerYear
  const annualLoanCost = monthlyRepayment(loanAmount, i.ratePct, i.loanYears, i.interestOnly) * 12
  const netAnnualCashflow = collectedRent - opex - annualLoanCost
  const netYield = ((collectedRent - opex) / i.price) * 100
  return {
    loanAmount,
    deposit,
    grossAnnualRent,
    collectedRent,
    mgmtFee,
    totalExpenses: opex,
    annualLoanCost,
    netAnnualCashflow,
    weeklyCashflow: netAnnualCashflow / 52,
    grossYieldPct: (grossAnnualRent / i.price) * 100,
    netYieldPct: netYield,
  }
}

export interface ProjectionPoint {
  year: number
  propertyValue: number
  loanBalance: number
  equity: number
  annualCashflow: number
  cumulativeCashflow: number
}

/** 10-year projection: value grows, rent grows, loan amortises (if P&I). */
export function project(
  i: CashflowInputs,
  capitalGrowthPct: number,
  rentGrowthPct = 3,
  years = 10,
): ProjectionPoint[] {
  const deposit = i.price * (i.depositPct / 100)
  let loanBalance = i.price - deposit
  const monthlyRate = i.ratePct / 100 / 12
  const repayment = monthlyRepayment(loanBalance, i.ratePct, i.loanYears, i.interestOnly)
  let value = i.price
  let weeklyRent = i.weeklyRent
  let cumulative = 0
  const points: ProjectionPoint[] = []

  for (let y = 1; y <= years; y++) {
    value *= 1 + capitalGrowthPct / 100
    if (y > 1) weeklyRent *= 1 + rentGrowthPct / 100
    if (!i.interestOnly) {
      for (let m = 0; m < 12; m++) {
        const interest = loanBalance * monthlyRate
        loanBalance = Math.max(0, loanBalance - (repayment - interest))
      }
    }
    const cf = cashflow({ ...i, weeklyRent })
    cumulative += cf.netAnnualCashflow
    points.push({
      year: y,
      propertyValue: value,
      loanBalance,
      equity: value - loanBalance,
      annualCashflow: cf.netAnnualCashflow,
      cumulativeCashflow: cumulative,
    })
  }
  return points
}

/** Sensible expense defaults per package type (owner-paid utilities for co-living). */
export function defaultCashflowInputs(pkg: Pkg): CashflowInputs {
  const isMultiTenancy = pkg.package_type === 'coliving' || pkg.package_type === 'rooming_house'
  return {
    price: pkg.price,
    weeklyRent: pkg.total_weekly_rent ?? 0,
    depositPct: isMultiTenancy && pkg.package_type === 'rooming_house' ? 35 : 20,
    ratePct: 6.4,
    loanYears: 30,
    interestOnly: true,
    vacancyPct: pkg.vacancy_rate != null ? Math.max(pkg.vacancy_rate, 2) : isMultiTenancy ? 5 : 2,
    mgmtPct: isMultiTenancy ? 15 : 8,
    insurancePerYear: isMultiTenancy ? 3_500 : 1_800,
    ratesPerYear: 3_200,
    maintenancePerYear: isMultiTenancy ? 3_000 : 1_500,
    utilitiesPerYear: isMultiTenancy ? 4_200 : 0,
  }
}
