import { Navigate, useSearchParams } from "react-router-dom"

/** Stara ruta – preusmjerava na Tereni i rezervacije */
function Reservation() {
  const [searchParams] = useSearchParams()
  const objectId = searchParams.get("objectId")
  const date = searchParams.get("date")

  const query = new URLSearchParams()
  if (objectId) query.set("objectId", objectId)
  if (date) query.set("date", date)

  const suffix = query.toString() ? `?${query.toString()}` : ""

  return <Navigate to={`/user/courts${suffix}`} replace />
}

export default Reservation
