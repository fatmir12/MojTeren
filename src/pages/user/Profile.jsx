import { useEffect, useState } from "react"
import api from "../../services/api"
import { useAuth } from "../../context/AuthContext"
import NotificationsPanel from "../../components/user/NotificationsPanel"

function Profile() {
  const { currentUser, updateCurrentUser, refreshUser } = useAuth()
  const [favoriteObjects, setFavoriteObjects] = useState([])
  const [remindersEnabled, setRemindersEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    try {
      setLoading(true)
      await refreshUser()

      const [favoritesResponse, loyaltyResponse] = await Promise.all([
        api.get("/favorites", { params: { userId: currentUser.id } }),
        api.get("/loyalty", { params: { userId: currentUser.id } }),
      ])

      setFavoriteObjects(favoritesResponse.data.data.objects)
      setRemindersEnabled(loyaltyResponse.data.data.remindersEnabled)
      updateCurrentUser({
        loyaltyPoints: loyaltyResponse.data.data.loyaltyPoints,
        remindersEnabled: loyaltyResponse.data.data.remindersEnabled,
      })
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }

  async function toggleReminders() {
    const next = !remindersEnabled

    try {
      await api.put("/loyalty/reminders", {
        userId: currentUser.id,
        remindersEnabled: next,
      })
      setRemindersEnabled(next)
      updateCurrentUser({ remindersEnabled: next })
      setMessage(
        next
          ? "Podsjetnici uključeni – obavijest dan prije termina."
          : "Podsjetnici isključeni."
      )
    } catch {
      setMessage("Greška pri spremanju postavki.")
    }
  }

  if (loading) {
    return <div className="empty-state">Učitavanje profila...</div>
  }

  return (
    <div>
      <h1 className="dashboard-title">Moj profil</h1>

      {message && <div className="success-message">{message}</div>}

      <div className="profile-grid">
        <div className="profile-card">
          <h2>{currentUser.name}</h2>
          <p>
            <strong>Email:</strong> {currentUser.email}
          </p>
          <p>
            <strong>Uloga:</strong> Korisnik
          </p>
        </div>

        <div className="profile-card loyalty-card">
          <h2>Loyalty program</h2>
          <p className="loyalty-big">{currentUser.loyaltyPoints ?? 0} bodova</p>
          <p className="section-hint">
            Zaradite 10 bodova za svaki sat rezervacije. Bodovi se oduzimaju pri
            besplatnom otkazivanju (24h+ prije termina).
          </p>
        </div>

        <div className="profile-card">
          <h2>Podsjetnici</h2>
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={remindersEnabled}
              onChange={toggleReminders}
            />
            <span>Obavijest dan prije rezervacije</span>
          </label>
        </div>

        <div className="profile-card">
          <h2>Omiljeni tereni ({favoriteObjects.length})</h2>
          {favoriteObjects.length === 0 ? (
            <p className="section-hint">
              Nema favorita. Dodajte zvjezdicu na stranici Tereni.
            </p>
          ) : (
            <ul className="favorites-list">
              {favoriteObjects.map((obj) => (
                <li key={obj.id}>
                  {obj.name} – {obj.city}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <section className="report-section">
        <h2>Moje obavijesti</h2>
        <NotificationsPanel userName={currentUser.name} />
      </section>
    </div>
  )
}

export default Profile
