import { useEffect, useState } from "react"
import api from "../../services/api"
import { getHourlySlots, timeToMinutes } from "../../utils/slotUtils"

function Schedule() {
  const [terms, setTerms] = useState([])
  const [reservations, setReservations] = useState([])
  const [objects, setObjects] = useState([])

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10)
  )
  const [selectedObject, setSelectedObject] = useState("")

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      setLoading(true)

      const [termsResponse, reservationsResponse, objectsResponse] =
        await Promise.all([
          api.get("/terms"),
          api.get("/reservations"),
          api.get("/objects"),
        ])

      setTerms(termsResponse.data.data)
      setReservations(reservationsResponse.data.data)
      setObjects(objectsResponse.data.data)
    } catch {
      setError("Greška pri učitavanju rasporeda.")
    } finally {
      setLoading(false)
    }
  }

  function getScheduleForObject(objectName) {
    const objectTerms = terms.filter(
      (term) =>
        term.objectName === objectName &&
        (!selectedDate || term.date === selectedDate)
    )

    if (objectTerms.length === 0) return []

    const slots = []
    const dates = [...new Set(objectTerms.map((t) => t.date))].sort()

    dates.forEach((date) => {
      const term = objectTerms.find((t) => t.date === date)
      if (!term) return

      const hourly = getHourlySlots(
        terms,
        reservations,
        objectName,
        date,
        term.startTime,
        term.endTime
      )

      hourly.forEach((slot) => {
        const reservation = reservations.find(
          (r) =>
            r.objectName === objectName &&
            r.date === date &&
            r.status !== "CANCELLED" &&
            timeToMinutes(slot.startTime) >= timeToMinutes(r.startTime) &&
            timeToMinutes(slot.endTime) <= timeToMinutes(r.endTime)
        )

        slots.push({
          objectName,
          date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          status: slot.status,
          label: slot.label,
          userName: reservation?.userName || "—",
        })
      })
    })

    return slots
  }

  const targetObjects = selectedObject
    ? objects.filter((o) => o.name === selectedObject)
    : objects

  const allRows = targetObjects.flatMap((object) =>
    getScheduleForObject(object.name)
  )

  const occupancy =
    allRows.length > 0
      ? Math.round(
          (allRows.filter((r) => r.status === "RESERVED").length / allRows.length) *
            100
        )
      : 0

  if (loading) {
    return <div className="empty-state">Učitavanje rasporeda...</div>
  }

  return (
    <div>
      <h1 className="dashboard-title">Dnevni raspored i popunjenost</h1>

      {error && <div className="error-message">{error}</div>}

      <div className="dashboard-grid compact-stats">
        <div className="dashboard-card orange">
          <h3>Popunjenost</h3>
          <h1>{occupancy}%</h1>
        </div>
        <div className="dashboard-card blue">
          <h3>Satnica u rasporedu</h3>
          <h1>{allRows.length}</h1>
        </div>
      </div>

      <div className="object-form filters-form">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />

        <select
          value={selectedObject}
          onChange={(e) => setSelectedObject(e.target.value)}
        >
          <option value="">Svi objekti</option>
          {objects.map((object) => (
            <option key={object.id} value={object.name}>
              {object.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => {
            setSelectedDate(new Date().toISOString().slice(0, 10))
            setSelectedObject("")
          }}
        >
          Danas / svi
        </button>
      </div>

      {allRows.length === 0 ? (
        <div className="empty-state">
          Nema termina za odabrani datum i objekat.
        </div>
      ) : (
        <div className="terms-table">
          <table>
            <thead>
              <tr>
                <th>Objekat</th>
                <th>Datum</th>
                <th>Satnica</th>
                <th>Korisnik</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {allRows.map((row, index) => (
                <tr key={index}>
                  <td>{row.objectName}</td>
                  <td>{row.date}</td>
                  <td>
                    {row.startTime} – {row.endTime}
                  </td>
                  <td>{row.userName}</td>
                  <td>
                    <span
                      className={`status-badge ${row.status === "FREE" ? "free" : row.status === "LOCKED" ? "locked" : "reserved"}`}
                    >
                      {row.label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default Schedule
