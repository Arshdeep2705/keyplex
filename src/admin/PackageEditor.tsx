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
import { TYPE_LABEL, UI_TYPES, toSquares } from '../lib/types'
import { fetchPresets, savePackage, uploadImage } from '../lib/data'
import { supabase } from '../lib/supabase'
import { dutiableValue, dutyWithConcession, estWeeklyRepayment, fhog } from '../lib/calc'
import { generateFloorplan } from '../lib/floorplan'
import { money, slugify } from '../lib/format'
import PackageCard from '../components/PackageCard'
import FloorplanSVG from '../components/FloorplanSVG'

const STOCK: string[] = [
  ...[
    '1600585154340-be6161a56a0c', '1600596542815-ffad4c1539a9', '1600607687939-ce8a6c25118c',
    '1600566753190-17f0baa2a6c3', '1568605114967-8130f3a36994', '1570129477492-45c003edd2be',
    '1564013799919-ab600027ffc6', '1580587771525-78b9dba3b914', '1512917774080-9991f1c4c750',
    '1583608205776-bfd35f0d9f83', '1600047509807-ba8f99d2cdde', '1600573472592-401b489a3cdc',
    '1600607687920-4e2a09cf159d', '1600585154526-990dced4db0d', '1556912167-f556f1f39fdf',
    '1556909114-f6e7ad7d3136', '1600121848594-d8644e57abab', '1600210492486-724fe5c67fb0',
    '1600566752355-35792bedcfea',
  ].map((id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=80`),
]

const TYPE_DEFAULTS: Record<string, Partial<Pkg>> = {
  house_land: { beds: 4, baths: 2, cars: 2, living_areas: 2, storeys: 1, has_study: false, has_alfresco: true, land_size: 400, house_area: 210, lot_width: 12.5, est_capital_growth: 5.2, build_time_weeks: 26, title_status: 'Titled — ready to build', contract_type: 'two_part', unit_beds: 0, unit_baths: 0, rooms_rentable: 1 },
  dual_occupancy: { beds: 5, baths: 3, cars: 2, living_areas: 2, storeys: 1, has_study: false, has_alfresco: true, land_size: 512, house_area: 242, lot_width: 16, est_capital_growth: 5.4, build_time_weeks: 30, title_status: 'Titled — ready to build', contract_type: 'two_part', unit_beds: 2, unit_baths: 1, rooms_rentable: 2 },
  dual_key: { beds: 3, baths: 2, cars: 2, living_areas: 1, storeys: 1, has_study: false, has_alfresco: true, land_size: 400, house_area: 215, lot_width: 12.5, est_capital_growth: 5.3, build_time_weeks: 26, title_status: 'Titled — ready to build', contract_type: 'two_part', unit_beds: 2, unit_baths: 1, rooms_rentable: 2 },
}

function autoTitle(f: Partial<Pkg>) {
  const design = f.design_name?.trim()
  const suburb = f.suburb?.trim() || 'Suburb'
  if (f.package_type === 'dual_occupancy') return design ? `The ${design} Dual Occ — ${suburb}` : `Dual Occupancy — ${suburb}`
  if (f.package_type === 'dual_key') return design ? `The ${design} Dual Key — ${suburb}` : `Dual Key Home — ${suburb}`
  return design ? `The ${design} — ${suburb}` : `${f.beds ?? 4} Bedroom Home & Land — ${suburb}`
}

function autoDescription(f: Partial<Pkg>): string {
  const suburb = f.suburb || 'this growth suburb'
  const design = f.design_name ? `The ${f.design_name}` : 'This home'
  const extras = [f.has_study && 'a dedicated study', (f.living_areas ?? 1) > 1 && `${f.living_areas} living zones`, f.has_alfresco && 'an alfresco under the roofline'].filter(Boolean).join(', ')
  switch (f.package_type) {
    case 'dual_occupancy':
      return `Two homes, one title in ${suburb}. A ${(f.beds ?? 5) - (f.unit_beds ?? 2)}-bedroom main residence plus a self-contained ${f.unit_beds}-bedroom second dwelling — live in one and rent the other, house the extended family, or hold both. Separate metering and private yards to each, delivered turnkey with fixed site costs.`
    case 'dual_key':
      return `${design} pairs a ${(f.beds ?? 3)}-bedroom main residence with a self-contained ${f.unit_beds}-bedroom unit under one roof in ${suburb} — private entries, fire-rated separation and independent living for family or rental income. Full turnkey with fixed site costs.`
    default:
      return `${design} brings ${f.beds} bedrooms${extras ? `, ${extras}` : ''} to a ${f.land_size ?? ''}m² block in ${suburb}${f.estate ? `'s ${f.estate} estate` : ''}. ${f.storeys && f.storeys > 1 ? 'Smart double-storey design keeps the living zones open downstairs with the bedrooms up.' : 'A wide open-plan kitchen, meals and family zone runs across the rear of the home.'} Delivered full turnkey with fixed site costs — approvals, driveway, landscaping, fencing and blinds all included in the fixed price.`
  }
}

function autoHighlights(f: Partial<Pkg>): string[] {
  const out: string[] = []
  const bits = [f.has_study && 'study', (f.living_areas ?? 1) > 1 && `${f.living_areas} living zones`, f.has_alfresco && 'alfresco'].filter(Boolean).join(' + ')
  out.push(`${f.beds} bed / ${f.baths} bath${bits ? ` + ${bits}` : ''} on ${f.lot_width ?? '—'}m frontage`)
  if ((f.title_status ?? '').toLowerCase().includes('titled')) out.push('Titled land — site start within weeks')
  else if (f.title_status) out.push(f.title_status)
  if (f.state === 'SA') out.push('SA first home buyers: $0 stamp duty + $15k grant on new builds')
  else if (f.land_price && f.land_price <= 600_000) out.push('VIC first home buyers: $0 stamp duty (land under $600k) + $10k grant')
  if (f.package_type === 'dual_occupancy' || f.package_type === 'dual_key') out.push('Two homes, one title — live in one, rent the other')
  out.push('Fixed price, fixed site costs — full turnkey')
  out.push('7-star energy rated')
  return out.slice(0, 5)
}

const emptyForm: Partial<Pkg> = {
  status: 'draft',
  package_type: 'house_land',
  state: 'VIC',
  suburb: '',
  title: '',
  slug: '',
  design_name: '',
  price: 0,
  floorplan_variant: 0,
  energy_rating: 7,
  builder_name: 'Partner Builder — VIC',
  highlights: [],
  inclusions: [],
  gallery: [],
  ...TYPE_DEFAULTS.house_land,
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
        const preset = p.find((x) => x.package_type === 'house_land') ?? p[0]
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

  function changeType(t: PackageType) {
    const preset = presets.find((p) => p.package_type === t) ?? presets.find((p) => p.package_type === 'house_land')
    setForm((f) => {
      const next = { ...f, package_type: t, ...(TYPE_DEFAULTS[t] ?? {}) }
      if (preset) next.inclusions = preset.items
      if (!titleTouched) next.title = autoTitle(next)
      if (!descTouched) next.description = autoDescription(next)
      next.highlights = autoHighlights(next)
      return next
    })
  }

  /* keep auto copy in sync with the numbers */
  useEffect(() => {
    setForm((f) => {
      const next = { ...f }
      if (!titleTouched) next.title = autoTitle(f)
      if (!descTouched) next.description = autoDescription(f)
      next.slug =
        f.slug && !isNew
          ? f.slug
          : slugify(`${f.design_name || f.package_type}-${f.suburb ?? ''}`) || 'new-package'
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.suburb, form.design_name, form.package_type, form.beds, form.baths, form.storeys, form.has_study, form.has_alfresco, form.land_price, form.state])

  /* live computed metrics */
  const weekly = form.price ? estWeeklyRepayment(form.price) : null
  const dutyFhb = form.price ? dutyWithConcession(form.state ?? 'VIC', dutiableValue(form as Pkg), true) : null
  const grant = form.price && form.state ? fhog(form.state, form.price) : 0

  const plan = useMemo(() => {
    if (!form.beds) return null
    return generateFloorplan({
      beds: form.package_type === 'dual_occupancy' ? (form.beds ?? 4) - (form.unit_beds ?? 0) : form.beds ?? 4,
      baths: form.baths ?? 2,
      cars: form.cars ?? 2,
      living: form.living_areas ?? 1,
      study: form.has_study ?? false,
      alfresco: form.has_alfresco ?? true,
      storeys: form.storeys ?? 1,
      houseArea: form.house_area ?? 200,
      lotWidth: form.lot_width,
      variant: form.floorplan_variant ?? 0,
    })
  }, [form])

  const previewPkg: Pkg = {
    id: form.id ?? 'preview',
    created_at: '',
    updated_at: '',
    published_at: new Date().toISOString(),
    views_count: form.views_count ?? 0,
    design_name: form.design_name ?? null,
    storeys: form.storeys ?? 1,
    has_study: form.has_study ?? false,
    has_alfresco: form.has_alfresco ?? true,
    floorplan_variant: form.floorplan_variant ?? 0,
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
    rooms_rentable: form.rooms_rentable ?? 1,
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
    package_type: (form.package_type as PackageType) ?? 'house_land',
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
        title: form.title || autoTitle(form),
        slug: form.slug || slugify(`${form.design_name || form.package_type}-${form.suburb}`),
        description: form.description || autoDescription(form),
        highlights: form.highlights?.length ? form.highlights : autoHighlights(form),
      }
      if (publish) {
        payload.status = 'published'
        payload.published_at = form.published_at ?? new Date().toISOString()
      }
      try {
        const saved = await savePackage(payload)
        setForm(saved)
        setSavedAt(new Date().toLocaleTimeString())
        if (isNew) navigate(`/admin/packages/${saved.id}`, { replace: true })
      } catch (e: unknown) {
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

  function setGroup(i: number, patch: Partial<InclusionGroup>) {
    setForm((f) => {
      const groups = [...(f.inclusions ?? [])]
      groups[i] = { ...groups[i], ...patch }
      return { ...f, inclusions: groups }
    })
  }

  const num = (v: string) => (v === '' ? null : Number(v))
  const toggleCls = (active: boolean) =>
    `rounded-lg border px-4 py-2.5 text-[13.5px] font-semibold transition-colors ${
      active ? 'border-pine bg-pine text-paper' : 'border-line text-muted hover:border-brass'
    }`

  return (
    <div className="mx-auto max-w-[1440px]">
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

      <div className="mt-6 grid gap-8 xl:grid-cols-[1fr_430px]">
        {/* ————— FORM ————— */}
        <div className="space-y-6">
          {/* 1 · type + design */}
          <section className="rounded-2xl border border-line bg-card p-6">
            <p className="field-label">1 · Package type &amp; design</p>
            <div className="flex flex-wrap gap-2">
              {UI_TYPES.map((t) => (
                <button key={t} onClick={() => changeType(t)} className={toggleCls(form.package_type === t)}>
                  {TYPE_LABEL[t]}
                </button>
              ))}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <label className="field-label">Design name</label>
                <input
                  className="field"
                  value={form.design_name ?? ''}
                  onChange={(e) => set({ design_name: e.target.value })}
                  placeholder="Aspen 24"
                />
              </div>
              <div>
                <label className="field-label">Storeys</label>
                <div className="flex gap-2">
                  <button onClick={() => set({ storeys: 1 })} className={toggleCls(form.storeys === 1)}>Single</button>
                  <button onClick={() => set({ storeys: 2 })} className={toggleCls(form.storeys === 2)}>Double</button>
                </div>
              </div>
              <div>
                <label className="field-label">Extras</label>
                <div className="flex gap-2">
                  <button onClick={() => set({ has_study: !form.has_study })} className={toggleCls(!!form.has_study)}>Study</button>
                  <button onClick={() => set({ has_alfresco: !form.has_alfresco })} className={toggleCls(!!form.has_alfresco)}>Alfresco</button>
                </div>
              </div>
            </div>
          </section>

          {/* 2 · location */}
          <section className="rounded-2xl border border-line bg-card p-6">
            <p className="field-label">2 · Land &amp; location</p>
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
                <label className="field-label">Lot / address</label>
                <input className="field" value={form.address_hint ?? ''} onChange={(e) => set({ address_hint: e.target.value })} placeholder="Lot 1214, Ramlegh Springs Estate" />
              </div>
              <div>
                <label className="field-label">Land size (m²)</label>
                <input type="number" className="field tnum" value={form.land_size ?? ''} onChange={(e) => set({ land_size: num(e.target.value) })} />
              </div>
              <div>
                <label className="field-label">Frontage (m)</label>
                <input type="number" step="0.5" className="field tnum" value={form.lot_width ?? ''} onChange={(e) => set({ lot_width: num(e.target.value) })} />
              </div>
              <div className="sm:col-span-2">
                <label className="field-label">Title status</label>
                <input className="field" value={form.title_status ?? ''} onChange={(e) => set({ title_status: e.target.value })} placeholder="Titled — ready to build / Titles Q1 2027" />
              </div>
            </div>
          </section>

          {/* 3 · price */}
          <section className="rounded-2xl border border-line bg-card p-6">
            <p className="field-label">3 · Pricing</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="field-label">Total fixed price ($) *</label>
                <input type="number" className="field tnum" value={form.price || ''} onChange={(e) => set({ price: Number(e.target.value) })} placeholder="769000" />
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
                  placeholder="385000"
                />
              </div>
              <div>
                <label className="field-label">Build component ($)</label>
                <input type="number" className="field tnum" value={form.build_price ?? ''} onChange={(e) => set({ build_price: num(e.target.value) })} placeholder="384000" />
              </div>
              <div>
                <label className="field-label">Contract</label>
                <select className="field" value={form.contract_type} onChange={(e) => set({ contract_type: e.target.value as Pkg['contract_type'] })}>
                  <option value="two_part">Two-part H&amp;L (duty on land only)</option>
                  <option value="single_part">Single contract</option>
                </select>
              </div>
              <div>
                <label className="field-label">Build time (weeks)</label>
                <input type="number" className="field tnum" value={form.build_time_weeks ?? ''} onChange={(e) => set({ build_time_weeks: num(e.target.value) })} />
              </div>
              <div>
                <label className="field-label">Rental appraisal ($/wk, optional)</label>
                <input type="number" className="field tnum" value={form.total_weekly_rent ?? ''} onChange={(e) => set({ total_weekly_rent: num(e.target.value) })} placeholder="For investors" />
              </div>
            </div>
          </section>

          {/* 4 · home configuration */}
          <section className="rounded-2xl border border-line bg-card p-6">
            <p className="field-label">4 · Home configuration — drives the floorplan</p>
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
                <label className="field-label">Living areas</label>
                <input type="number" className="field tnum" value={form.living_areas ?? ''} onChange={(e) => set({ living_areas: Number(e.target.value) })} />
              </div>
              <div>
                <label className="field-label">House area (m²)</label>
                <input type="number" className="field tnum" value={form.house_area ?? ''} onChange={(e) => set({ house_area: num(e.target.value) })} />
                <p className="tnum mt-1 text-[11px] text-mist">{form.house_area ? `= ${toSquares(form.house_area)}` : ''}</p>
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
                <label className="field-label">Plan layout</label>
                <div className="flex gap-1.5">
                  {[0, 1, 2, 3].map((v) => (
                    <button
                      key={v}
                      onClick={() => set({ floorplan_variant: v })}
                      className={`rounded-lg border px-3 py-2 text-[13px] font-semibold transition-colors ${
                        form.floorplan_variant === v ? 'border-brass bg-brass text-pine' : 'border-line text-muted hover:border-brass'
                      }`}
                    >
                      {String.fromCharCode(65 + v)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 5 · media */}
          <section className="rounded-2xl border border-line bg-card p-6">
            <div className="flex items-center justify-between">
              <p className="field-label !mb-0">5 · Media — click to select, first pick becomes the hero</p>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-line px-3.5 py-2 text-[13px] font-semibold text-ink transition-colors hover:border-brass">
                {busy === 'upload' ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                Upload renders
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
              {STOCK.map((url) => {
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
                    <Sparkles size={12} /> Rewrite from specs
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
        <div className="space-y-5 xl:sticky xl:top-8 xl:self-start">
          <div>
            <p className="field-label">Live card preview</p>
            <div className="pointer-events-none">
              <PackageCard pkg={previewPkg} />
            </div>
          </div>

          <div className="space-y-2.5 rounded-2xl border border-line bg-card p-5">
            <p className="field-label !mb-1">Computed as you type</p>
            <div className="flex items-center justify-between text-[13.5px]">
              <span className="text-muted">Est. repayments (10% dep, 5.90%)</span>
              <span className="tnum font-bold text-growth">{weekly ? `${money(Math.round(weekly))}/wk` : '—'}</span>
            </div>
            <div className="flex items-center justify-between text-[13.5px]">
              <span className="text-muted">FHB stamp duty ({form.state})</span>
              <span className="tnum font-bold text-ink">
                {dutyFhb ? (dutyFhb.duty === 0 ? <span className="text-growth">$0</span> : money(Math.round(dutyFhb.duty))) : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between text-[13.5px]">
              <span className="text-muted">Total govt savings (FHB)</span>
              <span className="tnum font-bold text-growth">
                {dutyFhb ? money(Math.round(dutyFhb.saving + grant)) : '—'}
              </span>
            </div>
            <p className="pt-1 text-[11px] leading-relaxed text-mist">
              Repayments, duty, grants, the concept floorplan and the brochure all regenerate
              automatically — publish when it looks right.
            </p>
          </div>

          {plan && (
            <div>
              <p className="field-label">Live floorplan preview</p>
              <FloorplanSVG plan={plan} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
