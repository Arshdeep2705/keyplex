export default function Logo({ dark = false, size = 34 }: { dark?: boolean; size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
        <rect width="32" height="32" rx="7" fill={dark ? '#CBA76F' : '#16241D'} />
        {/* An "A" whose apex doubles as a gable roofline */}
        <path
          fillRule="evenodd"
          d="M16 5.5 26.5 26.5h-4.9l-1.85-3.9h-7.5L10.4 26.5H5.5zM16 12.6l-2.65 5.7h5.3z"
          fill={dark ? '#16241D' : '#CBA76F'}
        />
      </svg>
      <span
        className={`font-display text-[22px] font-semibold tracking-tight ${dark ? 'text-paper' : 'text-ink'}`}
      >
        AU Build Hub
      </span>
    </span>
  )
}
