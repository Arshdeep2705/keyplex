import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="flex min-h-[55vh] items-center justify-center bg-paper px-5">
      <div className="text-center">
        <p className="eyebrow">404</p>
        <h1 className="display-tight mt-3 font-display text-[40px] font-semibold text-ink">
          That address doesn't exist
        </h1>
        <p className="mt-3 text-[15px] text-muted">But plenty of great addresses do — with the full price attached.</p>
        <Link
          to="/packages"
          className="mt-8 inline-block rounded-lg bg-pine px-6 py-3 text-[14.5px] font-semibold text-paper transition-all hover:shadow-lift"
        >
          Browse packages
        </Link>
      </div>
    </section>
  )
}
