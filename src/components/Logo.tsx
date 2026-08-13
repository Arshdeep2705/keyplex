export default function Logo({ dark = false, size = 34 }: { dark?: boolean; size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
        <rect width="32" height="32" rx="7" fill={dark ? '#CBA76F' : '#16241D'} />
        <path
          d="M10 7h4v10.5l6-6.5h5l-6.5 7L25 25h-5l-6-6.5V25h-4z"
          fill={dark ? '#16241D' : '#CBA76F'}
        />
      </svg>
      <span
        className={`font-display text-[22px] font-semibold tracking-tight ${dark ? 'text-paper' : 'text-ink'}`}
      >
        Keyplex
      </span>
    </span>
  )
}
