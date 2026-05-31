import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { getObjectCoords } from "../../utils/geocoding"

function CourtsMap({ objects, selectedId, onSelect }) {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const onSelectRef = useRef(onSelect)

  onSelectRef.current = onSelect

  useEffect(() => {
    if (!mapContainerRef.current) return

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        center: [44.0, 17.8],
        zoom: 8,
      })

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OSM',
        maxZoom: 19,
      }).addTo(mapRef.current)
    }

    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    objects.forEach((object, index) => {
      const [lat, lng] = getObjectCoords(object, index)
      const isSelected = selectedId === object.id

      const marker = L.circleMarker([lat, lng], {
        radius: isSelected ? 12 : 9,
        color: isSelected ? "#0f766e" : "#0d9488",
        fillColor: isSelected ? "#14b8a6" : "#0d9488",
        fillOpacity: 0.9,
        weight: isSelected ? 3 : 2,
      }).addTo(mapRef.current)

      marker.on("click", () => onSelectRef.current?.(object))
      marker.bindTooltip(object.name, { direction: "top", offset: [0, -8] })
      markersRef.current.push(marker)
    })

    if (objects.length > 0) {
      const bounds = L.latLngBounds(
        objects.map((obj, i) => getObjectCoords(obj, i))
      )
      mapRef.current.fitBounds(bounds.pad(0.2))
    }

    return () => {
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []
    }
  }, [objects, selectedId])

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  return (
    <div className="map-wrapper map-wrapper--courts">
      <div ref={mapContainerRef} className="map-container map-container--courts" />
    </div>
  )
}

export default CourtsMap
