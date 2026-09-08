/** Infinite horizontal ticker — pauses on hover, fades at the edges. */
export default function Marquee({
  items,
  className = '',
  speed = 42,
}: {
  items: string[]
  className?: string
  speed?: number
}) {
  if (!items.length) return null
  const track = [...items, ...items]
  return (
    <div className={`marquee ${className}`} aria-hidden>
      <div className="marquee-track" style={{ animationDuration: `${speed}s` }}>
        {track.map((t, i) => (
          <span key={i} className="marquee-item">
            {t}
            <span className="marquee-dot" />
          </span>
        ))}
      </div>
    </div>
  )
}
