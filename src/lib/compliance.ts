import type { Pkg } from './types'

export interface ComplianceCheck {
  label: string
  value: string
  pass: boolean | null // null = informational
}

export interface ComplianceLayer {
  title: string
  body: string
  link?: string
  linkLabel?: string
}

export interface ComplianceInfo {
  classification: string
  summary: string
  checks: ComplianceCheck[]
  layers: ComplianceLayer[]
  financeNote: string | null
  lastVerified: string
}

const LAST_VERIFIED = 'August 2026'

const VIC_FINANCE_NOTE =
  'Rooming-house-configured properties are treated as "specialised use" by major lenders: LVRs are typically capped at 60–70% (vs 80–90% standard), per-room income may be discounted for serviceability, and specialist landlord insurance is required. Our broker panel arranges co-living-friendly lenders — raise it early, not at approval time.'

export function getCompliance(pkg: Pkg): ComplianceInfo {
  const rooms = pkg.rooms_rentable ?? 0
  const isMulti = pkg.package_type === 'coliving' || pkg.package_type === 'rooming_house'

  // ——— VIC ———
  if (pkg.state === 'VIC') {
    if (isMulti && rooms >= 4) {
      const floorOk = pkg.house_area != null && pkg.house_area <= 300
      const bedsOk = pkg.beds <= 9
      const residentsOk = rooms <= 12
      const exempt = floorOk && bedsOk && residentsOk
      return {
        classification: 'Rooming house — NCC Class 1b build',
        summary:
          'Renting rooms to 4+ unrelated occupants in Victoria makes this a rooming house under the Residential Tenancies Act 1997. This design is built Class 1b-compliant from day one — no retrofit.',
        checks: [
          {
            label: 'Clause 52.23 floor area (max 300 m²)',
            value: pkg.house_area ? `${pkg.house_area} m²` : 'TBC',
            pass: floorOk,
          },
          { label: 'Clause 52.23 bedrooms (max 9)', value: `${pkg.beds} bedrooms`, pass: bedsOk },
          { label: 'Clause 52.23 residents (max 12)', value: `${rooms} residents (1/room)`, pass: residentsOk },
          {
            label: 'Planning permit requirement',
            value: exempt ? 'Exempt — no permit required' : 'Permit required',
            pass: exempt,
          },
        ],
        layers: [
          {
            title: '1 · Council registration',
            body: 'Registration as prescribed accommodation with the local council under the Public Health and Wellbeing Act 2008 before operation.',
          },
          {
            title: '2 · Operator licence',
            body: 'A rooming house operator licence from the Business Licensing Authority (Rooming House Operators Act 2016) — fit-and-proper-person test applies. Operating unlicensed carries penalties up to 2 years jail or fines exceeding $36,000 (individuals) / ~$182,000 (corporations).',
            link: 'https://www.consumer.vic.gov.au/licensing-and-registration/rooming-house-operators/public-register',
            linkLabel: 'Verify operators on the CAV public register',
          },
          {
            title: '3 · Minimum standards',
            body: 'Ongoing compliance with the Rooming House Standards Regulations 2023: lockable doors, 2 power outlets + fixed heating per room (mandatory from Dec 2025), privacy coverings, and 2-yearly gas & electrical safety checks lodged via myCAV. These standards are baked into the build specification.',
          },
          {
            title: 'Land tax note',
            body: 'Registered Victorian rooming houses charging below prescribed rents may qualify for a land tax exemption — both conditions must be met. Verify eligibility with your tax adviser.',
          },
        ],
        financeNote: VIC_FINANCE_NOTE,
        lastVerified: LAST_VERIFIED,
      }
    }
    if (pkg.package_type === 'ndis') {
      return {
        classification: 'SDA-capable dwelling — specialist vertical',
        summary:
          'SDA funding attaches to the participant, not the property, and the NDIA does not guarantee returns. Only ~6% of NDIS participants are SDA-eligible and sector vacancy ran 25–42% in 2024 (NDIA price-review vacancy assumption: 7.75–13%). We provide a location demand assessment before you commit.',
        checks: [
          { label: 'Design standard', value: 'SDA Design Standard v1.1', pass: null },
          { label: 'Category', value: 'Improved Liveability (Robust upgrade path)', pass: null },
          { label: 'Dwelling enrolment', value: 'Post-completion, subject to certification', pass: null },
        ],
        layers: [
          {
            title: 'NDIA position',
            body: 'The NDIA and Australian Government do not guarantee SDA returns and explicitly warn against "easy, low-risk, high-return" marketing. Demand mapping at the SA3 level is essential before purchase.',
            link: 'https://dataresearch.ndis.gov.au/reports-and-analyses/specialist-disability-accommodation-sda-data',
            linkLabel: 'NDIA SDA demand data',
          },
        ],
        financeNote: 'SDA properties require specialist finance and insurance. Expect conservative LVRs and lender scrutiny of enrolment status.',
        lastVerified: LAST_VERIFIED,
      }
    }
    return {
      classification: 'Standard residential dwelling — NCC Class 1a',
      summary:
        pkg.package_type === 'dual_key'
          ? 'A dual key home is a single dwelling with two self-contained areas: standard residential planning, standard lending, no rooming house licensing — both tenancies sit under one title.'
          : 'Standard residential dwelling: no rooming house registration or licensing applies.',
      checks: [
        { label: 'Rooming house licensing', value: 'Not required', pass: true },
        { label: 'Lending treatment', value: 'Standard residential', pass: true },
      ],
      layers: [],
      financeNote: null,
      lastVerified: LAST_VERIFIED,
    }
  }

  // ——— SA ———
  if (pkg.state === 'SA') {
    if (isMulti && rooms >= 5) {
      return {
        classification: 'Designated rooming house (SA)',
        summary:
          'Accommodation for 5+ persons in SA is a "designated rooming house": since 30 Nov 2024 the proprietor must be registered with Consumer and Business Services (fit-and-proper-person test; penalties for unregistered operation include imprisonment).',
        checks: [
          { label: 'CBS registration', value: 'Required (5+ residents)', pass: null },
          { label: 'Planning pathway', value: 'Co-located housing class (2025 Code Amendment)', pass: true },
        ],
        layers: [
          {
            title: 'CBS registration',
            body: 'Register with Consumer and Business Services under the Residential Tenancies Act 1995 (SA). Notify CBS of name/address changes within 14 days. Application and annual fees apply.',
            link: 'https://www.cbs.sa.gov.au',
            linkLabel: 'Consumer and Business Services SA',
          },
        ],
        financeNote: VIC_FINANCE_NOTE,
        lastVerified: LAST_VERIFIED,
      }
    }
    if (isMulti) {
      return {
        classification: 'Standard dwelling — SA co-living pathway',
        summary:
          "Under SA's Accommodation Diversity framework (2025), a house with 5 or fewer rented rooms remains a standard residential dwelling — no designated rooming house registration. This package is designed to stay on the standard side of that line.",
        checks: [
          { label: 'Rented rooms', value: `${rooms} (threshold: 5+)`, pass: rooms < 5 },
          { label: 'CBS registration', value: rooms >= 5 ? 'Required' : 'Not required', pass: rooms < 5 },
        ],
        layers: [],
        financeNote:
          'Most lenders treat sub-threshold SA co-living as standard residential, but confirm per-room income treatment with your broker before relying on it for serviceability.',
        lastVerified: LAST_VERIFIED,
      }
    }
    return {
      classification: 'Standard residential dwelling',
      summary: 'Standard residential dwelling: no rooming house registration applies in SA at this configuration.',
      checks: [
        { label: 'Rooming house registration', value: 'Not required', pass: true },
        { label: 'Lending treatment', value: 'Standard residential', pass: true },
      ],
      layers: [],
      financeNote: null,
      lastVerified: LAST_VERIFIED,
    }
  }

  // ——— other states (generic) ———
  return {
    classification: 'Residential dwelling',
    summary: 'State-specific rooming house rules vary — we map the compliance pathway for this state during your strategy session.',
    checks: [],
    layers: [],
    financeNote: isMulti ? VIC_FINANCE_NOTE : null,
    lastVerified: LAST_VERIFIED,
  }
}
