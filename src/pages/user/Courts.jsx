import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import api from "../../services/api"
import { useAuth } from "../../context/AuthContext"
import BookingModal from "../../components/user/BookingModal"
import CourtsMap from "../../components/map/CourtsMap"
import FavoriteButton from "../../components/user/FavoriteButton"
import { getNext7Days, getDayAvailability } from "../../utils/slotUtils"
import { useToast } from "../../context/ToastContext"
import { CourtsSkeleton } from "../../components/ui/Skeleton"

function Courts() {
  const { toast } = useToast()
  const { currentUser, updateCurrentUser, refreshUser } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const [objects, setObjects] = useState([])
  const [terms, setTerms] = useState([])
  const [reservations, setReservations] = useState([])
  const [favoriteIds, setFavoriteIds] = useState([])

  const [search, setSearch] = useState("")
  const [sportFilter, setSportFilter] = useState("")
  const [availabilityFilter, setAvailabilityFilter] = useState("all")
  const [bookingObject, setBookingObject] = useState(null)
  const [bookingDate, setBookingDate] = useState("")
  const [bookingStart, setBookingStart] = useState("")
  const [bookingEnd, setBookingEnd] = useState("")

  const [loading, setLoading] = useState(true)

  const next7Days = getNext7Days()
  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    const filter = searchParams.get("filter")
    if (filter === "favorites") {
      setAvailabilityFilter("favorites")
    }
    fetchData()
  }, [])

  useEffect(() => {
    const es = new EventSource("http://localhost:5000/api/events")
    let refreshTimer = null

    function scheduleRefresh() {
      if (refreshTimer) return
      refreshTimer = setTimeout(async () => {
        refreshTimer = null
        try {
          const [termsResponse, reservationsResponse] = await Promise.all([
            api.get("/terms"),
            api.get("/reservations"),
          ])
          setTerms(termsResponse.data.data)
          setReservations(reservationsResponse.data.data)
        } catch {
          // ignore
        }
      }, 300)
    }

    es.addEventListener("lock.created", scheduleRefresh)
    es.addEventListener("lock.released", scheduleRefresh)
    es.addEventListener("lock.expired", scheduleRefresh)
    es.addEventListener("reservation.confirmed", scheduleRefresh)
    es.addEventListener("reservation.cancelled", scheduleRefresh)

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer)
      es.close()
    }
  }, [])

  useEffect(() => {
    if (loading || objects.length === 0) return

    const objectId = searchParams.get("objectId")
    const date = searchParams.get("date") || ""
    const startTime = searchParams.get("startTime") || ""
    const endTime = searchParams.get("endTime") || ""

    if (objectId) {
      const object = objects.find((o) => String(o.id) === objectId)
      if (object) {
        openBooking(object, date, startTime, endTime)
        setSearchParams({}, { replace: true })
      }
    }
  }, [loading, objects, searchParams, setSearchParams])

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
      toast.error("Greška pri učitavanju terena.")
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
      toast.error("Greška pri ažuriranju favorita.")
    }
  }

  function openBooking(object, date = "", start = "", end = "") {
    setBookingObject(object)
    setBookingDate(date)
    setBookingStart(start)
    setBookingEnd(end)
  }

  function closeBooking() {
    setBookingObject(null)
    setBookingDate("")
    setBookingStart("")
    setBookingEnd("")
  }

  function handleBookingSuccess(message) {
    toast.success(message)
    closeBooking()
    fetchData()
    refreshUser()
  }

  function hasFreeToday(objectName) {
    const av = getDayAvailability(terms, reservations, objectName, today)
    return av.status === "available" || av.status === "partial"
  }

  const filteredObjects = useMemo(() => {
    return objects.filter((object) => {
      const matchesSearch =
        object.name.toLowerCase().includes(search.toLowerCase()) ||
        object.city.toLowerCase().includes(search.toLowerCase())

      const matchesSport = sportFilter === "" || object.sport === sportFilter

      const matchesFavorites =
        availabilityFilter !== "favorites" || favoriteIds.includes(object.id)

      const matchesFreeToday =
        availabilityFilter !== "freeToday" || hasFreeToday(object.name)

      return matchesSearch && matchesSport && matchesFavorites && matchesFreeToday
    })
  }, [objects, search, sportFilter, availabilityFilter, favoriteIds, terms, reservations])

  const sports = [...new Set(objects.map((object) => object.sport))]

  if (loading) {
    return (
      <div>
        <h1 className="dashboard-title">Tereni i rezervacije</h1>
        <CourtsSkeleton />
      </div>
    )
  }

  return (
    <div>
      <h1 className="dashboard-title">Tereni i rezervacije</h1>

      <p className="section-hint">
        Kliknite pin na mapi da odmah rezervišete termin. Lock se aktivira tek kada kliknete Plati / Rezerviši (5 min).
      </p>

      <div className="object-form filters-form">
        <input
          type="text"
          placeholder="Pretražite po nazivu ili gradu"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={sportFilter} onChange={(e) => setSportFilter(e.target.value)}>
          <option value="">Svi sportovi</option>
          {sports.map((sport) => (
            <option key={sport} value={sport}>
              {sport}
            </option>
          ))}
        </select>

        <select
          value={availabilityFilter}
          onChange={(e) => setAvailabilityFilter(e.target.value)}
        >
          <option value="all">Svi tereni</option>
          <option value="freeToday">Slobodni danas</option>
          <option value="favorites">Samo favoriti</option>
        </select>
      </div>

      {filteredObjects.length === 0 ? (
        <div className="empty-state">Nema rezultata za odabrane filtere.</div>
      ) : (
        <>
          <div className="courts-map-section">
            <CourtsMap
              objects={filteredObjects}
              selectedId={bookingObject?.id}
              onSelect={(object) => openBooking(object)}
            />
          </div>

          <div className="week-legend">
            <span className="legend-item legend-available">Slobodno</span>
            <span className="legend-item legend-partial">Djelimično</span>
            <span className="legend-item legend-full">Popunjeno</span>
            <span className="legend-item legend-none">Nema termina</span>
          </div>

          <div className="courts-list">
            {filteredObjects.map((object) => (
              <article className="court-card" key={object.id}>
                <div className="court-card-header">
                  <div>
                    <div className="card-title-row">
                      <h3>{object.name}</h3>
                      <FavoriteButton
                        isFavorite={favoriteIds.includes(object.id)}
                        onToggle={() => toggleFavorite(object.id)}
                      />
                    </div>
                    <p className="court-meta">
                      {object.city} · {object.sport}
                    </p>
                  </div>
                  <button
                    className="edit-btn"
                    type="button"
                    onClick={() => openBooking(object)}
                  >
                    Rezerviši
                  </button>
                </div>

                <div className="week-days-label">Narednih 7 dana</div>

                <div className="week-days-scroll">
                  <div className="week-days-row">
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
                          }`}
                          title={`${day.date} – ${availability.label}`}
                          onClick={() => openBooking(object, day.date)}
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
              </article>
            ))}
          </div>
        </>
      )}

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
        onSuccess={handleBookingSuccess}
        onLoyaltyEarned={(points) => updateCurrentUser({ loyaltyPoints: points })}
      />
    </div>
  )
}

export default Courts
