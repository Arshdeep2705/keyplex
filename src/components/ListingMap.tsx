import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

/**
 * Listing map with two engines:
 *  - Google Maps when VITE_GOOGLE_MAPS_KEY is set (best quality — needs the client's own key)
 *  - Leaflet with CARTO Voyager retina tiles + Esri satellite toggle otherwise (free, no key)
 */

const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY as string | undefined

const PIN_SVG = `
<svg width="34" height="44" viewBox="0 0 34 44" xmlns="http://www.w3.org/2000/svg">
  <path d="M17 0C7.6 0 0 7.6 0 17c0 12.7 17 27 17 27s17-14.3 17-27C34 7.6 26.4 0 17 0z" fill="#16241D"/>
  <path d="M17 2C8.7 2 2 8.7 2 17c0 11 15 24.3 15 24.3S32 28 32 17C32 8.7 25.3 2 17 2z" fill="#16241D" stroke="#CBA76F" stroke-width="1.5"/>
  <path d="M11 12.5h3v7.9l4.5-4.9h3.7l-4.9 5.2 5.3 6.8h-3.7l-4.5-4.9v4.9h-3z" fill="#CBA76F"/>
</svg>`

const pinIcon = L.divIcon({
  html: PIN_SVG,
  className: 'kp-pin',
  iconSize: [34, 44],
  iconAnchor: [17, 44],
})

interface MapProps {
  lat: number
  lng: number
  label?: string
  height?: number
  zoom?: number
  draggable?: boolean
  onMove?: (lat: number, lng: number) => void
}

/* ————— Google engine ————— */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global { interface Window { google?: any } }

let googleLoader: Promise<void> | null = null
function loadGoogle(key: string): Promise<void> {
  if (window.google?.maps) return Promise.resolve()
  if (!googleLoader) {
    googleLoader = new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly`
      s.async = true
      s.onload = () => resolve()
      s.onerror = () => reject(new Error('Google Maps failed to load'))
      document.head.appendChild(s)
    })
  }
  return googleLoader
}

/* muted brand styling — keeps the map quiet under the brass pin */
const GOOGLE_STYLE = [
  { elementType: 'geometry', stylers: [{ saturation: -25 }] },
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9d8d2' }] },
  { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
]

function GoogleListingMap({ lat, lng, label, height = 300, zoom = 15, draggable = false, onMove }: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stateRef = useRef<{ map: any; marker: any } | null>(null)
  const onMoveRef = useRef(onMove)
  onMoveRef.current = onMove
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let disposed = false
    loadGoogle(GOOGLE_KEY!)
      .then(() => {
        if (disposed || !containerRef.current || stateRef.current) return
        const g = window.google.maps
        const map = new g.Map(containerRef.current, {
          center: { lat, lng },
          zoom,
          styles: GOOGLE_STYLE,
          mapTypeControl: true,
          mapTypeControlOptions: { style: 2, position: 3 }, // small buttons, top-right
          streetViewControl: true,
          fullscreenControl: false,
          gestureHandling: 'cooperative',
        })
        const marker = new g.Marker({
          map,
          position: { lat, lng },
          draggable,
          title: label,
          icon: {
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(PIN_SVG)}`,
            scaledSize: new g.Size(34, 44),
            anchor: new g.Point(17, 44),
          },
        })
        if (draggable) {
          marker.addListener('dragend', () => {
            const p = marker.getPosition()
            onMoveRef.current?.(p.lat(), p.lng())
          })
        }
        stateRef.current = { map, marker }
      })
      .catch(() => setFailed(true))
    return () => {
      disposed = true
      stateRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const s = stateRef.current
    if (!s) return
    const pos = s.marker.getPosition()
    if (!pos || Math.abs(pos.lat() - lat) > 1e-7 || Math.abs(pos.lng() - lng) > 1e-7) {
      s.marker.setPosition({ lat, lng })
      s.map.panTo({ lat, lng })
    }
  }, [lat, lng])

  if (failed) return <LeafletListingMap lat={lat} lng={lng} label={label} height={height} zoom={zoom} draggable={draggable} onMove={onMove} />

  return (
    <div
      ref={containerRef}
      style={{ height }}
      className="z-0 w-full overflow-hidden rounded-2xl border border-line"
      aria-label={label ? `Map showing ${label}` : 'Location map'}
    />
  )
}

/* ————— Leaflet engine (no key needed) ————— */

function LeafletListingMap({ lat, lng, label, height = 300, zoom = 15, draggable = false, onMove }: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const layersRef = useRef<{ streets: L.TileLayer; satellite: L.TileLayer } | null>(null)
  const onMoveRef = useRef(onMove)
  onMoveRef.current = onMove
  const [view, setView] = useState<'streets' | 'satellite'>('streets')

  useEffect(() => {
    const el = containerRef.current
    if (!el || mapRef.current) return
    const map = L.map(el, {
      center: [lat, lng],
      zoom,
      scrollWheelZoom: false, // don't hijack page scroll — click to activate
      attributionControl: true,
    })
    map.once('click', () => map.scrollWheelZoom.enable())

    // CARTO Voyager: retina ({r} → @2x), clean modern cartography
    const streets = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    })
    const satellite = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 19, attribution: 'Imagery &copy; Esri' },
    )
    streets.addTo(map)

    const marker = L.marker([lat, lng], { icon: pinIcon, draggable }).addTo(map)
    if (label) marker.bindPopup(label)
    if (draggable) {
      marker.on('dragend', () => {
        const p = marker.getLatLng()
        onMoveRef.current?.(p.lat, p.lng)
      })
    }
    mapRef.current = map
    markerRef.current = marker
    layersRef.current = { streets, satellite }
    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
      layersRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // streets ⇄ satellite
  useEffect(() => {
    const map = mapRef.current
    const layers = layersRef.current
    if (!map || !layers) return
    if (view === 'satellite') {
      map.removeLayer(layers.streets)
      layers.satellite.addTo(map)
    } else {
      map.removeLayer(layers.satellite)
      layers.streets.addTo(map)
    }
  }, [view])

  // follow coordinate changes (e.g. re-geocode in the admin)
  useEffect(() => {
    const map = mapRef.current
    const marker = markerRef.current
    if (!map || !marker) return
    const current = marker.getLatLng()
    if (Math.abs(current.lat - lat) > 1e-7 || Math.abs(current.lng - lng) > 1e-7) {
      marker.setLatLng([lat, lng])
      map.setView([lat, lng], map.getZoom(), { animate: true })
    }
  }, [lat, lng])

  return (
    <div className="relative">
      <div
        ref={containerRef}
        style={{ height }}
        className="z-0 w-full overflow-hidden rounded-2xl border border-line"
        aria-label={label ? `Map showing ${label}` : 'Location map'}
      />
      <div className="absolute right-3 top-3 z-[500] flex overflow-hidden rounded-lg border border-line bg-card shadow-card">
        <button
          onClick={() => setView('streets')}
          className={`px-3 py-1.5 text-[12px] font-semibold transition-colors ${
            view === 'streets' ? 'bg-pine text-paper' : 'bg-card text-muted hover:text-ink'
          }`}
        >
          Map
        </button>
        <button
          onClick={() => setView('satellite')}
          className={`px-3 py-1.5 text-[12px] font-semibold transition-colors ${
            view === 'satellite' ? 'bg-pine text-paper' : 'bg-card text-muted hover:text-ink'
          }`}
        >
          Satellite
        </button>
      </div>
    </div>
  )
}

export default function ListingMap(props: MapProps) {
  if (GOOGLE_KEY) return <GoogleListingMap {...props} />
  return <LeafletListingMap {...props} />
}
