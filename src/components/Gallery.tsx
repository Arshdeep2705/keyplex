import { useState } from 'react'

export default function Gallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0)
  if (!images.length) return null

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border border-line bg-cream">
        <img
          src={images[active]}
          alt={`${title} — photo ${active + 1}`}
          className="aspect-[16/9] w-full object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={src + i}
              onClick={() => setActive(i)}
              className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                i === active ? 'border-brass' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
