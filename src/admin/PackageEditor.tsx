import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  FileText,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import type { InclusionGroup, InclusionPreset, PackageType, Pkg } from '../lib/types'
import { TYPE_LABEL } from '../lib/types'
import { fetchPresets, savePackage, uploadImage } from '../lib/data'
import { supabase } from '../lib/supabase'
import { cashflow, defaultCashflowInputs, dutiableValue, grossYield, stampDuty } from '../lib/calc'
import { money, pct, slugify } from '../lib/format'
import PackageCard from '../components/PackageCard'

const STOCK: { url: string; kind: 'facade' | 'interior' }[] = [
  ...[
    '1600585154340-be6161a56a0c', '1600596542815-ffad4c1539a9', '1600607687939-ce8a6c25118c',
    '1600566753190-17f0baa2a6c3', '1568605114967-8130f3a36994', '1570129477492-45c003edd2be',
    '1564013799919-ab600027ffc6', '1580587771525-78b9dba3b914', '1512917774080-9991f1c4c750',
    '1583608205776-bfd35f0d9f83', '1600047509807-ba8f99d2cdde', '1600573472592-401b489a3cdc',
    '1600607687920-4e2a09cf159d',
  ].map((id) => ({ url: `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=80`, kind: 'facade' as const })),
  ...[
    '1600585154526-990dced4db0d', '1556912167-f556f1f39fdf', '1556909114-f6e7ad7d3136',
    '1600121848594-d8644e57abab', '1600210492486-724fe5c67fb0', '1600566752355-35792bedcfea',
  ].map((id) => ({ url: `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=80`, kind: 'interior' as const })),
]

const TYPE_DEFAULTS: Record<PackageType, Partial<Pkg>> = {
  coliving: { beds: 5, baths: 5, cars: 2, living_areas: 2, rooms_rentable: 5, rent_per_room: 290, land_size: 420, house_area: 240, lot_width: 14, est_capital_growth: 5, vacancy_rate: 1.2, build_time_weeks: 30, title_status: 'Titles — ready to build', contract_type: 'two_part', unit_beds: 0, unit_baths: 0 },
  dual_key: { beds: 3, baths: 2, cars: 2, living_areas: 1, rooms_rentable: 2, rent_per_room: null as unknown as number, total_weekly_rent: 880, land_size: 400, house_area: 220, lot_width: 12.5, est_capital_growth: 5.3, vacancy_rate: 1.2, build_time_weeks: 26, title_status: 'Titles — ready to build', contract_type: 'two_part', unit_beds: 2, unit_baths: 1 },
  house_land: { beds: 4, baths: 2, cars: 2, living_areas: 2, rooms_rentable: 1, rent_per_room: null as unknown as number, total_weekly_rent: 600, land_size: 448, house_area: 210, lot_width: 14, est_capital_growth: 5.5, vacancy_rate: 1.3, build_time_weeks: 24, title_status: 'Titles — ready to build', contract_type: 'two_part', unit_beds: 0, unit_baths: 0 },
  rooming_house: { beds: 9, baths: 9, cars: 2, living_areas: 2, rooms_rentable: 9, rent_per_room: 265, land_size: 650, house_area: 298, lot_width: 18, est_capital_growth: 4.5, vacancy_rate: 1.6, build_time_weeks: 36, title_status: 'Design finalised', contract_type: 'single_part', unit_beds: 0, unit_baths: 0 },
  ndis: { beds: 4, baths: 4, cars: 2, living_areas: 2, rooms_rentable: 4, rent_per_room: null as unknown as number, total_weekly_rent: null as unknown as number, land_size: 450, house_area: 242, lot_width: 14, est_capital_growth: 5, vacancy_rate: null as unknown as number, build_time_weeks: 32, title_status: 'Titles — ready to build', contract_type: 'two_part', unit_beds: 0, unit_baths: 0 },
  dual_occupancy: { beds: 3, baths: 2, cars: 2, living_areas: 1, rooms_rentable: 2, rent_per_room: null as unknown as number, total_weekly_rent: 900, land_size: 500, house_area: 230, lot_width: 16, est_capital_growth: 5.2, vacancy_rate: 1.2, build_time_weeks: 30, title_status: 'Titles — ready to build', contract_type: 'two_part', unit_beds: 2, unit_baths: 1 },
}

