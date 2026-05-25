import { useEffect, useState } from "react"
import api from "../../services/api"
import {
  timeToMinutes,
  getTimeOptions,
  getFreeBookingSlots,
} from "../../utils/slotUtils"

const STATUS_LABELS = {
  CONFIRMED: "Potvrđena",
  WAITING_PAYMENT: "Čeka plaćanje",
  CANCELLED: "Otkazana",
  CREATED: "Kreirana",
}

function Reservations() {
  const [objects, setObjects] = useState([])
  const [terms, setTerms] = useState([])
  const [reservations, setReservations] = useState([])

  const [filterDate, setFilterDate] = useState("")
  const [filterObject, setFilterObject] = useState("")
  const [filterUser, setFilterUser] = useState("")

  const [selectedReservation, setSelectedReservation] = useState(null)
  const [action, setAction] = useState("")
  const [cancelReason, setCancelReason] = useState("")

  const [editObject, setEditObject] = useState("")
  const [editDate, setEditDate] = useState("")
  const [editStart, setEditStart] = useState("")
  const [editEnd, setEditEnd] = useState("")

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      setLoading(true)

      const [objectsResponse, termsResponse, reservationsResponse] =
        await Promise.all([
          api.get("/objects"),
          api.get("/terms"),
          api.get("/reservations"),
        ])

      setObjects(objectsResponse.data.data)
      setTerms(termsResponse.data.data)
      setReservations(reservationsResponse.data.data)
    } catch {
      setError("Greška pri učitavanju rezervacija.")
    } finally {
      setLoading(false)
    }
  }

  const filteredReservations = reservations
    .filter((r) => (filterDate ? r.date === filterDate : true))
    .filter((r) => (filterObject ? r.objectName === filterObject : true))
    .filter((r) =>
      filterUser
        ? r.userName.toLowerCase().includes(filterUser.toLowerCase())
        : true
    )
    .sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date)
      return timeToMinutes(b.startTime) - timeToMinutes(a.startTime)
    })

  function openDetails(reservation) {
    setSelectedReservation(reservation)
    setAction("")
    setCancelReason("")
    setEditObject(reservation.objectName)
    setEditDate(reservation.date)
    setEditStart(reservation.startTime)
    setEditEnd(reservation.endTime)
    setError("")
    setSuccess("")
  }

  function closeDetails() {
    setSelectedReservation(null)
    setAction("")
    setCancelReason("")
    setError("")
  }

  function getEditFreeSlots() {
    if (!editObject || !editDate) return []

    const otherReservations = reservations.filter(
      (r) =>
        r.id !== selectedReservation?.id &&
        r.status !== "CANCELLED"
    )

    return getFreeBookingSlots(terms, otherReservations, editObject, editDate)
  }

  async function handleCancel() {
    if (!cancelReason.trim()) {
      setError("Unesi razlog otkazivanja.")
      return
    }

    try {
      await api.put(`/reservations/${selectedReservation.id}`, {
        ...selectedReservation,
        status: "CANCELLED",
        cancelReason,
      })

      setSuccess(
        `Rezervacija otkazana. Korisnik ${selectedReservation.userName} će biti obaviješten.`
      )
      closeDetails()
      await fetchData()
    } catch (err) {
      setError(err.response?.data?.message || "Greška pri otkazivanju.")
    }
  }

  async function handleModify() {
    if (!editObject || !editDate || !editStart || !editEnd) {
      setError("Popunite sve podatke za izmjenu.")
      return
    }

    if (timeToMinutes(editStart) >= timeToMinutes(editEnd)) {
      setError("Početak mora biti prije kraja.")
      return
    }

    const freeSlots = getEditFreeSlots()
    const fitsInFreeBlock = freeSlots.some(
      (slot) =>
        timeToMinutes(editStart) >= timeToMinutes(slot.startTime) &&
        timeToMinutes(editEnd) <= timeToMinutes(slot.endTime)
    )

    if (!fitsInFreeBlock) {
      setError("Novi termin nije slobodan. Odaberite drugi period.")
      return
    }

    const duration = (timeToMinutes(editEnd) - timeToMinutes(editStart)) / 60
    const pricePerHour = selectedReservation.pricePerHour

    try {
      await api.put(`/reservations/${selectedReservation.id}`, {
        objectName: editObject,
        date: editDate,
        startTime: editStart,
        endTime: editEnd,
        duration,
        pricePerHour,
        totalPrice: pricePerHour * duration,
        status: selectedReservation.status,
      })

      setSuccess(
        `Rezervacija izmijenjena. Korisnik ${selectedReservation.userName} obaviješten o promjeni.`
      )
      closeDetails()
      await fetchData()
    } catch (err) {
      setError(err.response?.data?.message || "Greška pri izmjeni.")
    }
  }

  if (loading) {
    return <div className="empty-state">Učitavanje rezervacija...</div>
  }

  return (
    <div>
      <h1 className="dashboard-title">Upravljanje rezervacijama</h1>

      {success && <div className="success-message">{success}</div>}
      {error && !selectedReservation && (
        <div className="error-message">{error}</div>
      )}

      <p className="section-hint">
        Pregledajte, filtrirajte i upravljajte rezervacijama. Odaberite rezervaciju za
        izmjenu termina ili otkazivanje uz obavijest korisniku.
      </p>

      <div className="object-form filters-form">
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          placeholder="Datum"
        />

        <select
          value={filterObject}
          onChange={(e) => setFilterObject(e.target.value)}
        >
          <option value="">Svi objekti</option>
          {objects.map((object) => (
            <option key={object.id} value={object.name}>
              {object.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Pretražite po korisniku"
          value={filterUser}
          onChange={(e) => setFilterUser(e.target.value)}
        />

        <button
          type="button"
          onClick={() => {
            setFilterDate("")
            setFilterObject("")
            setFilterUser("")
          }}
        >
          Očisti filtere
        </button>
      </div>

      {filteredReservations.length === 0 ? (
        <div className="empty-state">Nema rezervacija za prikaz.</div>
      ) : (
        <div className="terms-table">
          <table>
            <thead>
              <tr>
                <th>Korisnik</th>
                <th>Objekat</th>
                <th>Datum</th>
                <th>Vrijeme</th>
                <th>Cijena</th>
                <th>Status</th>
                <th>Akcija</th>
              </tr>
            </thead>
            <tbody>
              {filteredReservations.map((reservation) => (
                <tr key={reservation.id}>
                  <td>{reservation.userName}</td>
                  <td>{reservation.objectName}</td>
                  <td>{reservation.date}</td>
                  <td>
                    {reservation.startTime} – {reservation.endTime}
                  </td>
                  <td>{reservation.totalPrice} KM</td>
                  <td>
                    <span
                      className={`status-badge ${reservation.status.toLowerCase()}`}
                    >
                      {STATUS_LABELS[reservation.status] || reservation.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="edit-btn"
                      type="button"
                      onClick={() => openDetails(reservation)}
                    >
                      Upravljaj
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedReservation && (
        <div className="reservation-modal-overlay" onClick={closeDetails}>
          <div
            className="reservation-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="reservation-modal-header">
              <h2>Rezervacija #{selectedReservation.id}</h2>
              <button className="delete-btn" type="button" onClick={closeDetails}>
                Zatvori
              </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="reservation-info">
              <p>
                <strong>Korisnik:</strong> {selectedReservation.userName}
              </p>
              <p>
                <strong>Objekat:</strong> {selectedReservation.objectName}
              </p>
              <p>
                <strong>Datum:</strong> {selectedReservation.date}
              </p>
              <p>
                <strong>Vrijeme:</strong> {selectedReservation.startTime} –{" "}
                {selectedReservation.endTime}
              </p>
              <p>
                <strong>Ukupno:</strong> {selectedReservation.totalPrice} KM
              </p>
              <p>
                <strong>Status:</strong>{" "}
                {STATUS_LABELS[selectedReservation.status] ||
                  selectedReservation.status}
              </p>
            </div>

            {selectedReservation.status === "CANCELLED" ? (
              <div className="empty-state modal-empty">
                Ova rezervacija je već otkazana.
              </div>
            ) : !action ? (
              <div className="action-buttons-row">
                <button
                  className="edit-btn"
                  type="button"
                  onClick={() => setAction("modify")}
                >
                  Izmijeni termin
                </button>
                <button
                  className="delete-btn"
                  type="button"
                  onClick={() => setAction("cancel")}
                >
                  Otkaži rezervaciju
                </button>
              </div>
            ) : action === "cancel" ? (
              <div className="booking-range-section">
                <h3>Otkazivanje rezervacije</h3>
                <div className="form-field">
                  <label>Razlog otkazivanja</label>
                  <textarea
                    rows={3}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="npr. Otkaz od strane objekta, vremenski uslovi..."
                  />
                </div>
                <div className="action-buttons-row">
                  <button
                    type="button"
                    onClick={() => setAction("")}
                  >
                    Nazad
                  </button>
                  <button
                    className="delete-btn"
                    type="button"
                    onClick={handleCancel}
                  >
                    Potvrdi otkazivanje
                  </button>
                </div>
              </div>
            ) : (
              <div className="booking-range-section">
                <h3>Izmjena rezervacije</h3>

                <div className="reservation-form-grid">
                  <div className="form-field">
                    <label>Objekat</label>
                    <select
                      value={editObject}
                      onChange={(e) => setEditObject(e.target.value)}
                    >
                      {objects.map((object) => (
                        <option key={object.id} value={object.name}>
                          {object.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field">
                    <label>Datum</label>
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                    />
                  </div>

                  <div className="form-field">
                    <label>Od</label>
                    <select
                      value={editStart}
                      onChange={(e) => {
                        setEditStart(e.target.value)
                        setEditEnd("")
                      }}
                    >
                      <option value="">Početak</option>
                      {getEditFreeSlots().flatMap((block) =>
                        getTimeOptions(block.startTime, block.endTime)
                          .slice(0, -1)
                          .map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))
                      )}
                    </select>
                  </div>

                  <div className="form-field">
                    <label>Do</label>
                    <select
                      value={editEnd}
                      onChange={(e) => setEditEnd(e.target.value)}
                      disabled={!editStart}
                    >
                      <option value="">Kraj</option>
                      {getEditFreeSlots().flatMap((block) =>
                        getTimeOptions(block.startTime, block.endTime)
                          .filter(
                            (time) =>
                              timeToMinutes(time) > timeToMinutes(editStart)
                          )
                          .map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))
                      )}
                    </select>
                  </div>
                </div>

                <div className="action-buttons-row">
                  <button type="button" onClick={() => setAction("")}>
                    Nazad
                  </button>
                  <button
                    className="edit-btn"
                    type="button"
                    onClick={handleModify}
                  >
                    Sačuvaj izmjenu
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Reservations
