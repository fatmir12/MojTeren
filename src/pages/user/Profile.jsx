import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
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
      if (!currentUser?.id) return
      setLoading(true)
      await refreshUser()

      const [favoritesResponse, loyaltyResponse, userResponse] = await Promise.all([
        api.get("/favorites", { params: { userId: currentUser.id } }),
        api.get("/loyalty", { params: { userId: currentUser.id } }),
        api.get(`/users/${currentUser.id}`),
      ])

      setFavoriteObjects(favoritesResponse.data.data.objects)
      setRemindersEnabled(loyaltyResponse.data.data.remindersEnabled)
      updateCurrentUser({
        loyaltyPoints: loyaltyResponse.data.data.loyaltyPoints,
        remindersEnabled: loyaltyResponse.data.data.remindersEnabled,
        specialProfile: userResponse.data.data.specialProfile,
        specialProfileStatus: userResponse.data.data.specialProfileStatus,
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

  const initials = currentUser?.name
    ? currentUser.name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0].toUpperCase())
        .join("")
    : "U"

  const specialProfile = currentUser?.specialProfile
  const specialProfileStatus = currentUser?.specialProfileStatus

  const benefits =
    specialProfile === "SPORTSKI_KLUB"
      ? [
          "Pregled klupskog rasporeda",
          "Evidencija i upravljanje članarinom",
          "Upravljanje članovima kluba",
          "Zakup sezonskog termina",
        ]
      : specialProfile === "LICENCIRANI_TRENER"
        ? [
            "Upravljanje klijentima",
            "Kreiranje i objava trening termina",
            "Upravljanje referral kodovima",
            "Otkaži/izmijeni termin",
          ]
        : []

  return (
    <div>
      <div className="profile-hero">
        <div>
          <h1 className="dashboard-title">Moj profil</h1>
          <p className="section-hint">
            Vaše postavke, loyalty bodovi i obavijesti na jednom mjestu.
          </p>
        </div>
        <div className="profile-actions">
          <Link to="/user/courts" className="edit-btn">
            Novi termin
          </Link>
          <Link to="/user/history" className="edit-btn">
            Historija
          </Link>
        </div>
      </div>

      {message && <div className="success-message">{message}</div>}

      <div className="profile-grid">
        <div className="profile-card">
          <div className="profile-id-row">
            <div className="profile-avatar" aria-hidden="true">
              {initials}
            </div>
            <div>
              <h2 className="profile-name">{currentUser.name}</h2>
              <p className="profile-meta">{currentUser.email}</p>
            </div>
          </div>
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
          <h2>Specijalni profil</h2>
          {!specialProfile ? (
            <p className="section-hint">Trenutno nemate dodatne pogodnosti.</p>
          ) : (
            <>
              <p>
                <strong>Tip:</strong>{" "}
                {specialProfile === "SPORTSKI_KLUB"
                  ? "Sportski klub"
                  : "Licencirani trener"}
              </p>
              <p className="section-hint">
                <strong>Status:</strong> {specialProfileStatus || "—"}
              </p>
              <div className="policy-info" style={{ marginTop: 10 }}>
                <strong>Pogodnosti:</strong>
                <ul className="favorites-list" style={{ marginTop: 8 }}>
                  {benefits.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>

        <div className="profile-card">
          <h2>Podsjetnici</h2>
          <div className="toggle-card">
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={remindersEnabled}
                onChange={toggleReminders}
              />
              <span>Obavijest dan prije rezervacije</span>
            </label>
            <p className="section-hint toggle-hint">
              Preporučeno ako često zaboravite termin.
            </p>
          </div>
        </div>

        <div className="profile-card">
          <h2>Omiljeni tereni ({favoriteObjects.length})</h2>
          {favoriteObjects.length === 0 ? (
            <p className="section-hint">
              Nema favorita. Dodajte zvjezdicu na stranici Tereni.
            </p>
          ) : (
            <div className="favorites-chips">
              {favoriteObjects.map((obj) => (
                <span key={obj.id} className="favorite-chip">
                  {obj.name} · {obj.city}
                </span>
              ))}
            </div>
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
