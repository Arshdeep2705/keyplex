export type PackageType =
  | 'coliving'
  | 'dual_key'
  | 'house_land'
  | 'rooming_house'
  | 'ndis'
  | 'dual_occupancy'

export type PackageStatus = 'draft' | 'published' | 'reserved' | 'sold' | 'archived'

export interface InclusionGroup {
  category: string
  items: string[]
}

export interface Pkg {
  id: string
  slug: string
  title: string
  status: PackageStatus
  package_type: PackageType
  suburb: string
  state: string
  postcode: string | null
  estate: string | null
  address_hint: string | null
  price: number
  land_price: number | null
  build_price: number | null
  contract_type: 'single_part' | 'two_part'
  price_note: string | null
  land_size: number | null
  house_area: number | null
  lot_width: number | null
  beds: number
  baths: number
  cars: number
  living_areas: number | null
  unit_beds: number | null
  unit_baths: number | null
  rooms_rentable: number | null
  rent_per_room: number | null
  total_weekly_rent: number | null
  est_capital_growth: number | null
  vacancy_rate: number | null
  title_status: string | null
  build_time_weeks: number | null
  builder_name: string | null
  energy_rating: number | null
  description: string | null
  highlights: string[]
  inclusions: InclusionGroup[]
  hero_image: string | null
  gallery: string[]
  floorplan_url: string | null
  brochure_url: string | null
  lat: number | null
  lng: number | null
  views_count: number
  created_at: string
  updated_at: string
  published_at: string | null
}

export interface Lead {
  id: string
  package_id: string | null
  name: string
  email: string
  phone: string | null
  message: string | null
  source: string | null
  preferred_time: string | null
  status: 'new' | 'contacted' | 'qualified' | 'closed' | 'spam'
  created_at: string
}

export interface InclusionPreset {
  id: string
  name: string
  package_type: PackageType | null
  items: InclusionGroup[]
}

export const TYPE_LABEL: Record<PackageType, string> = {
  coliving: 'Co-Living',
  dual_key: 'Dual Key',
  house_land: 'House & Land',
  rooming_house: 'Rooming House',
  ndis: 'NDIS / SDA',
  dual_occupancy: 'Dual Occupancy',
}

export const TYPE_DESCRIPTION: Record<PackageType, string> = {
  coliving: 'Ensuited rooms rented individually — multiple income streams under one title.',
  dual_key: 'Two self-contained dwellings under one roof — two rents, standard lending.',
  house_land: 'Classic single-tenancy house & land — the capital growth baseline.',
  rooming_house: 'Large-format registered rooming house — maximum income streams.',
  ndis: 'SDA-capable design — a specialist vertical with its own risk profile.',
  dual_occupancy: 'Two detached dwellings on one lot — subdivision potential.',
}

export const STATES = ['VIC', 'SA', 'NSW', 'QLD', 'WA', 'TAS'] as const
