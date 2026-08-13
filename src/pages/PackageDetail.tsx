import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowLeftRight,
  Bath,
  BedDouble,
  Car,
  Check,
  Download,
  Eye,
  FileText,
  Home,
  KeyRound,
  LandPlot,
  Loader2,
  Ruler,
  Timer,
  Zap,
} from 'lucide-react'
import type { Pkg } from '../lib/types'
import { TYPE_LABEL } from '../lib/types'
import { fetchBySlug, fetchPublished, incrementViews } from '../lib/data'
import { pkgYield } from '../lib/calc'
import { money, moneyShort, pct, sqm } from '../lib/format'
import { useCompare } from '../lib/CompareContext'
import Gallery from '../components/Gallery'
import IncomeTable from '../components/IncomeTable'
import CalculatorPanel from '../components/CalculatorPanel'
import ComplianceCard from '../components/ComplianceCard'
import InclusionsAccordion from '../components/InclusionsAccordion'
import LeadForm from '../components/LeadForm'
import PackageCard from '../components/PackageCard'
import Reveal from '../components/Reveal'

function Spec({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-card px-4 py-3">
      <Icon size={17} className="shrink-0 text-brass" />
      <div>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-mist">{label}</p>
        <p className="tnum text-[14px] font-semibold text-ink">{value}</p>
      </div>
    </div>
  )
}

