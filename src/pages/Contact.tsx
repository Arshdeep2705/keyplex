import { useEffect } from 'react'
import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import Reveal from '../components/Reveal'
import LeadForm from '../components/LeadForm'

export default function Contact() {
  useEffect(() => {
    document.title = 'Contact — AU Build Hub'
  }, [])

  return (
    <section className="bg-paper">
      <div className="mx-auto grid max-w-7xl gap-14 px-5 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <Reveal>
          <p className="eyebrow">Talk to a consultant</p>
          <h1 className="display-tight mt-3 font-display text-[38px] font-semibold text-ink sm:text-[46px]">
            Let's put numbers on it
          </h1>
          <p className="mt-4 max-w-md text-[15.5px] leading-relaxed text-muted">
            Whether you're weighing a single storey against a double, working out which grants you
            qualify for, or just want the honest numbers before you visit a display home — start here.
          </p>

          <div className="mt-10 space-y-5">
            <a href="tel:1300539759" className="flex items-center gap-4 text-ink transition-colors hover:text-growth">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cream"><Phone size={18} className="text-brass" /></span>
              <span>
                <span className="block text-[15px] font-semibold">1300 539 759</span>
                <span className="text-[13px] text-muted">Mon–Sat, 9am–6pm AEST</span>
              </span>
            </a>
            <a href="mailto:hello@aubuildhub.com.au" className="flex items-center gap-4 text-ink transition-colors hover:text-growth">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cream"><Mail size={18} className="text-brass" /></span>
              <span>
                <span className="block text-[15px] font-semibold">hello@aubuildhub.com.au</span>
                <span className="text-[13px] text-muted">We reply same-day</span>
              </span>
            </a>
            <div className="flex items-center gap-4 text-ink">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cream"><MapPin size={18} className="text-brass" /></span>
              <span>
                <span className="block text-[15px] font-semibold">Melbourne &amp; Adelaide</span>
                <span className="text-[13px] text-muted">Serving VIC and SA growth corridors</span>
              </span>
            </div>
            <div className="flex items-center gap-4 text-ink">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cream"><Clock size={18} className="text-brass" /></span>
              <span>
                <span className="block text-[15px] font-semibold">Fast response promise</span>
                <span className="text-[13px] text-muted">Enquiries answered in minutes during business hours</span>
              </span>
            </div>
          </div>

          <div className="mt-10 rounded-2xl border border-line bg-card p-6">
            <p className="eyebrow">What happens next</p>
            <ol className="mt-4 space-y-3 text-[14px] leading-relaxed text-muted">
              <li><strong className="text-ink">1.</strong> A consultant calls to understand your goals, budget and borrowing position.</li>
              <li><strong className="text-ink">2.</strong> You get a shortlist with full cashflow models and compliance pathways.</li>
              <li><strong className="text-ink">3.</strong> You take everything to your own adviser — we insist on it.</li>
            </ol>
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <LeadForm source="contact_page" />
        </Reveal>
      </div>
    </section>
  )
}
