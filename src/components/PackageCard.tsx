import { Link } from 'react-router-dom'
import { ArrowLeftRight, Bath, BedDouble, CalendarClock, Car, Check, Heart, LandPlot, Layers } from 'lucide-react'
import type { Pkg } from '../lib/types'
import { TYPE_LABEL, toSquares } from '../lib/types'
import { dutiableValue, dutyWithConcession, estWeeklyRepayment } from '../lib/calc'
import { daysAgo, money, moneyShort } from '../lib/format'
import { moveInEstimate } from '../lib/timeline'
import { useCompare } from '../lib/CompareContext'
import { useShortlist } from '../lib/ShortlistContext'
import Tilt from './Tilt'

export default function PackageCard({ pkg }: { pkg: Pkg }) {
  const { toggle, has, isFull } = useCompare()
  const shortlist = useShortlist()
  const inCompare = has(pkg.slug)
  const saved = shortlist.has(pkg.slug)
  const compareBlocked = isFull && !inCompare
  const weekly = estWeeklyRepayment(pkg.price)
  const moveIn = moveInEstimate(pkg)
  const fhbDuty = dutyWithConcession(pkg.state, dutiableValue(pkg), true)

  return (
    <Tilt max={5}>
      <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-card transition-shadow duration-300 hover:shadow-lift">
        <div className="card-shine z-[1]" aria-hidden />

        <Link to={`/packages/${pkg.slug}`} className="relative block h-52 overflow-hidden bg-cream">
          {pkg.hero_image && (
            <img
              src={pkg.hero_image}
              alt={pkg.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
            />
          )}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink/75 via-ink/25 to-transparent" />
          <span className="absolute left-3 top-3 rounded-md bg-pine/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-brass-bright backdrop-blur">
            {pkg.package_type === 'house_land'
              ? pkg.storeys > 1
                ? 'Double Storey'
                : 'Single Storey'
              : TYPE_LABEL[pkg.package_type]}
          </span>
          {pkg.status !== 'published' && (
            <span className="absolute left-3 top-11 rounded-md bg-brass px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-pine">
              {pkg.status}
            </span>
          )}
          <span className="absolute bottom-3 left-3 font-display text-[17px] font-medium text-paper">
            {pkg.suburb}, {pkg.state}
          </span>
          {moveIn.titled && (
            <span className="absolute bottom-3.5 right-3 flex items-center gap-1.5 rounded-md bg-growth/90 px-2 py-1 text-[10.5px] font-bold uppercase tracking-[0.1em] text-white backdrop-blur">
              <span className="live-dot relative h-1.5 w-1.5 rounded-full bg-white" />
              Titled
            </span>
          )}
        </Link>

        {/* save + compare */}
        <div className="absolute right-3 top-3 z-10 flex gap-2">
          <button
            onClick={() => shortlist.toggle(pkg.slug)}
            aria-pressed={saved}
            aria-label={saved ? `Remove ${pkg.title} from shortlist` : `Save ${pkg.title} to shortlist`}
            className={`flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur transition-all active:scale-90 ${
              saved
                ? 'border-brass bg-brass text-pine'
                : 'border-paper/40 bg-ink/40 text-paper hover:border-brass hover:text-brass-bright'
            }`}
          >
            <Heart size={15} className={saved ? 'fill-pine' : ''} />
          </button>
          <button
            onClick={() => toggle(pkg.slug)}
            title={
              inCompare
                ? 'Remove from compare'
                : compareBlocked
                  ? 'Compare is full (3 max) — remove one first'
                  : 'Add to compare'
            }
            aria-label={inCompare ? `Remove ${pkg.title} from compare` : `Add ${pkg.title} to compare`}
            className={`flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur transition-all active:scale-90 ${
              inCompare
                ? 'border-brass bg-brass text-pine'
                : compareBlocked
                  ? 'cursor-not-allowed border-paper/25 bg-ink/40 text-paper/40'
                  : 'border-paper/40 bg-ink/40 text-paper hover:border-brass hover:text-brass-bright'
            }`}
          >
            {inCompare ? <Check size={16} /> : <ArrowLeftRight size={15} />}
          </button>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <Link to={`/packages/${pkg.slug}`}>
            <h3 className="display-tight font-display text-[19px] font-semibold leading-snug text-ink transition-colors group-hover:text-pine-soft">
              {pkg.title}
            </h3>
          </Link>
          <p className="mt-1 text-[12.5px] text-muted">
            {pkg.estate ? `${pkg.estate} · ` : ''}
            {pkg.title_status}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-muted">
            <span className="flex items-center gap-1.5"><BedDouble size={15} className="text-brass" />{pkg.beds}</span>
            <span className="flex items-center gap-1.5"><Bath size={15} className="text-brass" />{pkg.baths}</span>
            <span className="flex items-center gap-1.5"><Car size={15} className="text-brass" />{pkg.cars}</span>
            {pkg.land_size && (
              <span className="flex items-center gap-1.5"><LandPlot size={15} className="text-brass" />{pkg.land_size}m²</span>
            )}
            {pkg.house_area && (
              <span className="flex items-center gap-1.5"><Layers size={15} className="text-brass" />{toSquares(pkg.house_area)}</span>
            )}
          </div>

          <p className="tnum mt-3 flex items-center gap-1.5 text-[12.5px] text-muted">
            <CalendarClock size={14} className="text-brass" />
            Move in <strong className="font-semibold text-ink">≈ {moveIn.moveIn}</strong>
            <span className="text-mist">· {moveIn.startLabel.toLowerCase()}</span>
          </p>

          <div className="tnum mt-4 flex items-center justify-between rounded-xl bg-growth-soft px-3.5 py-2.5">
            <span className="text-[13.5px] font-medium text-ink">
              From {money(Math.round(weekly))}/wk <span className="text-[11px] text-muted">repayments*</span>
            </span>
            {pkg.total_weekly_rent ? (
              <span className="rounded-md bg-pine px-2 py-0.5 text-[11.5px] font-bold text-brass-bright">
                Rents ~{money(pkg.total_weekly_rent)}/wk
              </span>
            ) : fhbDuty.duty === 0 ? (
              <span className="rounded-md bg-growth px-2 py-0.5 text-[11.5px] font-bold text-white">
                FHB: $0 duty
              </span>
            ) : (
              <span className="rounded-md bg-growth px-2 py-0.5 text-[11.5px] font-bold text-white">
                Fixed price
              </span>
            )}
          </div>

          <div className="mt-4 flex items-end justify-between border-t border-line pt-4">
            <div>
              <p className="tnum font-display text-[22px] font-semibold text-ink">{money(pkg.price)}</p>
              {pkg.land_price && pkg.build_price && (
                <p className="tnum text-[11.5px] text-muted">
                  Land {moneyShort(pkg.land_price)} + Build {moneyShort(pkg.build_price)}
                </p>
              )}
            </div>
            <span className="text-[11.5px] text-mist">{daysAgo(pkg.published_at)}</span>
          </div>
        </div>
      </article>
    </Tilt>
  )
}
