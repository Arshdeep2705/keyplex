/**
 * Free geocoding via OpenStreetMap Nominatim (no key, AU-scoped).
 * Fair-use: called only on explicit admin actions / debounced field entry, never per page view.
 */
export interface GeoPoint {
  lat: number
  lng: number
  matchedOn: string
}

async function query(q: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=au&q=${encodeURIComponent(q)}`
    const res = await fetch(url, { headers: { 'Accept-Language': 'en-AU' } })
    if (!res.ok) return null
    const data = (await res.json()) as { lat: string; lon: string }[]
    if (!data?.[0]) return null
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch {
    return null
  }
}

/**
 * Tries progressively broader queries: full address → estate → suburb.
 * A suburb-level pin is standard practice for pre-title lots ("location indicative").
 */
export async function geocodePackage(parts: {
  address_hint?: string | null
  estate?: string | null
  suburb: string
  state: string
  postcode?: string | null
}): Promise<GeoPoint | null> {
  const { address_hint, estate, suburb, state, postcode } = parts
  const suffix = `${suburb}, ${state} ${postcode ?? ''}, Australia`.trim()

  if (address_hint) {
    // strip "Lot 1214," prefixes — Nominatim rarely knows lot numbers but often knows the street/estate
    const cleaned = address_hint.replace(/^lot\s*\d+[,\s/-]*/i, '').trim()
    if (cleaned.length > 3) {
      const hit = await query(`${cleaned}, ${suffix}`)
      if (hit) return { ...hit, matchedOn: 'address' }
    }
  }
  if (estate) {
    const hit = await query(`${estate}, ${suffix}`)
    if (hit) return { ...hit, matchedOn: 'estate' }
  }
  const hit = await query(suffix)
  if (hit) return { ...hit, matchedOn: 'suburb' }
  return null
}
