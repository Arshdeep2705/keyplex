import { Link } from 'react-router-dom'
import Logo from './Logo'

export default function Footer() {
  return (
    <footer className="blueprint grain relative bg-pine text-paper">
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo dark />
            <p className="mt-4 max-w-sm text-[14.5px] leading-relaxed text-paper/65">
              Multi-income homes. Built to perform. Co-living, dual key and rooming house &amp; land
              packages across Victoria and South Australia — with the numbers, compliance and finance
              pathway on the table before you commit.
            </p>
          </div>
          <div>
            <p className="eyebrow mb-4">Explore</p>
            <ul className="space-y-2.5 text-[14.5px] text-paper/80">
              <li><Link className="hover:text-brass-bright" to="/packages">All packages</Link></li>
              <li><Link className="hover:text-brass-bright" to="/why-co-living">Why co-living</Link></li>
              <li><Link className="hover:text-brass-bright" to="/compare">Compare strategies</Link></li>
              <li><Link className="hover:text-brass-bright" to="/contact">Book a strategy call</Link></li>
            </ul>
          </div>
          <div>
            <p className="eyebrow mb-4">Talk to us</p>
            <ul className="space-y-2.5 text-[14.5px] text-paper/80">
              <li><a className="hover:text-brass-bright" href="tel:1300539759">1300 539 759</a></li>
              <li><a className="hover:text-brass-bright" href="mailto:hello@keyplex.com.au">hello@keyplex.com.au</a></li>
              <li>Victoria &amp; South Australia</li>
            </ul>
          </div>
        </div>

        <div className="mt-14 border-t border-line-dark/60 pt-8">
          <p className="max-w-5xl text-[12px] leading-relaxed text-paper/45">
            This website provides general information only and does not constitute financial, legal or
            taxation advice. All projected rents, yields and returns are estimates based on stated
            assumptions — they are projected, not guaranteed, and actual results depend on occupancy,
            management and market movement. Images are illustrative and may include upgrade items.
            Prices are subject to change without notice, land availability and developer approval.
            Rooming house operation requires registration and licensing in VIC (4+ unrelated occupants)
            and registration in SA (5+ persons). Seek independent advice from licensed professionals
            before making any investment decision. Compliance information last verified August 2026.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-[12.5px] text-paper/50">
            <span>© {new Date().getFullYear()} Keyplex Homes. All rights reserved.</span>
            <Link to="/admin" className="transition-colors hover:text-brass-bright">
              Partner login
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
