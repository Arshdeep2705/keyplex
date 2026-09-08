import { useEffect, useState } from 'react'
import { Baby, GraduationCap, Hospital, ShoppingCart, TrainFront, Trees } from 'lucide-react'

/**
 * "What's around the corner" — nearest station, schools, supermarket, medical, childcare and
 * park, computed live from OpenStreetMap for the package's coordinates. Straight-line
 * distances; an estate that is still being built will have thin data, so the panel simply
 * omits what it cannot find.
 */

interface Place {
  name: string
  km: number
  kind: string
}

interface Row {
  key: string
  label: string
  icon: React.ElementType
  place: Place | null
}

// public Overpass mirrors are individually flaky (504s under load) — try each in turn
const OVERPASS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
]

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

interface OsmEl {
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

async function fetchNearby(lat: number, lng: number): Promise<Record<string, Place | null>> {
  const key = `abh_nearby_${lat.toFixed(3)}_${lng.toFixed(3)}`
  try {
    const cached = sessionStorage.getItem(key)
    if (cached) return JSON.parse(cached)
  } catch {
    /* ignore */
  }
  const q = `[out:json][timeout:20];(
    nwr(around:7000,${lat},${lng})["railway"="station"]["station"!="light_rail"];
    nwr(around:3500,${lat},${lng})["amenity"="school"];
    nwr(around:3500,${lat},${lng})["shop"="supermarket"];
    nwr(around:9000,${lat},${lng})["amenity"="hospital"];
    nwr(around:3000,${lat},${lng})["amenity"~"^(childcare|kindergarten)$"];
    nwr(around:2500,${lat},${lng})["leisure"="park"]["name"];
  );out center tags;`
  let json: { elements: OsmEl[] } | null = null
  for (const url of OVERPASS) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        body: 'data=' + encodeURIComponent(q),
        signal: AbortSignal.timeout(20_000),
      })
      if (!res.ok) continue
      json = (await res.json()) as { elements: OsmEl[] }
      break
    } catch {
      /* try the next mirror */
    }
  }
  if (!json) throw new Error('overpass unavailable')
  const best: Record<string, Place | null> = { station: null, primary: null, secondary: null, supermarket: null, hospital: null, childcare: null, park: null }
  for (const el of json.elements) {
    const t = el.tags ?? {}
    const plat = el.lat ?? el.center?.lat
    const plon = el.lon ?? el.center?.lon
    if (plat == null || plon == null || !t.name) continue
    const km = haversine(lat, lng, plat, plon)
    let kind: string | null = null
    if (t.railway === 'station') kind = 'station'
    else if (t.amenity === 'school') {
      const n = t.name.toLowerCase()
      const isSecondary = /secondary|high school|college|senior|p-12|p–12|prep to year 12/.test(n) || t['isced:level']?.includes('3')
      kind = isSecondary ? 'secondary' : 'primary'
    } else if (t.shop === 'supermarket') kind = 'supermarket'
    else if (t.amenity === 'hospital') kind = 'hospital'
    else if (t.amenity === 'childcare' || t.amenity === 'kindergarten') kind = 'childcare'
    else if (t.leisure === 'park') kind = 'park'
    if (!kind) continue
    if (!best[kind] || km < best[kind]!.km) best[kind] = { name: t.name, km, kind }
  }
  try {
    sessionStorage.setItem(key, JSON.stringify(best))
  } catch {
    /* ignore */
  }
  return best
}

function fmtKm(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`
}
function travel(km: number) {
  if (km <= 1.6) return `~${Math.max(2, Math.round((km / 5) * 60))} min walk`
  return `~${Math.max(2, Math.round((km / 32) * 60))} min drive`
}

export default function NearbyPanel({ lat, lng, suburb }: { lat: number; lng: number; suburb: string }) {
  const [data, setData] = useState<Record<string, Place | null> | null | 'error'>(null)

  useEffect(() => {
    let stale = false
    fetchNearby(lat, lng)
      .then((d) => {
        if (!stale) setData(d)
      })
      .catch(() => {
        if (!stale) setData('error')
      })
    return () => {
      stale = true
    }
  }, [lat, lng])

  if (data === 'error') return null
  const rows: Row[] = [
    { key: 'station', label: 'Train station', icon: TrainFront, place: data?.station ?? null },
    { key: 'primary', label: 'Primary school', icon: GraduationCap, place: data?.primary ?? null },
    { key: 'secondary', label: 'Secondary school', icon: GraduationCap, place: data?.secondary ?? null },
    { key: 'supermarket', label: 'Supermarket', icon: ShoppingCart, place: data?.supermarket ?? null },
    { key: 'hospital', label: 'Hospital', icon: Hospital, place: data?.hospital ?? null },
    { key: 'childcare', label: 'Childcare', icon: Baby, place: data?.childcare ?? null },
    { key: 'park', label: 'Park', icon: Trees, place: data?.park ?? null },
  ]
  const found = rows.filter((r) => r.place)
  if (data && found.length === 0) return null

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-card">
      <div className="border-b border-line bg-cream/60 px-6 py-4">
        <p className="eyebrow">Around the corner</p>
        <p className="mt-0.5 text-[13px] text-muted">
          Nearest of each, measured from the lot in {suburb} — live from OpenStreetMap
        </p>
      </div>
      {data === null ? (
        <div className="grid gap-3 p-6 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="shimmer h-12 rounded-xl" />
          ))}
        </div>
      ) : (
        <ul className="grid gap-x-6 gap-y-1 px-6 py-4 sm:grid-cols-2">
          {found.map((r) => (
            <li key={r.key} className="flex items-center gap-3 border-b border-line/60 py-3 last:border-0 sm:[&:nth-last-child(2)]:border-0">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cream text-brass">
                <r.icon size={17} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10.5px] font-semibold uppercase tracking-[0.1em] text-mist">{r.label}</span>
                <span className="block truncate text-[14px] font-semibold text-ink">{r.place!.name}</span>
              </span>
              <span className="tnum shrink-0 text-right">
                <span className="block text-[14px] font-semibold text-ink">{fmtKm(r.place!.km)}</span>
                <span className="block text-[11px] text-mist">{travel(r.place!.km)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="border-t border-line px-6 py-3 text-[11px] text-mist">
        Straight-line distances from the lot pin. New estates are still being mapped, so some
        amenities may be missing or newer than the data. Verify school zones with the state
        department before relying on them.
      </p>
    </div>
  )
}
