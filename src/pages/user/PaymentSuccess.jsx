import { useEffect, useState } from "react"
import { useSearchParams, Link } from "react-router-dom"
import api from "../../services/api"
import { useAuth } from "../../context/AuthContext"

const PAYMENT_IN_PROGRESS_KEY = "mojteren_payment_in_progress"
const PAYMENT_FAILED_KEY = "mojteren_payment_failed"

function PaymentSuccess() {
  const { refreshUser } = useAuth()
  const [searchParams] = useSearchParams()
  const reservationId = Number(searchParams.get("reservationId"))
  const sessionId = searchParams.get("session_id")

  const [status, setStatus] = useState("loading")
  const [reservation, setReservation] = useState(null)

  useEffect(() => {
    sessionStorage.removeItem(PAYMENT_IN_PROGRESS_KEY)
    sessionStorage.removeItem(PAYMENT_FAILED_KEY)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function confirmAndLoad() {
      if (!reservationId) {
        setStatus("error")
        return
      }

      try {
        if (sessionId) {
          await api.post("/payments/verify-session", {
            reservationId,
            sessionId,
          })
        }

        const r = await api.get("/reservations")
        const found = r.data.data.find((x) => x.id === reservationId)
        if (cancelled) return

        if (found?.status === "CONFIRMED") {
          setReservation(found)
          setStatus("confirmed")
          refreshUser()
          return
        }

        if (found?.status === "CANCELLED") {
          setReservation(found)
          setStatus("cancelled")
          return
        }

        setStatus("pending")
      } catch (err) {
        if (cancelled) return

        if (err.response?.status === 402) {
          setStatus("failed")
          return
        }

        setStatus("pending")
      }
    }

    confirmAndLoad()
    return () => {
      cancelled = true
    }
  }, [reservationId, sessionId, refreshUser])

  if (status === "loading") {
    return (
      <div className="stripe-success-page">
        <div className="empty-state">Provjeravamo status plaćanja...</div>
      </div>
    )
  }

  if (status === "confirmed" && reservation) {
    return (
      <div className="stripe-success-page">
        <div className="stripe-success-card">
          <div className="stripe-success-icon">✓</div>
          <h1>Plaćanje uspješno!</h1>
          <p>Vaša rezervacija je potvrđena.</p>

          <div className="stripe-success-details">
            <p>
              <strong>Teren:</strong> {reservation.objectName}
            </p>
            <p>
              <strong>Datum:</strong> {reservation.date}
            </p>
            <p>
              <strong>Vrijeme:</strong> {reservation.startTime}–{reservation.endTime}
            </p>
            <p>
              <strong>Ukupno plaćeno:</strong> {reservation.totalPrice} KM
            </p>
            {reservation.loyaltyEarned > 0 && (
              <p>
                <strong>Loyalty bodovi:</strong> +{reservation.loyaltyEarned}
              </p>
            )}
          </div>

          <div className="stripe-success-actions">
            <Link to="/user/history" className="edit-btn">
              Pogledaj historiju
            </Link>
            <Link to="/user/courts" className="btn-secondary inline-link-btn">
              Nazad na terene
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (status === "failed") {
    return (
      <div className="stripe-success-page">
        <div className="stripe-success-card">
          <div className="error-message">
            Neuspješno plaćanje. Pokušajte ponovo.
          </div>
          <p className="section-hint">
            Vratite se na Stripe checkout i pokušajte s test karticom{" "}
            <code>4242 4242 4242 4242</code>.
          </p>
          <Link to="/user/courts" className="edit-btn inline-link-btn">
            Nazad na terene
          </Link>
        </div>
      </div>
    )
  }

  if (status === "cancelled") {
    return (
      <div className="stripe-success-page">
        <div className="stripe-success-card">
          <div className="error-message">
            Rezervacija je otkazana (istekao lock ili plaćanje nije završeno).
          </div>
          <Link to="/user/courts" className="edit-btn inline-link-btn">
            Nazad na terene
          </Link>
        </div>
      </div>
    )
  }

  if (status === "pending") {
    return (
      <div className="stripe-success-page">
        <div className="stripe-success-card">
          <h1>Još čekamo potvrdu</h1>
          <p className="section-hint">
            Osvježite stranicu ili provjerite historiju rezervacija.
          </p>
          <Link to="/user/history" className="edit-btn inline-link-btn">
            Historija rezervacija
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="stripe-success-page">
      <div className="stripe-success-card">
        <div className="error-message">Neispravan link za plaćanje.</div>
        <Link to="/user/courts" className="edit-btn inline-link-btn">
          Nazad na terene
        </Link>
      </div>
    </div>
  )
}

export default PaymentSuccess
