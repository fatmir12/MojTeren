<<<<<<< HEAD
import { useEffect, useRef, useState } from "react"
=======
import { useEffect, useState } from "react"
>>>>>>> 4ffb565aaf6b17a6fe10e4e498a6a39ffe35c473
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

<<<<<<< HEAD
const PAYMENT_IN_PROGRESS_KEY = "mojteren_payment_in_progress"
const PAYMENT_FAILED_KEY = "mojteren_payment_failed"

=======
>>>>>>> 4ffb565aaf6b17a6fe10e4e498a6a39ffe35c473
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
<<<<<<< HEAD
=======
  onSuccess,
  onLoyaltyEarned,
>>>>>>> 4ffb565aaf6b17a6fe10e4e498a6a39ffe35c473
}) {
  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [rangeStart, setRangeStart] = useState("08:00")
  const [rangeEnd, setRangeEnd] = useState("22:00")
  const [selectedStart, setSelectedStart] = useState("")
  const [selectedEnd, setSelectedEnd] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

<<<<<<< HEAD
  const pendingReservationIdRef = useRef(null)
  const redirectingRef = useRef(false)

=======
>>>>>>> 4ffb565aaf6b17a6fe10e4e498a6a39ffe35c473
  useEffect(() => {
    if (isOpen) {
      setSelectedDate(initialDate)
      setSelectedStart(initialStart)
      setSelectedEnd(initialEnd)
      setError("")
<<<<<<< HEAD
      pendingReservationIdRef.current = null
      redirectingRef.current = false
=======
>>>>>>> 4ffb565aaf6b17a6fe10e4e498a6a39ffe35c473

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

<<<<<<< HEAD
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

=======
>>>>>>> 4ffb565aaf6b17a6fe10e4e498a6a39ffe35c473
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
<<<<<<< HEAD
      setError("")

      const response = await api.post("/payments/start", {
=======

      const response = await api.post("/reservations", {
>>>>>>> 4ffb565aaf6b17a6fe10e4e498a6a39ffe35c473
        userName: currentUser.name,
        objectName: object.name,
        date: selectedDate,
        startTime: selectedStart,
        endTime: selectedEnd,
        pricePerHour: bookingPrice,
<<<<<<< HEAD
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
=======
        status: "CONFIRMED",
      })

      const loyaltyMsg = response.data.loyaltyEarned
        ? ` +${response.data.loyaltyEarned} loyalty bodova.`
        : ""

      onLoyaltyEarned?.(response.data.loyaltyPoints)

      onSuccess(
        `Rezervacija je potvrđena: ${response.data.data.objectName}, ${response.data.data.date}, ${response.data.data.startTime}–${response.data.data.endTime}. Ukupno: ${response.data.data.totalPrice} KM.${loyaltyMsg}`
      )
      onClose()
    } catch (err) {
      setError(
        err.response?.data?.message || "Greška pri kreiranju rezervacije."
      )
>>>>>>> 4ffb565aaf6b17a6fe10e4e498a6a39ffe35c473
    } finally {
      setSubmitting(false)
    }
  }

  return (
<<<<<<< HEAD
    <div className="reservation-modal-overlay" onClick={handleClose}>
      <div className="reservation-modal" onClick={(e) => e.stopPropagation()}>
        <div className="reservation-modal-header">
          <h2>Rezervacija – {object.name}</h2>
          <button className="delete-btn" type="button" onClick={handleClose}>
=======
    <div className="reservation-modal-overlay" onClick={onClose}>
      <div
        className="reservation-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="reservation-modal-header">
          <h2>Rezervacija – {object.name}</h2>
          <button className="delete-btn" type="button" onClick={onClose}>
>>>>>>> 4ffb565aaf6b17a6fe10e4e498a6a39ffe35c473
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

<<<<<<< HEAD
        <p className="section-hint lock-hint">
          Real-time lock (5 min) aktivira se tek kada kliknete Plati / Rezerviši.
        </p>

=======
>>>>>>> 4ffb565aaf6b17a6fe10e4e498a6a39ffe35c473
        {error && <div className="error-message">{error}</div>}

        <div className="week-days-label">Odaberite datum</div>
        <div className="week-days-scroll">
<<<<<<< HEAD
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
=======
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
>>>>>>> 4ffb565aaf6b17a6fe10e4e498a6a39ffe35c473
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
<<<<<<< HEAD
            Za ovaj datum nema definiranih termina.
=======
            Za ovaj datum nema definisanih termina.
>>>>>>> 4ffb565aaf6b17a6fe10e4e498a6a39ffe35c473
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
<<<<<<< HEAD
                    selectedStart === slot.startTime && selectedEnd === slot.endTime
=======
                    selectedStart === slot.startTime &&
                    selectedEnd === slot.endTime
>>>>>>> 4ffb565aaf6b17a6fe10e4e498a6a39ffe35c473
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
<<<<<<< HEAD
                            <option key={`start-${block.startTime}-${time}`} value={time}>
=======
                            <option
                              key={`start-${block.startTime}-${time}`}
                              value={time}
                            >
>>>>>>> 4ffb565aaf6b17a6fe10e4e498a6a39ffe35c473
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
<<<<<<< HEAD
                            <option key={`end-${block.endTime}-${time}`} value={time}>
=======
                            <option
                              key={`end-${block.endTime}-${time}`}
                              value={time}
                            >
>>>>>>> 4ffb565aaf6b17a6fe10e4e498a6a39ffe35c473
                              {time}
                            </option>
                          ))
                      )}
                    </select>
                  </div>
                </div>

                {selectedStart && selectedEnd && (
                  <p className="price-summary">
<<<<<<< HEAD
                    <strong>Ukupno:</strong> {calculateTotalPrice()} KM ({bookingPrice} KM/h)
=======
                    <strong>Ukupno:</strong> {calculateTotalPrice()} KM (
                    {bookingPrice} KM/h)
>>>>>>> 4ffb565aaf6b17a6fe10e4e498a6a39ffe35c473
                  </p>
                )}

                <button
                  className="edit-btn reserve-submit-btn"
                  type="button"
                  onClick={handleReserve}
                  disabled={submitting}
                >
<<<<<<< HEAD
                  {submitting ? "Priprema plaćanja..." : "Plati / Rezerviši"}
=======
                  {submitting ? "Rezervacija..." : "Potvrdi rezervaciju"}
>>>>>>> 4ffb565aaf6b17a6fe10e4e498a6a39ffe35c473
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
