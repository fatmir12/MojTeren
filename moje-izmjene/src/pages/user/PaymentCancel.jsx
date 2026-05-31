import { useEffect } from "react"
import { Link, useSearchParams } from "react-router-dom"

const PAYMENT_IN_PROGRESS_KEY = "mojteren_payment_in_progress"
const PAYMENT_FAILED_KEY = "mojteren_payment_failed"

function PaymentCancel() {
  const [searchParams] = useSearchParams()
  const reservationId = searchParams.get("reservationId")

  useEffect(() => {
    if (reservationId) {
      sessionStorage.setItem(PAYMENT_FAILED_KEY, reservationId)
      sessionStorage.removeItem(PAYMENT_IN_PROGRESS_KEY)
    }
  }, [reservationId])

  return (
    <div>
      <h1 className="dashboard-title">Plaćanje otkazano</h1>

      <div className="profile-card">
        <h2>Niste završili plaćanje</h2>
        <p className="section-hint">
          Rezervacija ostaje zaključana najviše 5 minuta. Nakon toga termin se
          automatski oslobađa.
        </p>
        {reservationId && (
          <p className="section-hint">
            Referenca rezervacije: <strong>#{reservationId}</strong>
          </p>
        )}
        <div className="action-buttons-row" style={{ marginTop: 12 }}>
          <Link to="/user/courts" className="edit-btn">
            Nazad na terene
          </Link>
          <Link to="/user/history" className="edit-btn">
            Historija
          </Link>
        </div>
      </div>
    </div>
  )
}

export default PaymentCancel
