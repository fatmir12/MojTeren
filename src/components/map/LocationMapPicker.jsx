import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

const DEFAULT_CENTER = [44.2031, 17.9077]
const DEFAULT_ZOOM = 8

function LocationMapPicker({ onLocationSelect, initialLat, initialLng }) {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const onLocationSelectRef = useRef(onLocationSelect)

  onLocationSelectRef.current = onLocationSelect

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const start =
      initialLat != null && initialLng != null
        ? [initialLat, initialLng]
        : DEFAULT_CENTER

    const map = L.map(mapContainerRef.current, {
      center: start,
      zoom: initialLat != null ? 15 : DEFAULT_ZOOM,
    })

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      maxZoom: 19,
    }).addTo(map)

    function placeMarker(lat, lng) {
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng])
      } else {
        markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map)
        markerRef.current.on("dragend", () => {
          const pos = markerRef.current.getLatLng()
          onLocationSelectRef.current?.({ lat: pos.lat, lng: pos.lng })
        })
      }
      onLocationSelectRef.current?.({ lat, lng })
    }

    map.on("click", (e) => {
      placeMarker(e.latlng.lat, e.latlng.lng)
    })

    if (initialLat != null && initialLng != null) {
      placeMarker(initialLat, initialLng)
    }

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [initialLat, initialLng])

  return (
    <div className="map-wrapper">
      <div ref={mapContainerRef} className="map-container map-container--picker" />
      <p className="map-hint">
        Kliknite na mapu da postavite pin lokacije terena. Pin možete povući za precizniji odabir.
      </p>
    </div>
  )
}

export default LocationMapPicker
