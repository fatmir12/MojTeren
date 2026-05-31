import { useEffect, useRef, useState } from "react"
import api from "../../services/api"
import {
  timeToMinutes,
  getTimeOptions,
  getHourlySlots,
  getOperatingWindow,
  getFreeBookingSlots,
  getNext7Days,
  getDayAvailability,
} from "../../utils/slotUtils"

const PAYMENT_IN_PROGRESS_KEY = "mojteren_payment_in_progress"
const PAYMENT_FAILED_KEY = "mojteren_payment_failed"

function BookingModal({
  object,
  terms,
  reservations,
  currentUser,
  initialDate = "",
  initialStart = "",
  initialEnd = "",
  isOpen,
  onClose,
  onSuccess,
  onLoyaltyEarned,}) {
  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [rangeStart, setRangeStart] = useState("08:00")
  const [rangeEnd, setRangeEnd] = useState("22:00")
  const [selectedStart, setSelectedStart] = useState("")
  const [selectedEnd, setSelectedEnd] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const pendingReservationIdRef = useRef(null)
  const redirectingRef = useRef(false)

  useEffect(() => {
    if (isOpen) {
      setSelectedDate(initialDate)
      setSelectedStart(initialStart)
      setSelectedEnd(initialEnd)
      setError("")
      pendingReservationIdRef.current = null
      redirectingRef.current = false

      if (initialDate && object) {
        const window = getOperatingWindow(terms, object.name, initialDate)
        setRangeStart(window.startTime)
        setRangeEnd(window.endTime)
      } else {
        setRangeStart("08:00")
        setRangeEnd("22:00")
      }
    }
  }, [isOpen, initialDate, initialStart, initialEnd, object, terms])

  if (!isOpen || !object) return null

  const next7Days = getNext7Days()

  function handleDateChange(date) {
    setSelectedDate(date)
    setSelectedStart("")
    setSelectedEnd("")

    if (date) {
      const window = getOperatingWindow(terms, object.name, date)
      setRangeStart(window.startTime)
      setRangeEnd(window.endTime)
    }
  }

  const hourlySlots = selectedDate
    ? getHourlySlots(
        terms,
        reservations,
        object.name,
        selectedDate,
        rangeStart,
        rangeEnd
      )
    : []

  const freeBookingSlots = selectedDate
    ? getFreeBookingSlots(terms, reservations, object.name, selectedDate)
    : []

  const bookingPrice =
    freeBookingSlots.find(
      (slot) =>
        selectedStart &&
        selectedEnd &&
        timeToMinutes(selectedStart) >= timeToMinutes(slot.startTime) &&
        timeToMinutes(selectedEnd) <= timeToMinutes(slot.endTime)
    )?.price ?? freeBookingSlots[0]?.price ?? 0

  const rangeOptions = selectedDate
    ? getTimeOptions(
        getOperatingWindow(terms, object.name, selectedDate).startTime,
        getOperatingWindow(terms, object.name, selectedDate).endTime
      )
    : getTimeOptions("08:00", "22:00")

  function handleHourClick(slot) {
    if (slot.status !== "FREE") return
    setSelectedStart(slot.startTime)
    setSelectedEnd(slot.endTime)
    setError("")
  }

  function calculateTotalPrice() {
    if (!selectedStart || !selectedEnd) return 0
    const hours = (timeToMinutes(selectedEnd) - timeToMinutes(selectedStart)) / 60
    return hours * bookingPrice
  }

  async function abandonPendingReservation() {
    const reservationId = pendingReservationIdRef.current
    if (!reservationId) return

    const inProgress = sessionStorage.getItem(PAYMENT_IN_PROGRESS_KEY)
    const paymentFailed = sessionStorage.getItem(PAYMENT_FAILED_KEY)

    if (redirectingRef.current || inProgress === String(reservationId) || paymentFailed === String(reservationId)) {
      return
    }

    try {
      await api.post("/payments/abandon", {
        reservationId,
        userName: currentUser.name,
      })
    } catch {
      // ignore
    } finally {
      pendingReservationIdRef.current = null
    }
  }

  async function handleClose() {
    await abandonPendingReservation()
    onClose()
  }

  async function handleReserve() {
    if (!selectedDate || !selectedStart || !selectedEnd) {
      setError("Odaberite datum i vremenski period (od–do).")
      return
    }

    if (timeToMinutes(selectedStart) >= timeToMinutes(selectedEnd)) {
      setError("Vrijeme početka mora biti prije kraja.")
      return
    }

    try {
      setSubmitting(true)
      setError("")

      const response = await api.post("/payments/start", {
        userName: currentUser.name,
        objectName: object.name,
        date: selectedDate,
        startTime: selectedStart,
        endTime: selectedEnd,
        pricePerHour: bookingPrice,
      })

      const reservationId = response.data.data.reservationId
      const url = response.data.data.checkoutUrl || response.data.data.paymentUrl

      if (!reservationId || !url) {
        if (reservationId) {
          await api.post("/payments/abandon", {
            reservationId,
            userName: currentUser.name,
          })
        }
        setError("Greška: nije vraćen link za plaćanje.")
        return
      }

      pendingReservationIdRef.current = reservationId
      redirectingRef.current = true
      sessionStorage.setItem(PAYMENT_IN_PROGRESS_KEY, String(reservationId))
      sessionStorage.removeItem(PAYMENT_FAILED_KEY)
      window.location.assign(url)
    } catch (err) {
      setError(err.response?.data?.message || "Greška pri kreiranju rezervacije.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="reservation-modal-overlay" onClick={handleClose}>
      <div className="reservation-modal" onClick={(e) => e.stopPropagation()}>
        <div className="reservation-modal-header">
          <h2>Rezervacija – {object.name}</h2>
          <button className="delete-btn" type="button" onClick={handleClose}>
            Zatvori
          </button>
        </div>

        <div className="reservation-info">
          <p>
            <strong>Grad:</strong> {object.city}
          </p>
          <p>
            <strong>Sport:</strong> {object.sport}
          </p>
          {selectedDate && (
            <p>
              <strong>Datum:</strong> {selectedDate}
            </p>
          )}
        </div>

        <p className="section-hint lock-hint">
          Real-time lock (5 min) aktivira se tek kada kliknete Plati / Rezerviši.
        </p>

        {error && <div className="error-message">{error}</div>}

        <div className="week-days-label">Odaberite datum</div>
        <div className="week-days-scroll">
          <div className="week-days-row week-days-row--modal">
            {next7Days.map((day) => {
              const availability = getDayAvailability(
                terms,
                reservations,
                object.name,
                day.date
              )

              return (
                <button
                  key={day.date}
                  type="button"
                  className={`day-chip day-chip--${availability.status} ${
                    day.isToday ? "day-chip--today" : ""
                  } ${selectedDate === day.date ? "day-chip--selected" : ""}`}
                  onClick={() => handleDateChange(day.date)}
                >
                  <span className="day-chip-name">{day.dayName}</span>
                  <span className="day-chip-date">
                    {day.dayNumber}.{day.month}.
                  </span>
                  <span className="day-chip-status">{availability.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="reservation-form-grid">
          <div className="form-field">
            <label>Vrijeme od (pregled)</label>
            <select
              value={rangeStart}
              onChange={(e) => setRangeStart(e.target.value)}
              disabled={!selectedDate}
            >
              {rangeOptions.slice(0, -1).map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>Vrijeme do (pregled)</label>
            <select
              value={rangeEnd}
              onChange={(e) => setRangeEnd(e.target.value)}
              disabled={!selectedDate}
            >
              {rangeOptions
                .filter((time) => timeToMinutes(time) > timeToMinutes(rangeStart))
                .map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {!selectedDate ? (
          <div className="empty-state modal-empty">
            Odaberite jedan od datuma iznad da vidite satnice.
          </div>
        ) : hourlySlots.length === 0 ? (
          <div className="empty-state modal-empty">
            Za ovaj datum nema definiranih termina.
          </div>
        ) : (
          <>
            <h3 className="slots-title">Satnice za {selectedDate}</h3>
            <p className="section-hint">
              Kliknite na slobodnu satnicu za brzi odabir ili ručno postavite period.
            </p>

            <div className="hourly-slots-grid hourly-slots-scroll">
              {hourlySlots.map((slot) => (
                <button
                  key={slot.startTime}
                  type="button"
                  className={`hourly-slot hourly-slot--${slot.status.toLowerCase()} ${
                    selectedStart === slot.startTime && selectedEnd === slot.endTime
                      ? "hourly-slot--selected"
                      : ""
                  }`}
                  disabled={slot.status !== "FREE"}
                  onClick={() => handleHourClick(slot)}
                >
                  <span className="hourly-slot-time">
                    {slot.startTime} – {slot.endTime}
                  </span>
                  <span className="hourly-slot-status">{slot.label}</span>
                </button>
              ))}
            </div>

            {freeBookingSlots.length > 0 && (
              <div className="booking-range-section">
                <h3>Period rezervacije (od – do)</h3>

                <div className="reservation-form-grid">
                  <div className="form-field">
                    <label>Od</label>
                    <select
                      value={selectedStart}
                      onChange={(e) => {
                        setSelectedStart(e.target.value)
                        setSelectedEnd("")
                      }}
                    >
                      <option value="">Odaberite početak</option>
                      {freeBookingSlots.flatMap((block) =>
                        getTimeOptions(block.startTime, block.endTime)
                          .slice(0, -1)
                          .map((time) => (
                            <option key={`start-${block.startTime}-${time}`} value={time}>
                              {time}
                            </option>
                          ))
                      )}
                    </select>
                  </div>

                  <div className="form-field">
                    <label>Do</label>
                    <select
                      value={selectedEnd}
                      onChange={(e) => setSelectedEnd(e.target.value)}
                      disabled={!selectedStart}
                    >
                      <option value="">Odaberite kraj</option>
                      {freeBookingSlots.flatMap((block) =>
                        getTimeOptions(block.startTime, block.endTime)
                          .filter(
                            (time) =>
                              !selectedStart ||
                              timeToMinutes(time) > timeToMinutes(selectedStart)
                          )
                          .map((time) => (
                            <option key={`end-${block.endTime}-${time}`} value={time}>
                              {time}
                            </option>
                          ))
                      )}
                    </select>
                  </div>
                </div>

                {selectedStart && selectedEnd && (
                  <p className="price-summary">
                    <strong>Ukupno:</strong> {calculateTotalPrice()} KM ({bookingPrice} KM/h)
                  </p>
                )}

                <button
                  className="edit-btn reserve-submit-btn"
                  type="button"
                  onClick={handleReserve}
                  disabled={submitting}
                >
                  {submitting ? "Priprema plaćanja..." : "Plati / Rezerviši"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default BookingModal
