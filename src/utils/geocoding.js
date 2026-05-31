const NOMINATIM = "https://nominatim.openstreetmap.org/reverse"

export async function reverseGeocode(lat, lng) {
  const url = `${NOMINATIM}?lat=${lat}&lon=${lng}&format=json&addressdetails=1`

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Accept-Language": "bs,hr,sr,en",
    },
  })

  if (!response.ok) {
    throw new Error("Geocoding nije uspio.")
  }

  const data = await response.json()
  const addr = data.address || {}

  const city =
    addr.city ||
    addr.town ||
    addr.village ||
    addr.municipality ||
    addr.county ||
    ""

  const street = [addr.road, addr.house_number].filter(Boolean).join(" ")
  const address =
    street ||
    data.display_name?.split(",").slice(0, 2).join(", ") ||
    data.display_name ||
    ""

  return {
    city,
    address: data.display_name || address,
    shortAddress: address,
  }
}

/** Default coords for BiH objects without lat/lng */
export const CITY_COORDS = {
  Zenica: [44.2031, 17.9077],
  Sarajevo: [43.8563, 18.4131],
  Mostar: [43.3438, 17.8078],
  Tuzla: [44.5384, 18.6671],
}

export function getObjectCoords(object, index = 0) {
  if (object.lat != null && object.lng != null) {
    return [Number(object.lat), Number(object.lng)]
  }
  const base = CITY_COORDS[object.city] || [44.0, 17.5]
  const offset = index * 0.008
  return [base[0] + offset, base[1] + offset]
}
