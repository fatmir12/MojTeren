import { useEffect, useState } from "react"
import api from "../../services/api"
import {
  getWorkerHourlySlots,
  getObjectsForDate,
  getActiveReservationsForDay,
  getActiveReservationsForSlots,
} from "../../utils/slotUtils"
import { useToast } from "../../context/ToastContext"

function Terms() {
  const { toast } = useToast()
  const [terms, setTerms] = useState([])
  const [reservations, setReservations] = useState([])
  const [objects, setObjects] = useState([])

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10)
  )
  const [selectedObject, setSelectedObject] = useState("")

  const [weekObject, setWeekObject] = useState("")
  const [weekStartDate, setWeekStartDate] = useState(
    new Date().toISOString().slice(0, 10)
  )
  const [weekDays, setWeekDays] = useState(7)
  const [weekStartTime, setWeekStartTime] = useState("08:00")
  const [weekEndTime, setWeekEndTime] = useState("22:00")
  const [weekPrice, setWeekPrice] = useState("")

  const [showWeekForm, setShowWeekForm] = useState(false)
  const [lockModal, setLockModal] = useState(null)
  const [lockSubmitting, setLockSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  const hours = Array.from(
    { length: 15 },
    (_, i) => `${String(i + 8).padStart(2, "0")}:00`
  )

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      setLoading(true)

      const [termsResponse, objectsResponse, reservationsResponse] =
        await Promise.all([
          api.get("/terms"),
          api.get("/objects"),
          api.get("/reservations"),
        ])

      setTerms(termsResponse.data.data)
      setObjects(objectsResponse.data.data)
      setReservations(reservationsResponse.data.data)
    } catch {
      toast.error("Greška pri učitavanju podataka.")
    } finally {
      setLoading(false)
    }
  }

  async function handleAddWeek(e) {
    e.preventDefault()
    if (!weekObject || !weekStartDate || !weekStartTime || !weekEndTime || !weekPrice) {
      toast.error("Popunite sva polja za sedmični raspored.")
      return
    }

    try {
      const response = await api.post("/terms/week", {
        objectName: weekObject,
        startDate: weekStartDate,
        days: Number(weekDays),
        startTime: weekStartTime,
        endTime: weekEndTime,
        price: Number(weekPrice),
        status: "FREE",
      })

      await fetchData()
      toast.success(response.data.message)
      setShowWeekForm(false)
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Greška pri kreiranju sedmičnog rasporeda."
      )
    }
  }

  async function executeLockDay(term) {
    try {
      setLockSubmitting(true)
      const response = await api.post(`/terms/${term.id}/lock`)
      setLockModal(null)
      await fetchData()
      toast.success(response.data.message)
    } catch (err) {
      toast.error(err.response?.data?.message || "Greška pri zaključavanju dana.")
    } finally {
      setLockSubmitting(false)
    }
  }

  async function executeLockSlots(term, slots) {
    try {
      setLockSubmitting(true)
      const response = await api.post(`/terms/${term.id}/lock-slots`, {
        slots,
      })
      setLockModal(null)
      await fetchData()
      toast.success(response.data.message)
    } catch (err) {
      toast.error(err.response?.data?.message || "Greška pri zaključavanju sata.")
    } finally {
      setLockSubmitting(false)
    }
  }

  async function executeUnlockSlot(term, hourStart) {
    try {
      const response = await api.post(`/terms/${term.id}/unlock-slots`, {
        hourStart,
      })
      setTerms(terms.map((t) => (t.id === term.id ? response.data.data : t)))
      toast.success(response.data.message)
    } catch (err) {
      toast.error(err.response?.data?.message || "Greška pri oslobađanju sata.")
    }
  }

  function handleSlotClick(term, slot) {
    if (slot.status === "RESERVED") return

    if (slot.status === "LOCKED") {
      if (
        window.confirm(
          `Osloboditi sat ${slot.startTime}–${slot.endTime} za ${term.objectName}?`
        )
      ) {
        executeUnlockSlot(term, slot.startTime)
      }
      return
    }

    if (slot.status === "FREE") {
      const active = getActiveReservationsForSlots(
        reservations,
        term.objectName,
        term.date,
        [slot.startTime]
      )

      if (active.length > 0) {
        setLockModal({
          term,
          activeReservations: active,
          slotsToLock: [slot.startTime],
          mode: "slot",
        })
        return
      }

      if (
        window.confirm(
          `Zaključati sat ${slot.startTime}–${slot.endTime}? Teren neće biti dostupan za rezervaciju u tom terminu.`
        )
      ) {
        executeLockSlots(term, [slot.startTime])
      }
    }
  }

  function handleLockDay(term) {
    const active = getActiveReservationsForDay(
      reservations,
      term.objectName,
      term.date
    )

    if (active.length === 0) {
      const confirmed = window.confirm(
        `Zaključati dan za ${term.objectName} (${term.date})?\n\nTeren neće biti dostupan za nove rezervacije.`
      )
      if (confirmed) {
        executeLockDay(term)
      }
      return
    }

    setLockModal({ term, activeReservations: active, mode: "day" })
  }

  async function unlockDay(term) {
    try {
      const response = await api.put(`/terms/${term.id}`, {
        objectName: term.objectName,
        date: term.date,
        startTime: term.startTime,
        endTime: term.endTime,
        price: term.price,
        status: "FREE",
        lockedSlots: [],
      })

      setTerms(terms.map((t) => (t.id === term.id ? response.data.data : t)))
      toast.success(
        `Dan za ${term.objectName} je oslobođen – ponovo dostupan za rezervacije.`
      )
    } catch (err) {
      toast.error(err.response?.data?.message || "Greška pri oslobađanju dana.")
    }
  }

  const partialLockedCount = (term) => (term?.lockedSlots || []).length

  const objectsForDay = getObjectsForDate(terms, objects, selectedDate)
  const displayObjects = selectedObject
    ? objectsForDay.filter((o) => o.name === selectedObject)
    : objectsForDay

  function getDayStats(objectName) {
    const slots = getWorkerHourlySlots(
      terms,
      reservations,
      objectName,
      selectedDate
    )

    return {
      total: slots.length,
      free: slots.filter((s) => s.status === "FREE").length,
      reserved: slots.filter((s) => s.status === "RESERVED").length,
      locked: slots.filter((s) => s.status === "LOCKED").length,
      slots,
    }
  }

  const allSlotsForDay = displayObjects.flatMap((o) =>
    getWorkerHourlySlots(terms, reservations, o.name, selectedDate)
  )

  const daySummary = {
    free: allSlotsForDay.filter((s) => s.status === "FREE").length,
    reserved: allSlotsForDay.filter((s) => s.status === "RESERVED").length,
    locked: allSlotsForDay.filter((s) => s.status === "LOCKED").length,
  }

  if (loading) {
    return <div className="empty-state">Učitavanje termina...</div>
  }

  return (
    <div>
      <h1 className="dashboard-title">Upravljanje terminima</h1>

      <div className="worker-day-toolbar">
        <div className="object-form filters-form worker-filters">
          <div className="form-field">
            <label>Datum</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label>Objekat</label>
            <select
              value={selectedObject}
              onChange={(e) => setSelectedObject(e.target.value)}
            >
              <option value="">Svi objekti</option>
              {objectsForDay.map((object) => (
                <option key={object.id} value={object.name}>
                  {object.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setSelectedDate(new Date().toISOString().slice(0, 10))
              setSelectedObject("")
            }}
          >
            Danas
          </button>

          <button
            type="button"
            className="edit-btn"
            onClick={() => setShowWeekForm(!showWeekForm)}
          >
            {showWeekForm ? "Zatvori generisanje" : "+ Generiši sedmicu"}
          </button>
        </div>

        {allSlotsForDay.length > 0 && (
          <div className="day-summary-chips">
            <span className="summary-chip summary-chip--free">
              {daySummary.free} slobodno
            </span>
            <span className="summary-chip summary-chip--reserved">
              {daySummary.reserved} rezervisano
            </span>
            {daySummary.locked > 0 && (
              <span className="summary-chip summary-chip--locked">
                {daySummary.locked} zaključano
              </span>
            )}
          </div>
        )}
      </div>

      {showWeekForm && (
        <section className="report-section week-bulk-section">
          <h2>Generisanje termina za sedmicu</h2>
          <p className="section-hint">
            Kreira termine za odabrani broj dana od početnog datuma.
          </p>
          <form className="object-form" onSubmit={handleAddWeek}>
            <select
              value={weekObject}
              onChange={(e) => setWeekObject(e.target.value)}
            >
              <option value="">Odaberite objekat</option>
              {objects.map((object) => (
                <option key={object.id} value={object.name}>
                  {object.name}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={weekStartDate}
              onChange={(e) => setWeekStartDate(e.target.value)}
            />

            <select
              value={weekDays}
              onChange={(e) => setWeekDays(e.target.value)}
            >
              <option value={7}>7 dana</option>
              <option value={5}>5 dana</option>
              <option value={3}>3 dana</option>
            </select>

            <select
              value={weekStartTime}
              onChange={(e) => setWeekStartTime(e.target.value)}
            >
              {hours.map((hour) => (
                <option key={hour} value={hour}>
                  Od {hour}
                </option>
              ))}
            </select>

            <select
              value={weekEndTime}
              onChange={(e) => setWeekEndTime(e.target.value)}
            >
              {hours.map((hour) => (
                <option key={`end-${hour}`} value={hour}>
                  Do {hour}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Cijena KM/h"
              value={weekPrice}
              onChange={(e) => setWeekPrice(e.target.value)}
            />

            <button type="submit" className="edit-btn">
              Generiši sedmicu
            </button>
          </form>
        </section>
      )}

      <div className="week-legend">
        <span className="legend-item legend-available">Slobodno</span>
        <span className="legend-item legend-full">Rezervisano</span>
        <span className="legend-item legend-partial">Zaključano</span>
      </div>
      <p className="section-hint worker-slot-hint">
        Kliknite <strong>slobodan</strong> sat da ga zaključate, ili{" "}
        <strong>zaključan</strong> da ga oslobodite. „Zaključaj dan” blokira cijeli dan.
      </p>

      <h2 className="subsection-title">
        Satnice za {selectedDate}
        {selectedObject ? ` – ${selectedObject}` : ""}
      </h2>

      {displayObjects.length === 0 ? (
        <div className="empty-state">
          Za odabrani datum nema kreiranih termina
          {selectedObject ? ` na objektu ${selectedObject}` : ""}.
        </div>
      ) : (
        <div className="worker-day-schedule">
          {displayObjects.map((object) => {
            const stats = getDayStats(object.name)
            const term = terms.find(
              (t) => t.objectName === object.name && t.date === selectedDate
            )
            const pendingReservations = term
              ? getActiveReservationsForDay(
                  reservations,
                  object.name,
                  selectedDate
                )
              : []

            return (
              <article className="court-card worker-object-day" key={object.id}>
                {term?.status === "LOCKED" && (
                  <div className="day-locked-banner">
                    Cijeli dan je zaključan – nema novih online rezervacija
                  </div>
                )}

                {term?.status !== "LOCKED" && partialLockedCount(term) > 0 && (
                  <div className="day-partial-banner">
                    Djelimično zaključano: {partialLockedCount(term)} sat(a)
                  </div>
                )}

                {term?.status !== "LOCKED" && pendingReservations.length > 0 && (
                  <div className="day-pending-banner">
                    {pendingReservations.length} aktivna rezervacija na ovom danu
                  </div>
                )}

                <div className="court-card-header">
                  <div>
                    <h3>{object.name}</h3>
                    <p className="court-meta">
                      {object.city} · {object.sport}
                      {term && (
                        <>
                          {" "}
                          · {term.startTime}–{term.endTime} · {term.price} KM/h
                        </>
                      )}
                    </p>
                    <div className="object-day-stats">
                      <span>{stats.free} slobodno</span>
                      <span>{stats.reserved} rezervisano</span>
                      {stats.locked > 0 && (
                        <span>{stats.locked} zaključano</span>
                      )}
                    </div>
                  </div>

                  {term && (
                    <div className="term-admin-actions">
                      {term.status !== "LOCKED" && (
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => handleLockDay(term)}
                        >
                          Zaključaj dan
                        </button>
                      )}
                      {term.status === "LOCKED" && (
                        <button
                          type="button"
                          className="edit-btn"
                          onClick={() => unlockDay(term)}
                        >
                          Oslobodi dan
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {stats.slots.length === 0 ? (
                  <p className="section-hint">Nema satnica za prikaz.</p>
                ) : (
                  <div className="hourly-slots-grid worker-hourly-grid">
                    {stats.slots.map((slot) => (
                      <button
                        type="button"
                        key={slot.startTime}
                        disabled={slot.status === "RESERVED"}
                        className={`hourly-slot hourly-slot--${slot.status.toLowerCase()} ${
                          slot.status !== "RESERVED" ? "hourly-slot--interactive" : ""
                        }`}
                        onClick={() => term && handleSlotClick(term, slot)}
                        title={
                          slot.status === "FREE"
                            ? "Klik za zaključavanje sata"
                            : slot.status === "LOCKED"
                              ? "Klik za oslobađanje sata"
                              : undefined
                        }
                      >
                        <span className="hourly-slot-time">
                          {slot.startTime} – {slot.endTime}
                        </span>
                        <span className="hourly-slot-status">{slot.label}</span>
                        {slot.userName && (
                          <span className="hourly-slot-user">{slot.userName}</span>
                        )}
                        {slot.reservation && (
                          <span className="hourly-slot-price">
                            {slot.reservation.totalPrice} KM
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}

      {lockModal && (
        <div
          className="reservation-modal-overlay"
          onClick={() => !lockSubmitting && setLockModal(null)}
        >
          <div
            className="reservation-modal small-modal lock-confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="reservation-modal-header">
              <h2>
                {lockModal.mode === "slot"
                  ? "Zaključavanje sata"
                  : "Zaključavanje dana"}
              </h2>
              <button
                type="button"
                className="delete-btn"
                disabled={lockSubmitting}
                onClick={() => setLockModal(null)}
              >
                Zatvori
              </button>
            </div>

            <p className="section-hint">
              Za <strong>{lockModal.term.objectName}</strong> na{" "}
              <strong>{lockModal.term.date}</strong>
              {lockModal.mode === "slot" && lockModal.slotsToLock?.length > 0 && (
                <>
                  {" "}
                  – sat <strong>{lockModal.slotsToLock[0]}</strong>
                </>
              )}{" "}
              postoji {lockModal.activeReservations.length} aktivnih rezervacija u
              tom periodu. One će biti otkazane; korisnici dobijaju obavijest (povrat
              prema pravilu 24h).
            </p>

            <ul className="lock-reservation-list">
              {lockModal.activeReservations.map((r) => (
                <li key={r.id}>
                  <strong>{r.userName}</strong>
                  <span>
                    {r.startTime}–{r.endTime} · {r.totalPrice} KM
                  </span>
                </li>
              ))}
            </ul>

            <div className="action-buttons-row">
              <button
                type="button"
                disabled={lockSubmitting}
                onClick={() => setLockModal(null)}
              >
                Odustani
              </button>
              <button
                type="button"
                className="delete-btn"
                disabled={lockSubmitting}
                onClick={() =>
                  lockModal.mode === "slot"
                    ? executeLockSlots(lockModal.term, lockModal.slotsToLock)
                    : executeLockDay(lockModal.term)
                }
              >
                {lockSubmitting
                  ? "Zaključavanje..."
                  : "Potvrdi zaključavanje"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Terms