function autoTitle(type: PackageType, suburb: string) {
  return `${TYPE_LABEL[type]} Investment — ${suburb || 'Suburb'}`
}

function autoDescription(f: Partial<Pkg>): string {
  const t = f.package_type ?? 'coliving'
  const suburb = f.suburb || 'this growth suburb'
  const rooms = f.rooms_rentable ?? 0
  const rent = f.rent_per_room ?? 0
  switch (t) {
    case 'coliving':
      return `Purpose-built ${f.beds}-bedroom co-living home in ${suburb}. Every resident room has its own ensuite, built-in robe, split-system and keyed smart lock — ${rooms} individual income streams under one title${rent ? `, projected at ${money(rent)}/week per room` : ''}. Designed NCC Class 1b-compliant from day one, with fire-rated separation and acoustic insulation between rooms. One vacancy of ${rooms} costs ~${Math.round(100 / Math.max(rooms, 1))}% of income, not 100%.`
    case 'dual_key':
      return `Two self-contained homes under one roof and one title in ${suburb}. ${f.beds}-bed main residence plus ${f.unit_beds}-bed unit, each with private entry, fire-rated separation and independent utilities provision. Two income streams on standard residential lending — no rooming house licensing required.`
    case 'rooming_house':
      return `Premium ${rooms}-room rooming house configuration in ${suburb}. Individually metered, ensuited rooms engineered to the edge of the compliance envelope. One vacancy costs ~${Math.round(100 / Math.max(rooms, 1))}% of income. Specialist lending applies — our broker panel handles the pathway.`
    case 'ndis':
      return `SDA-capable ${f.beds}-bedroom design in ${suburb}, built to SDA Design Standard v1.1. We deliberately do not advertise headline yields on SDA stock: funding attaches to the participant, not the property. We provide a location demand assessment before you commit.`
    case 'dual_occupancy':
      return `Two detached dwellings on one lot in ${suburb} — live in one and rent the other, or hold both for dual income with future subdivision potential.`
    default:
      return `Quality ${f.beds}-bedroom family home and land package in ${suburb}. A strong capital-growth play in a proven corridor, delivered turnkey with fixed site costs.`
  }
}

function autoHighlights(f: Partial<Pkg>): string[] {
  const rooms = f.rooms_rentable ?? 0
  const rent = f.total_weekly_rent ?? 0
  const out: string[] = []
  if (rooms > 1 && rent) out.push(`${rooms} income streams — projected ${money(rent)}/week combined`)
  if (rooms > 1) out.push(`One vacancy = only ~${Math.round(100 / rooms)}% income impact`)
  if (f.package_type === 'coliving' || f.package_type === 'rooming_house') out.push('Designed NCC Class 1b — no costly retrofit')
  if (f.package_type === 'dual_key') out.push('Standard residential lending — no specialist LVR caps')
  if (f.contract_type === 'single_part') out.push('SMSF-ready single-part contract')
  out.push('Fixed site costs + 7-star energy rating')
  return out.slice(0, 5)
}

const emptyForm: Partial<Pkg> = {
  status: 'draft',
  package_type: 'coliving',
  state: 'VIC',
  suburb: '',
  title: '',
  slug: '',
  price: 0,
  highlights: [],
  inclusions: [],
  gallery: [],
  energy_rating: 7,
  builder_name: 'Partner Builder — VIC',
  ...TYPE_DEFAULTS.coliving,
}