export default function PackageDetail() {
  const { slug } = useParams()
  const [pkg, setPkg] = useState<Pkg | null | undefined>(undefined)
  const [similar, setSimilar] = useState<Pkg[]>([])
  const [pdfBusy, setPdfBusy] = useState<'download' | 'view' | null>(null)
  const { toggle, has } = useCompare()

  useEffect(() => {
    if (!slug) return
    setPkg(undefined)
    fetchBySlug(slug)
      .then((p) => {
        setPkg(p)
        if (p) {
          document.title = `${p.title} — Keyplex`
          incrementViews(slug)
          fetchPublished().then((all) =>
            setSimilar(all.filter((x) => x.slug !== slug && x.package_type === p.package_type).slice(0, 3)),
          )
        }
      })
      .catch(() => setPkg(null))
  }, [slug])

  if (pkg === undefined) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-paper">
        <Loader2 size={26} className="animate-spin text-brass" />
      </div>
    )
  }

  if (!pkg) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center bg-paper px-5 text-center">
        <p className="font-display text-2xl font-semibold text-ink">Package not found</p>
        <Link to="/packages" className="mt-4 text-[14.5px] font-semibold text-growth hover:underline">
          Back to all packages
        </Link>
      </div>
    )
  }

  const yieldPct = pkgYield(pkg)
  const gallery = pkg.gallery?.length ? pkg.gallery : pkg.hero_image ? [pkg.hero_image] : []
  const inCompare = has(pkg.slug)

  async function handlePdf(mode: 'download' | 'view') {
    if (!pkg) return
    setPdfBusy(mode)
    try {
      const { downloadBrochure, brochureBlobUrl } = await import('../pdf/generateBrochure')
      if (mode === 'download') await downloadBrochure(pkg)
      else window.open(await brochureBlobUrl(pkg), '_blank')
    } finally {
      setPdfBusy(null)
    }
  }

  return (
    <>
      {/* header band */}
      <section className="border-b border-line bg-pine text-paper">
        <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
          <Link
            to="/packages"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-paper/60 transition-colors hover:text-brass-bright"
          >
            <ArrowLeft size={14} /> All packages
          </Link>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="rounded-md bg-brass px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-pine">
                  {TYPE_LABEL[pkg.package_type]}
                </span>
                <span className="rounded-md border border-paper/25 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-paper/80">
                  {pkg.title_status}
                </span>
                {pkg.contract_type === 'single_part' && (
                  <span className="rounded-md border border-brass-bright/60 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-brass-bright">
                    SMSF-ready
                  </span>
                )}
              </div>
              <h1 className="display-tight mt-3 font-display text-[32px] font-semibold leading-tight sm:text-[42px]">
                {pkg.title}
              </h1>
              <p className="mt-2 text-[14.5px] text-paper/65">
                {pkg.address_hint ? `${pkg.address_hint} · ` : ''}
                {pkg.estate ? `${pkg.estate} · ` : ''}
                {pkg.suburb}, {pkg.state} {pkg.postcode}
              </p>
            </div>
            <div className="text-right">
              <p className="tnum font-display text-[36px] font-semibold leading-none text-paper">
                {money(pkg.price)}
              </p>
              {pkg.land_price && pkg.build_price && (
                <p className="tnum mt-1.5 text-[13px] text-paper/60">
                  Land {moneyShort(pkg.land_price)} + Build {moneyShort(pkg.build_price)}
                </p>
              )}
              {yieldPct && (
                <p className="tnum mt-2 inline-block rounded-md bg-growth px-2.5 py-1 text-[13.5px] font-bold text-white">
                  {pct(yieldPct)} gross yield <span className="font-normal opacity-80">· projected*</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-paper">
        <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
          {/* actions row */}
          <div className="mb-8 flex flex-wrap items-center gap-3">
            <button
              onClick={() => handlePdf('download')}
              disabled={pdfBusy !== null}
              className="flex items-center gap-2 rounded-lg bg-pine px-5 py-2.5 text-[14px] font-semibold text-paper transition-all hover:shadow-lift disabled:opacity-60"
            >
              {pdfBusy === 'download' ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
              Download brochure
            </button>
            <button
              onClick={() => handlePdf('view')}
              disabled={pdfBusy !== null}
              className="flex items-center gap-2 rounded-lg border border-line bg-card px-5 py-2.5 text-[14px] font-semibold text-ink transition-colors hover:border-brass disabled:opacity-60"
            >
              {pdfBusy === 'view' ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}
              View brochure
            </button>
            <button
              onClick={() => toggle(pkg.slug)}
              className={`flex items-center gap-2 rounded-lg border px-5 py-2.5 text-[14px] font-semibold transition-colors ${
                inCompare ? 'border-brass bg-brass-soft text-ink' : 'border-line bg-card text-ink hover:border-brass'
              }`}
            >
              {inCompare ? <Check size={15} className="text-brass" /> : <ArrowLeftRight size={15} />}
              {inCompare ? 'In compare' : 'Compare'}
            </button>
            <span className="ml-auto flex items-center gap-1.5 text-[12.5px] text-mist">
              <Eye size={14} /> {pkg.views_count + 1} views
            </span>
          </div>

          <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
            {/* left column */}
            <div className="space-y-8">
              <Gallery images={gallery} title={pkg.title} />

              {/* spec grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Spec icon={BedDouble} label="Bedrooms" value={String(pkg.beds)} />
                <Spec icon={Bath} label="Bathrooms" value={String(pkg.baths)} />
                <Spec icon={Car} label="Garage" value={String(pkg.cars)} />
                <Spec icon={LandPlot} label="Land" value={sqm(pkg.land_size)} />
                <Spec icon={Home} label="House" value={sqm(pkg.house_area)} />
                <Spec icon={Ruler} label="Lot width" value={pkg.lot_width ? `${pkg.lot_width} m` : '—'} />
                {pkg.build_time_weeks && <Spec icon={Timer} label="Build time" value={`~${pkg.build_time_weeks} wks`} />}
                {pkg.energy_rating && <Spec icon={Zap} label="Energy" value={`${pkg.energy_rating}★`} />}
                {(pkg.rooms_rentable ?? 0) > 1 && (
                  <Spec icon={KeyRound} label="Income streams" value={String(pkg.rooms_rentable)} />
                )}
              </div>

              {/* description + highlights */}
              <div>
                <h2 className="font-display text-[24px] font-semibold text-ink">About this package</h2>
                <p className="mt-4 text-[15px] leading-relaxed text-muted">{pkg.description}</p>
                {pkg.highlights?.length > 0 && (
                  <ul className="mt-6 space-y-2.5">
                    {pkg.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-3 text-[14.5px] text-ink/85">
                        <Check size={16} className="mt-1 shrink-0 text-growth" />
                        {h}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <InclusionsAccordion groups={pkg.inclusions ?? []} />
            </div>

            {/* right column */}
            <div className="space-y-6">
              <IncomeTable pkg={pkg} />
              <ComplianceCard pkg={pkg} />
              <div id="enquire">
                <p className="eyebrow mb-3">Enquire about this package</p>
                <LeadForm packageId={pkg.id} source={`package:${pkg.slug}`} compact />
              </div>
            </div>
          </div>

          {/* calculator full width */}
          <div className="mt-12">
            <CalculatorPanel pkg={pkg} />
          </div>

          {/* similar */}
          {similar.length > 0 && (
            <div className="mt-16">
              <Reveal>
                <p className="eyebrow">Keep exploring</p>
                <h2 className="mt-2 font-display text-[26px] font-semibold text-ink">
                  Similar {TYPE_LABEL[pkg.package_type]} packages
                </h2>
              </Reveal>
              <div className="mt-7 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
                {similar.map((p, i) => (
                  <Reveal key={p.id} delay={i * 0.08}>
                    <PackageCard pkg={p} />
                  </Reveal>
                ))}
              </div>
            </div>
          )}

          <p className="mt-12 text-[11.5px] leading-relaxed text-mist">
            *All rents, yields and returns shown are projections based on current market appraisals and
            the assumptions stated — projected, not guaranteed. Images are illustrative and may include
            upgrade items. Price subject to land availability and developer approval. General information
            only; seek independent financial, legal and taxation advice.
          </p>
        </div>
      </section>
    </>
  )
}
