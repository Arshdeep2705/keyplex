import { Link } from 'react-router-dom'
import Logo from './Logo'
import { SITE } from '../lib/site'

export default function Footer() {
  return (
    <footer className="blueprint grain relative overflow-hidden bg-pine text-paper">
      {/* giant outlined wordmark — the brand as architecture */}
      <div className="pointer-events-none select-none px-5 pt-10 lg:px-8" aria-hidden>
        <p className="wordmark-outline pointer-events-auto mx-auto max-w-7xl text-[15vw] leading-[0.9] sm:text-[11vw] lg:text-[9.5vw]">
          AU Build Hub
        </p>
      </div>

      <div className="mx-auto max-w-7xl px-5 pb-14 pt-10 lg:px-8">
        <div className="grid gap-12 border-t border-line-dark/60 pt-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo dark />
            <p className="mt-4 max-w-sm text-[14.5px] leading-relaxed text-paper/65">
              House &amp; land, packaged properly. Fixed-price packages across Victoria and South
              Australia — with the full price, a live concept floorplan, a 3D model, your repayments and
              every first-home-buyer incentive on the table before you talk to anyone.
            </p>
          </div>
          <div>
            <p className="eyebrow mb-4">Explore</p>
            <ul className="space-y-2.5 text-[14.5px] text-paper/80">
              <li><Link className="link-draw hover:text-brass-bright" to="/packages">All packages</Link></li>
              <li><Link className="link-draw hover:text-brass-bright" to="/packages?shortlist=1">Your shortlist</Link></li>
              <li><Link className="link-draw hover:text-brass-bright" to="/buying-guide">First home buyer guide</Link></li>
              <li><Link className="link-draw hover:text-brass-bright" to="/compare">Compare packages</Link></li>
              <li><Link className="link-draw hover:text-brass-bright" to="/contact">Talk to a consultant</Link></li>
            </ul>
          </div>
          <div>
            <p className="eyebrow mb-4">Talk to us</p>
            <ul className="space-y-2.5 text-[14.5px] text-paper/80">
              <li><a className="link-draw hover:text-brass-bright" href={SITE.phoneHref}>{SITE.phone}</a></li>
              <li><a className="link-draw hover:text-brass-bright" href={`mailto:${SITE.email}`}>{SITE.email}</a></li>
              <li>{SITE.regions}</li>
            </ul>
          </div>
        </div>

        <div className="mt-14 border-t border-line-dark/60 pt-8">
          <p className="max-w-5xl text-[12px] leading-relaxed text-paper/45">
            This website provides general information only and does not constitute financial, legal or
            taxation advice. Prices are based on the standard plan and are subject to change without
            notice, land availability and developer approval; floorplan changes cost extra. Concept
            floorplans and 3D models are auto-generated and indicative only — final working drawings are
            prepared by the builder and may differ. Images are illustrative and may include upgrade items.
            Repayment estimates, grants and stamp duty concessions depend on the stated assumptions and
            your eligibility — confirm with your lender and conveyancer. Rental appraisals and move-in
            estimates are projections, not guarantees.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-[12.5px] text-paper/50">
            <span>© {new Date().getFullYear()} {SITE.name}. All rights reserved.</span>
            <Link to="/admin" className="transition-colors hover:text-brass-bright">
              Partner login
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
