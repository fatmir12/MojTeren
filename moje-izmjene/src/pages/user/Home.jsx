import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import api from "../../services/api"
import { useAuth } from "../../context/AuthContext"
import BookingModal from "../../components/user/BookingModal"
import FavoriteButton from "../../components/user/FavoriteButton"
import NotificationsPanel from "../../components/user/NotificationsPanel"
import {
  countFreeHourlySlots,
  getUpcomingFreeSlots,
} from "../../utils/slotUtils"

function Home() {
  const { currentUser, updateCurrentUser, refreshUser } = useAuth()

  const [objects, setObjects] = useState([])
  const [terms, setTerms] = useState([])
  const [reservations, setReservations] = useState([])
  const [favoriteIds, setFavoriteIds] = useState([])
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  const [bookingObject, setBookingObject] = useState(null)
  const [bookingDate, setBookingDate] = useState("")
  const [bookingStart, setBookingStart] = useState("")
  const [bookingEnd, setBookingEnd] = useState("")

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    if (currentUser?.id) {
      fetchData()
      refreshUser()
    }
  }, [currentUser?.id])

  async function fetchData() {
    try {
      setLoading(true)

      const [objectsResponse, termsResponse, reservationsResponse, favoritesResponse] =
        await Promise.all([
          api.get("/objects"),
          api.get("/terms"),
          api.get("/reservations"),
          api.get("/favorites", { params: { userId: currentUser.id } }),
        ])

      setObjects(objectsResponse.data.data)
      setTerms(termsResponse.data.data)
      setReservations(reservationsResponse.data.data)
      setFavoriteIds(favoritesResponse.data.data.objectIds)
    } catch {
      setError("Greška pri učitavanju podataka.")
    } finally {
      setLoading(false)
    }
  }

  async function toggleFavorite(objectId) {
    try {
      const response = await api.post("/favorites/toggle", {
        userId: currentUser.id,
        objectId,
      })
      setFavoriteIds(response.data.data.objectIds)
    } catch {
      setError("Greška pri ažuriranju favorita.")
    }
  }

  function quickBook(slot) {
    const object = objects.find((o) => o.name === slot.objectName)
    if (!object) return

    setBookingObject(object)
    setBookingDate(slot.date)
    setBookingStart(slot.startTime)
    setBookingEnd(slot.endTime)
    setSuccess("")
  }

  function closeBooking() {
    setBookingObject(null)
    setBookingDate("")
    setBookingStart("")
    setBookingEnd("")
  }

  const today = new Date().toISOString().slice(0, 10)
  const availableObjects = objects.filter((object) =>
    terms.some(
      (term) =>
        term.objectName === object.name &&
        term.status === "FREE" &&
        term.date >= today
    )
  )

  const favoriteObjects = objects.filter((o) => favoriteIds.includes(o.id))
  const freeHourCount = countFreeHourlySlots(terms, reservations)
  const upcomingSlots = getUpcomingFreeSlots(terms, reservations, 8)

  if (loading) {
    return <div className="empty-state">Učitavanje početne stranice...</div>
  }

  return (
    <div>
      <h1 className="dashboard-title">Dobrodošli, {currentUser.name}</h1>

      {success && <div className="success-message">{success}</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="dashboard-grid">
        <div className="dashboard-card green">
          <h3>Dostupni objekti</h3>
          <h1>{availableObjects.length}</h1>
          <p className="card-subtitle">Sa slobodnim terminima</p>
        </div>

        <div className="dashboard-card blue">
          <h3>Slobodne satnice</h3>
          <h1>{freeHourCount}</h1>
          <p className="card-subtitle">U narednih 7+ dana</p>
        </div>

        <div className="dashboard-card purple">
          <h3>Loyalty bodovi</h3>
          <h1>{currentUser.loyaltyPoints ?? 0}</h1>
          <p className="card-subtitle">10 bodova po satu rezervacije</p>
        </div>

        <div className="dashboard-card orange">
          <h3>Obavijesti</h3>
          <h1>{unreadNotifications}</h1>
          <p className="card-subtitle">Nepročitane</p>
        </div>
      </div>

      <div className="home-sections">
        {favoriteObjects.length > 0 && (
          <section className="report-section">
            <div className="section-header">
              <h2>⭐ Omiljeni tereni</h2>
              <Link to="/user/courts?filter=favorites" className="section-link">
                Svi favoriti →
              </Link>
            </div>
            <div className="object-list compact">
              {favoriteObjects.map((object) => (
                <div className="object-card" key={object.id}>
                  <div className="card-title-row">
                    <h3>{object.name}</h3>
                    <FavoriteButton
                      isFavorite
                      onToggle={() => toggleFavorite(object.id)}
                    />
                  </div>
                  <p>
                    {object.city} · {object.sport}
                  </p>
                  <button
                    className="edit-btn inline-link-btn"
                    type="button"
                    onClick={() => {
                      setBookingObject(object)
                      setBookingDate("")
                      setBookingStart("")
                      setBookingEnd("")
                    }}
                  >
                    Rezerviši
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="report-section">
          <div className="section-header">
            <h2>Brza rezervacija</h2>
            <Link to="/user/courts" className="section-link">
              Svi tereni →
            </Link>
          </div>
          <p className="section-hint">
            Kliknite na slobodni termin za brzu rezervaciju s već popunjenim
            datumom i vremenom.
          </p>

          {upcomingSlots.length === 0 ? (
            <div className="empty-state inline-empty">
              Nema slobodnih termina za brzu rezervaciju.
            </div>
          ) : (
            <div className="free-slots-list">
              {upcomingSlots.map((slot, index) => (
                <button
                  key={index}
                  type="button"
                  className="free-slot-row free-slot-row--clickable"
                  onClick={() => quickBook(slot)}
                >
                  <div>
                    <strong>{slot.objectName}</strong>
                    <span className="free-slot-meta">
                      {slot.date} · {slot.startTime}–{slot.endTime}
                    </span>
                  </div>
                  <span className="status-badge free">Rezerviši</span>
                  <span className="slot-price">{slot.price} KM/h</span>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="report-section">
          <div className="section-header">
            <h2>Obavijesti i podsjetnici</h2>
          </div>
          <NotificationsPanel
            userName={currentUser.name}
            onUnreadChange={setUnreadNotifications}
          />
        </section>

        <section className="report-section">
          <div className="section-header">
            <h2>Dostupni objekti</h2>
            <Link to="/user/courts" className="section-link">
              Pogledajte sve →
            </Link>
          </div>

          {availableObjects.length === 0 ? (
            <div className="empty-state inline-empty">
              Trenutno nema objekata sa slobodnim terminima.
            </div>
          ) : (
            <div className="object-list compact">
              {availableObjects.slice(0, 4).map((object) => (
                <div className="object-card" key={object.id}>
                  <div className="card-title-row">
                    <h3>{object.name}</h3>
                    <FavoriteButton
                      isFavorite={favoriteIds.includes(object.id)}
                      onToggle={() => toggleFavorite(object.id)}
                    />
                  </div>
                  <p>
                    {object.city} · {object.sport}
                  </p>
                  <Link
                    to={`/user/courts?objectId=${object.id}`}
                    className="edit-btn inline-link-btn"
                  >
                    Rezerviši
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <BookingModal
        object={bookingObject}
        terms={terms}
        reservations={reservations}
        currentUser={currentUser}
        initialDate={bookingDate}
        initialStart={bookingStart}
        initialEnd={bookingEnd}
        isOpen={!!bookingObject}
        onClose={closeBooking}
        onSuccess={(msg) => {
          setSuccess(msg)
          fetchData()
          refreshUser()
        }}
        onLoyaltyEarned={(points) =>
          updateCurrentUser({ loyaltyPoints: points })
        }
      />
    </div>
  )
}

export default Home
