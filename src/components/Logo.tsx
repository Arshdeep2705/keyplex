export default function Logo({ dark = false, size = 34 }: { dark?: boolean; size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
        <rect width="32" height="32" rx="7" fill={dark ? '#CBA76F' : '#16241D'} />
        <text
          x="16"
          y="20.7"
          textAnchor="middle"
          fontFamily="Archivo, ui-sans-serif, system-ui, sans-serif"
          fontSize="13"
          fontWeight="700"
          letterSpacing="-0.55"
          fill={dark ? '#16241D' : '#CBA76F'}
        >
          ABH
        </text>
      </svg>
      <span
        className={`font-display text-[22px] font-semibold tracking-tight ${dark ? 'text-paper' : 'text-ink'}`}
      >
        AU Build Hub
      </span>
    </span>
  )
}