export default function PackageEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id
  const [form, setForm] = useState<Partial<Pkg>>(emptyForm)
  const [presets, setPresets] = useState<InclusionPreset[]>([])
  const [titleTouched, setTitleTouched] = useState(false)
  const [descTouched, setDescTouched] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<string>('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPresets().then((p) => {
      setPresets(p)
      if (isNew) {
        const preset = p.find((x) => x.package_type === 'coliving')
        if (preset) setForm((f) => ({ ...f, inclusions: preset.items }))
      }
    })
    if (id) {
      supabase
        .from('kp_packages')
        .select('*')
        .eq('id', id)
        .single()
        .then(({ data }) => {
          if (data) {
            setForm(data as Pkg)
            setTitleTouched(true)
            setDescTouched(true)
          }
        })
    }
  }, [id, isNew])

  const set = (patch: Partial<Pkg>) => setForm((f) => ({ ...f, ...patch }))

  /* type change → smart defaults + preset inclusions + auto copy */
  function changeType(t: PackageType) {
    const preset = presets.find((p) => p.package_type === t)
    setForm((f) => {
      const next = { ...f, package_type: t, ...TYPE_DEFAULTS[t] }
      if (preset) next.inclusions = preset.items
      if (!titleTouched) next.title = autoTitle(t, f.suburb ?? '')
      if (!descTouched) next.description = autoDescription(next)
      next.highlights = autoHighlights(next)
      return next
    })
  }

  /* keep auto fields in sync */
  useEffect(() => {
    setForm((f) => {
      const next = { ...f }
      const t = f.package_type as PackageType
      if ((t === 'coliving' || t === 'rooming_house') && f.rooms_rentable && f.rent_per_room) {
        next.total_weekly_rent = f.rooms_rentable * f.rent_per_room
      }
      if (!titleTouched) next.title = autoTitle(t, f.suburb ?? '')
      next.slug = f.slug && !isNew ? f.slug : slugify(`${t}-${f.suburb ?? ''}-${f.beds ?? ''}br`)
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.suburb, form.rooms_rentable, form.rent_per_room, form.package_type, form.beds])

  /* live computed metrics */
  const yieldPct = grossYield(form.price ?? 0, form.total_weekly_rent)
  const duty = form.price ? stampDuty(form.state ?? 'VIC', dutiableValue(form as Pkg)) : 0
  const weeklyCf = useMemo(() => {
    if (!form.price || !form.total_weekly_rent) return null
    return cashflow(defaultCashflowInputs(form as Pkg)).weeklyCashflow
  }, [form])
  const c5223 =
    form.state === 'VIC' && (form.package_type === 'coliving' || form.package_type === 'rooming_house')
      ? (form.house_area ?? 0) <= 300 && (form.beds ?? 0) <= 9 && (form.rooms_rentable ?? 0) <= 12
      : null

  const previewPkg: Pkg = {
    id: form.id ?? 'preview',
    created_at: '',
    updated_at: '',
    published_at: new Date().toISOString(),
    views_count: form.views_count ?? 0,
    postcode: form.postcode ?? null,
    estate: form.estate ?? null,
    address_hint: form.address_hint ?? null,
    land_price: form.land_price ?? null,
    build_price: form.build_price ?? null,
    price_note: form.price_note ?? null,
    land_size: form.land_size ?? null,
    house_area: form.house_area ?? null,
    lot_width: form.lot_width ?? null,
    living_areas: form.living_areas ?? 1,
    unit_beds: form.unit_beds ?? 0,
    unit_baths: form.unit_baths ?? 0,
    rooms_rentable: form.rooms_rentable ?? 0,
    rent_per_room: form.rent_per_room ?? null,
    total_weekly_rent: form.total_weekly_rent ?? null,
    est_capital_growth: form.est_capital_growth ?? null,
    vacancy_rate: form.vacancy_rate ?? null,
    title_status: form.title_status ?? null,
    build_time_weeks: form.build_time_weeks ?? null,
    builder_name: form.builder_name ?? null,
    energy_rating: form.energy_rating ?? null,
    description: form.description ?? null,
    floorplan_url: null,
    brochure_url: null,
    lat: null,
    lng: null,
    ...form,
    title: form.title || 'Untitled package',
    slug: form.slug || 'preview',
    status: (form.status as Pkg['status']) ?? 'draft',
    package_type: (form.package_type as PackageType) ?? 'coliving',
    suburb: form.suburb || 'Suburb',
    state: form.state ?? 'VIC',
    price: form.price ?? 0,
    beds: form.beds ?? 0,
    baths: form.baths ?? 0,
    cars: form.cars ?? 0,
    highlights: form.highlights ?? [],
    inclusions: form.inclusions ?? [],
    hero_image: form.hero_image ?? null,
    gallery: form.gallery ?? [],
    contract_type: form.contract_type ?? 'two_part',
  }

  async function save(publish?: boolean) {
    setBusy(publish ? 'publish' : 'save')
    setError('')
    try {
      const payload: Partial<Pkg> = {
        ...form,
        title: form.title || autoTitle(form.package_type as PackageType, form.suburb ?? ''),
        slug: form.slug || slugify(`${form.package_type}-${form.suburb}-${form.beds}br`),
        description: form.description || autoDescription(form),
        highlights: form.highlights?.length ? form.highlights : autoHighlights(form),
      }
      if (publish) {
        payload.status = 'published'
        payload.published_at = form.published_at ?? new Date().toISOString()
      }
      delete (payload as Record<string, unknown>).kp_packages
      try {
        const saved = await savePackage(payload)
        setForm(saved)
        setSavedAt(new Date().toLocaleTimeString())
        if (isNew) navigate(`/admin/packages/${saved.id}`, { replace: true })
      } catch (e: unknown) {
        // slug collision → retry once with a suffix
        if (String((e as Error).message ?? '').includes('duplicate')) {
          payload.slug = `${payload.slug}-${Math.floor(Math.random() * 900 + 100)}`
          const saved = await savePackage(payload)
          setForm(saved)
          setSavedAt(new Date().toLocaleTimeString())
          if (isNew) navigate(`/admin/packages/${saved.id}`, { replace: true })
        } else throw e
      }
    } catch (e: unknown) {
      setError(`Save failed: ${(e as Error).message ?? 'unknown error'}`)
    } finally {
      setBusy(null)
    }
  }

  async function previewBrochure() {
    setBusy('pdf')
    try {
      const { brochureBlobUrl } = await import('../pdf/generateBrochure')
      window.open(await brochureBlobUrl(previewPkg), '_blank')
    } finally {
      setBusy(null)
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files?.length) return
    setBusy('upload')
    try {
      for (const file of Array.from(files)) {
        const url = await uploadImage(file)
        setForm((f) => ({
          ...f,
          hero_image: f.hero_image ?? url,
          gallery: [...(f.gallery ?? []), url],
        }))
      }
    } catch {
      setError('Upload failed — check you are signed in as an admin.')
    } finally {
      setBusy(null)
    }
  }

  function toggleStock(url: string) {
    setForm((f) => {
      const gal = f.gallery ?? []
      if (gal.includes(url)) {
        const next = gal.filter((g) => g !== url)
        return { ...f, gallery: next, hero_image: f.hero_image === url ? (next[0] ?? null) : f.hero_image }
      }
      return { ...f, gallery: [...gal, url], hero_image: f.hero_image ?? url }
    })
  }

  /* inclusions editing */
  function setGroup(i: number, patch: Partial<InclusionGroup>) {
    setForm((f) => {
      const groups = [...(f.inclusions ?? [])]
      groups[i] = { ...groups[i], ...patch }
      return { ...f, inclusions: groups }
    })
  }

  const num = (v: string) => (v === '' ? null : Number(v))

  return (
    <div className="mx-auto max-w-[1400px]">
      <button
        onClick={() => navigate('/admin/packages')}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-ink"
      >
        <ArrowLeft size={14} /> All packages
      </button>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">{isNew ? 'New package' : 'Edit package'}</p>
          <h1 className="mt-1 font-display text-[26px] font-semibold text-ink">
            {isNew ? 'Build a package in under a minute' : form.title}
          </h1>
        </div>
        <div className="flex items-center gap-2.5">
          {savedAt && <span className="text-[12px] text-mist">Saved {savedAt}</span>}
          <button
            onClick={previewBrochure}
            disabled={busy !== null}
            className="flex items-center gap-2 rounded-lg border border-line bg-card px-4 py-2.5 text-[13.5px] font-semibold text-ink transition-colors hover:border-brass disabled:opacity-60"
          >
            {busy === 'pdf' ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
            Preview brochure
          </button>
          <button
            onClick={() => save(false)}
            disabled={busy !== null}
            className="rounded-lg border border-line bg-card px-4 py-2.5 text-[13.5px] font-semibold text-ink transition-colors hover:border-brass disabled:opacity-60"
          >
            {busy === 'save' ? 'Saving…' : 'Save draft'}
          </button>
          <button
            onClick={() => save(true)}
            disabled={busy !== null || !form.suburb || !form.price}
            className="flex items-center gap-2 rounded-lg bg-growth px-5 py-2.5 text-[13.5px] font-bold text-white transition-all hover:shadow-lift disabled:opacity-50"
          >
            {busy === 'publish' ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {form.status === 'published' ? 'Update live listing' : 'Publish now'}
          </button>
        </div>
      </div>
      {error && <p className="mt-3 rounded-lg bg-danger-soft px-4 py-2.5 text-[13px] font-medium text-danger">{error}</p>}

      <div className="mt-6 grid gap-8 xl:grid-cols-[1fr_400px]">
        {/* ————— FORM ————— */}
        <div className="space-y-6">
          {/* 1 · type */}
          <section className="rounded-2xl border border-line bg-card p-6">
            <p className="field-label">1 · Strategy type — sets smart defaults + inclusions</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(TYPE_LABEL) as PackageType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => changeType(t)}
                  className={`rounded-lg border px-4 py-2.5 text-[13.5px] font-semibold transition-colors ${
                    form.package_type === t
                      ? 'border-pine bg-pine text-paper'
                      : 'border-line text-muted hover:border-brass'
                  }`}
                >
                  {TYPE_LABEL[t]}
                </button>
              ))}
            </div>
          </section>

          {/* 2 · location */}
          <section className="rounded-2xl border border-line bg-card p-6">
            <p className="field-label">2 · Location</p>
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="sm:col-span-2">
                <label className="field-label">Suburb *</label>
                <input className="field" value={form.suburb ?? ''} onChange={(e) => set({ suburb: e.target.value })} placeholder="Clyde North" />
              </div>
              <div>
                <label className="field-label">State</label>
                <select className="field" value={form.state} onChange={(e) => set({ state: e.target.value, builder_name: `Partner Builder — ${e.target.value}` })}>
                  {['VIC', 'SA', 'NSW', 'QLD', 'WA', 'TAS'].map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label">Postcode</label>
                <input className="field" value={form.postcode ?? ''} onChange={(e) => set({ postcode: e.target.value })} placeholder="3978" />
              </div>
              <div className="sm:col-span-2">
                <label className="field-label">Estate</label>
                <input className="field" value={form.estate ?? ''} onChange={(e) => set({ estate: e.target.value })} placeholder="Ramlegh Springs" />
              </div>
              <div className="sm:col-span-2">
                <label className="field-label">Lot / address hint</label>
                <input className="field" value={form.address_hint ?? ''} onChange={(e) => set({ address_hint: e.target.value })} placeholder="Lot 1214, Ramlegh Springs Estate" />
              </div>
            </div>
          </section>

          {/* 3 · numbers */}
          <section className="rounded-2xl border border-line bg-card p-6">
            <p className="field-label">3 · Price &amp; land</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="field-label">Total price ($) *</label>
                <input type="number" className="field tnum" value={form.price || ''} onChange={(e) => set({ price: Number(e.target.value) })} placeholder="895000" />
              </div>
              <div>
                <label className="field-label">Land component ($)</label>
                <input
                  type="number"
                  className="field tnum"
                  value={form.land_price ?? ''}
                  onChange={(e) => {
                    const land = num(e.target.value)
                    set({ land_price: land, build_price: land && form.price ? form.price - land : form.build_price })
                  }}
                  placeholder="405000"
                />
              </div>
              <div>
                <label className="field-label">Build component ($)</label>
                <input type="number" className="field tnum" value={form.build_price ?? ''} onChange={(e) => set({ build_price: num(e.target.value) })} placeholder="490000" />
              </div>
              <div>
                <label className="field-label">Land size (m²)</label>
                <input type="number" className="field tnum" value={form.land_size ?? ''} onChange={(e) => set({ land_size: num(e.target.value) })} />
              </div>
              <div>
                <label className="field-label">House area (m²)</label>
                <input type="number" className="field tnum" value={form.house_area ?? ''} onChange={(e) => set({ house_area: num(e.target.value) })} />
              </div>
              <div>
                <label className="field-label">Lot width (m)</label>
                <input type="number" step="0.5" className="field tnum" value={form.lot_width ?? ''} onChange={(e) => set({ lot_width: num(e.target.value) })} />
              </div>
              <div>
                <label className="field-label">Contract</label>
                <select className="field" value={form.contract_type} onChange={(e) => set({ contract_type: e.target.value as Pkg['contract_type'] })}>
                  <option value="two_part">Two-part H&amp;L (duty on land only)</option>
                  <option value="single_part">Single-part (SMSF-ready)</option>
                </select>
              </div>
              <div>
                <label className="field-label">Title status</label>
                <input className="field" value={form.title_status ?? ''} onChange={(e) => set({ title_status: e.target.value })} placeholder="Titles — ready to build" />
              </div>
              <div>
                <label className="field-label">Build time (weeks)</label>
                <input type="number" className="field tnum" value={form.build_time_weeks ?? ''} onChange={(e) => set({ build_time_weeks: num(e.target.value) })} />
              </div>
            </div>
          </section>

          {/* 4 · configuration */}
          <section className="rounded-2xl border border-line bg-card p-6">
            <p className="field-label">4 · Configuration &amp; income</p>
            <div className="grid gap-4 sm:grid-cols-4">
              <div>
                <label className="field-label">Beds</label>
                <input type="number" className="field tnum" value={form.beds ?? ''} onChange={(e) => set({ beds: Number(e.target.value) })} />
              </div>
              <div>
                <label className="field-label">Baths</label>
                <input type="number" className="field tnum" value={form.baths ?? ''} onChange={(e) => set({ baths: Number(e.target.value) })} />
              </div>
              <div>
                <label className="field-label">Cars</label>
                <input type="number" className="field tnum" value={form.cars ?? ''} onChange={(e) => set({ cars: Number(e.target.value) })} />
              </div>
              <div>
                <label className="field-label">Income streams</label>
                <input type="number" className="field tnum" value={form.rooms_rentable ?? ''} onChange={(e) => set({ rooms_rentable: Number(e.target.value) })} />
              </div>
              {(form.package_type === 'dual_key' || form.package_type === 'dual_occupancy') && (
                <>
                  <div>
                    <label className="field-label">Unit beds</label>
                    <input type="number" className="field tnum" value={form.unit_beds ?? ''} onChange={(e) => set({ unit_beds: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="field-label">Unit baths</label>
                    <input type="number" className="field tnum" value={form.unit_baths ?? ''} onChange={(e) => set({ unit_baths: Number(e.target.value) })} />
                  </div>
                </>
              )}
              <div>
                <label className="field-label">Rent per room ($/wk)</label>
                <input type="number" className="field tnum" value={form.rent_per_room ?? ''} onChange={(e) => set({ rent_per_room: num(e.target.value) })} placeholder="290" />
              </div>
              <div>
                <label className="field-label">Total rent ($/wk)</label>
                <input type="number" className="field tnum" value={form.total_weekly_rent ?? ''} onChange={(e) => set({ total_weekly_rent: num(e.target.value) })} />
              </div>
              <div>
                <label className="field-label">Capital growth (%)</label>
                <input type="number" step="0.1" className="field tnum" value={form.est_capital_growth ?? ''} onChange={(e) => set({ est_capital_growth: num(e.target.value) })} />
              </div>
              <div>
                <label className="field-label">Vacancy rate (%)</label>
                <input type="number" step="0.1" className="field tnum" value={form.vacancy_rate ?? ''} onChange={(e) => set({ vacancy_rate: num(e.target.value) })} />
              </div>
            </div>
          </section>

          {/* 5 · media */}
          <section className="rounded-2xl border border-line bg-card p-6">
            <div className="flex items-center justify-between">
              <p className="field-label !mb-0">5 · Media — click to select, first pick becomes the hero</p>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-line px-3.5 py-2 text-[13px] font-semibold text-ink transition-colors hover:border-brass">
                {busy === 'upload' ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                Upload photos
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
              </label>
            </div>

            {(form.gallery?.length ?? 0) > 0 && (
              <div className="mt-4 flex flex-wrap gap-3">
                {form.gallery!.map((url) => (
                  <div key={url} className="group relative">
                    <img
                      src={url}
                      alt=""
                      className={`h-20 w-28 rounded-lg object-cover ${form.hero_image === url ? 'ring-2 ring-brass' : ''}`}
                    />
                    {form.hero_image === url && (
                      <span className="absolute left-1 top-1 rounded bg-brass px-1.5 py-0.5 text-[9px] font-bold uppercase text-pine">Hero</span>
                    )}
                    <div className="absolute inset-0 hidden items-center justify-center gap-1.5 rounded-lg bg-ink/50 group-hover:flex">
                      {form.hero_image !== url && (
                        <button onClick={() => set({ hero_image: url })} className="rounded bg-paper px-2 py-1 text-[10px] font-bold text-ink">
                          Set hero
                        </button>
                      )}
                      <button onClick={() => toggleStock(url)} className="rounded bg-danger px-1.5 py-1 text-paper">
                        <X size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="mt-5 text-[12px] font-semibold uppercase tracking-[0.08em] text-mist">Quick-pick stock imagery</p>
            <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
              {STOCK.map(({ url }) => {
                const selected = form.gallery?.includes(url)
                return (
                  <button key={url} onClick={() => toggleStock(url)} className="relative overflow-hidden rounded-md">
                    <img src={url.replace('w=1600', 'w=200')} alt="" className={`aspect-[4/3] w-full object-cover transition-opacity ${selected ? 'opacity-100' : 'opacity-75 hover:opacity-100'}`} />
                    {selected && (
                      <span className="absolute inset-0 flex items-center justify-center bg-pine/50">
                        <Check size={16} className="text-brass-bright" />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </section>

          {/* 6 · copy */}
          <section className="rounded-2xl border border-line bg-card p-6">
            <p className="field-label">6 · Listing copy — auto-written, edit if you like</p>
            <div className="space-y-4">
              <div>
                <label className="field-label">Title</label>
                <input
                  className="field"
                  value={form.title ?? ''}
                  onChange={(e) => {
                    setTitleTouched(true)
                    set({ title: e.target.value })
                  }}
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="field-label">Description</label>
                  <button
                    onClick={() => {
                      setDescTouched(false)
                      set({ description: autoDescription(form), highlights: autoHighlights(form) })
                    }}
                    className="mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-brass hover:underline"
                  >
                    <Sparkles size={12} /> Rewrite from numbers
                  </button>
                </div>
                <textarea
                  rows={4}
                  className="field"
                  value={form.description ?? ''}
                  onChange={(e) => {
                    setDescTouched(true)
                    set({ description: e.target.value })
                  }}
                />
              </div>
              <div>
                <label className="field-label">Highlights (one per line)</label>
                <textarea
                  rows={4}
                  className="field"
                  value={(form.highlights ?? []).join('\n')}
                  onChange={(e) => set({ highlights: e.target.value.split('\n').filter(Boolean) })}
                />
              </div>
            </div>
          </section>

          {/* 7 · inclusions */}
          <section className="rounded-2xl border border-line bg-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="field-label !mb-0">7 · Inclusions</p>
              <div className="flex items-center gap-2">
                <select
                  className="field !w-auto !py-2 text-[13px]"
                  value=""
                  onChange={(e) => {
                    const preset = presets.find((p) => p.id === e.target.value)
                    if (preset) set({ inclusions: preset.items })
                  }}
                >
                  <option value="">Load preset…</option>
                  {presets.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => set({ inclusions: [...(form.inclusions ?? []), { category: 'New section', items: [] }] })}
                  className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-[13px] font-semibold text-ink hover:border-brass"
                >
                  <Plus size={13} /> Section
                </button>
              </div>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {(form.inclusions ?? []).map((g, i) => (
                <div key={i} className="rounded-xl border border-line p-4">
                  <div className="flex items-center gap-2">
                    <input
                      className="field !py-1.5 text-[13.5px] font-semibold"
                      value={g.category}
                      onChange={(e) => setGroup(i, { category: e.target.value })}
                    />
                    <button
                      onClick={() => set({ inclusions: form.inclusions!.filter((_, k) => k !== i) })}
                      className="rounded-lg p-2 text-muted hover:bg-danger-soft hover:text-danger"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <textarea
                    rows={5}
                    className="field mt-2 text-[12.5px]"
                    value={g.items.join('\n')}
                    onChange={(e) => setGroup(i, { items: e.target.value.split('\n').filter(Boolean) })}
                    placeholder="One item per line"
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ————— LIVE PREVIEW ————— */}
        <div className="xl:sticky xl:top-8 xl:self-start">
          <p className="field-label">Live preview</p>
          <div className="pointer-events-none">
            <PackageCard pkg={previewPkg} />
          </div>

          <div className="mt-5 space-y-2.5 rounded-2xl border border-line bg-card p-5">
            <p className="field-label !mb-1">Computed as you type</p>
            <div className="flex items-center justify-between text-[13.5px]">
              <span className="text-muted">Gross yield</span>
              <span className="tnum font-bold text-growth">{yieldPct ? pct(yieldPct) : '—'}</span>
            </div>
            <div className="flex items-center justify-between text-[13.5px]">
              <span className="text-muted">Est. weekly cashflow (defaults)</span>
              <span className={`tnum font-bold ${weeklyCf != null && weeklyCf >= 0 ? 'text-growth' : 'text-danger'}`}>
                {weeklyCf != null ? `${weeklyCf >= 0 ? '+' : ''}${money(Math.round(weeklyCf))}` : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between text-[13.5px]">
              <span className="text-muted">Transfer duty ({form.contract_type === 'two_part' && form.land_price ? 'land only' : 'full price'})</span>
              <span className="tnum font-bold text-ink">{duty ? money(Math.round(duty)) : '—'}</span>
            </div>
            {c5223 !== null && (
              <div className="flex items-center justify-between text-[13.5px]">
                <span className="text-muted">VIC Clause 52.23 exemption</span>
                <span className={`font-bold ${c5223 ? 'text-growth' : 'text-danger'}`}>
                  {c5223 ? '✓ Inside envelope' : '✗ Permit required'}
                </span>
              </div>
            )}
            <p className="pt-1 text-[11px] leading-relaxed text-mist">
              Yield, duty, compliance checks and the brochure regenerate automatically — publish when the
              preview looks right.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
