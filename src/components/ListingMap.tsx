import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const PIN_SVG = `
<svg width="34" height="44" viewBox="0 0 34 44" xmlns="http://www.w3.org/2000/svg">
  <path d="M17 0C7.6 0 0 7.6 0 17c0 12.7 17 27 17 27s17-14.3 17-27C34 7.6 26.4 0 17 0z" fill="#16241D"/>
  <path d="M17 2C8.7 2 2 8.7 2 17c0 11 15 24.3 15 24.3S32 28 32 17C32 8.7 25.3 2 17 2z" fill="#16241D" stroke="#CBA76F" stroke-width="1.5"/>
  <path d="M11 12.5h3v7.9l4.5-4.9h3.7l-4.9 5.2 5.3 6.8h-3.7l-4.5-4.9v4.9h-3z" fill="#CBA76F"/>
</svg>`

const pinIcon = L.divIcon({
  html: PIN_SVG,
  className: 'kp-pin', // keeps Leaflet from adding default styles
  iconSize: [34, 44],
  iconAnchor: [17, 44],
})

export default function ListingMap({
  lat,
  lng,
  label,
  height = 300,
  zoom = 14,
  draggable = false,
  onMove,
}: {
  lat: number
  lng: number
  label?: string
  height?: number
  zoom?: number
  draggable?: boolean
  onMove?: (lat: number, lng: number) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const onMoveRef = useRef(onMove)
  onMoveRef.current = onMove

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
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)
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
    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    <div
      ref={containerRef}
      style={{ height }}
      className="z-0 w-full overflow-hidden rounded-2xl border border-line"
      aria-label={label ? `Map showing ${label}` : 'Location map'}
    />
  )
}
