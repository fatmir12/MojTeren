import { useEffect, useState } from "react"
import api from "../../services/api"
import { useAuth } from "../../context/AuthContext"
import {
  canCancelReservation,
  canCancelWithRefund,
  getCancellationPolicyMessage,
  isReservationReviewable,
} from "../../utils/cancellationUtils"
import { useToast } from "../../context/ToastContext"
import { HistorySkeleton } from "../../components/ui/Skeleton"

const STATUS_LABELS = {
  CONFIRMED: "Potvrđena",
  WAITING_PAYMENT: "Čeka plaćanje",
  CANCELLED: "Otkazana",
  CREATED: "Kreirana",
}

function History() {
  const { toast } = useToast()
  const { currentUser, updateCurrentUser, refreshUser } = useAuth()

  const [reservations, setReservations] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  const [reviewingId, setReviewingId] = useState(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [payingId, setPayingId] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      setLoading(true)

      const [reservationsResponse, reviewsResponse] = await Promise.all([
        api.get("/reservations"),
        api.get("/reviews"),
      ])

      const userReservations = reservationsResponse.data.data.filter(
        (r) => r.userName === currentUser.name
      )

      setReservations(
        userReservations.sort((a, b) => b.date.localeCompare(a.date))
      )
      setReviews(reviewsResponse.data.data)
    } catch {
      toast.error("Greška pri učitavanju historije.")
    } finally {
      setLoading(false)
    }
  }

  async function handleCancel(reservation) {
    const policy = getCancellationPolicyMessage(
      reservation.date,
      reservation.startTime
    )

    if (
      !window.confirm(
        `Otkazati rezervaciju?\n\n${policy}`
      )
    ) {
      return
    }

    try {
      const response = await api.post(
        `/reservations/${reservation.id}/cancel`,
        { userName: currentUser.name }
      )

      toast.success(response.data.message)
      updateCurrentUser({ loyaltyPoints: response.data.loyaltyPoints })
      await fetchData()
      refreshUser()
    } catch (err) {
      toast.error(err.response?.data?.message || "Greška pri otkazivanju.")
    }
  }

  async function handleContinuePayment(reservation) {
    try {
      setPayingId(reservation.id)
      const response = await api.post("/payments/resume", {
        reservationId: reservation.id,
        userName: currentUser.name,
      })
      const url = response.data.data.checkoutUrl || response.data.data.paymentUrl
      if (!url) {
        toast.error("Nije vraćen link za plaćanje.")
        return
      }
      window.location.href = url
    } catch (err) {
      toast.error(err.response?.data?.message || "Greška pri otvaranju plaćanja.")
    } finally {
      setPayingId(null)
    }
  }

  async function handleReview(reservation) {
    try {
      await api.post("/reviews", {
        userName: currentUser.name,
        objectName: reservation.objectName,
        reservationId: reservation.id,
        rating,
        comment,
      })

      toast.success("Hvala na recenziji!")
      setReviewingId(null)
      setRating(5)
      setComment("")
      await fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || "Greška pri slanju recenzije.")
    }
  }

  function hasReview(reservationId) {
    return reviews.some((r) => r.reservationId === reservationId)
  }

  if (loading) {
    return (
      <div>
        <h1 className="dashboard-title">Historija rezervacija</h1>
        <HistorySkeleton />
      </div>
    )
  }

  return (
    <div>
      <h1 className="dashboard-title">Historija rezervacija</h1>

      <div className="policy-info">
        <strong>Pravilo otkazivanja:</strong> Besplatno otkazivanje ako je više
        od 24h do početka termina. Inače nema povrata.
      </div>

      {reservations.length === 0 ? (
        <div className="empty-state">Nemate prethodnih rezervacija.</div>
      ) : (
        reservations.map((reservation) => {
          const canCancel = canCancelReservation(reservation)
          const withRefund = canCancelWithRefund(
            reservation.date,
            reservation.startTime
          )
          const showReview =
            isReservationReviewable(reservation) &&
            !hasReview(reservation.id) &&
            !reservation.reviewed

          return (
            <div className="object-card history-card" key={reservation.id}>
              <h3>{reservation.objectName}</h3>
              <p>
                Datum: {reservation.date} · {reservation.startTime}–
                {reservation.endTime}
              </p>
              <p>Ukupno: {reservation.totalPrice} KM</p>
              {reservation.loyaltyEarned > 0 && (
                <p className="loyalty-earned">
                  +{reservation.loyaltyEarned} loyalty bodova
                </p>
              )}

              <span
                className={`status-badge ${reservation.status.toLowerCase()}`}
              >
                {STATUS_LABELS[reservation.status] || reservation.status}
              </span>

              {reservation.status === "WAITING_PAYMENT" && (
                <div className="history-actions">
                  <p className="section-hint">
                    Plaćanje nije završeno. Kliknite da otvorite Stripe checkout
                    (rok ~5 min).
                  </p>
                  <button
                    className="edit-btn"
                    type="button"
                    disabled={payingId === reservation.id}
                    onClick={() => handleContinuePayment(reservation)}
                  >
                    {payingId === reservation.id ? "Otvaranje..." : "Nastavi plaćanje"}
                  </button>
                </div>
              )}

              {reservation.status === "CONFIRMED" && canCancel && (
                <div className="history-actions">
                  <p className="cancel-policy">
                    {getCancellationPolicyMessage(
                      reservation.date,
                      reservation.startTime
                    )}
                  </p>
                  <button
                    className="delete-btn"
                    type="button"
                    onClick={() => handleCancel(reservation)}
                  >
                    Otkaži
                    {withRefund ? " (s povratom)" : " (bez povrata)"}
                  </button>
                </div>
              )}

              {showReview && reviewingId !== reservation.id && (
                <button
                  className="edit-btn"
                  type="button"
                  onClick={() => setReviewingId(reservation.id)}
                >
                  Ocijenite teren
                </button>
              )}

              {(reservation.reviewed || hasReview(reservation.id)) && (
                <p className="review-done">✓ Recenzija ostavljena</p>
              )}

              {reviewingId === reservation.id && (
                <div className="review-form">
                  <label>Ocjena (1–5)</label>
                  <div className="star-rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`star-btn ${rating >= star ? "active" : ""}`}
                        onClick={() => setRating(star)}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Komentar (opcionalno)"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                  <div className="action-buttons-row">
                    <button type="button" onClick={() => setReviewingId(null)}>
                      Odustani
                    </button>
                    <button
                      className="edit-btn"
                      type="button"
                      onClick={() => handleReview(reservation)}
                    >
                      Pošalji recenziju
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

export default History
