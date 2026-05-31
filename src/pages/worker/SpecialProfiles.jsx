import { useEffect, useState } from "react"
import api from "../../services/api"
import { useAuth } from "../../context/AuthContext"

const PROFILE_OPTIONS = [
  {
    value: "SPORTSKI_KLUB",
    label: "Sportski klub",
    description: "Pogodnosti za upravljanje klubom, članovima i sezonskim terminima.",
  },
  {
    value: "LICENCIRANI_TRENER",
    label: "Licencirani trener",
    description: "Pogodnosti za klijente, trening termine i referral kodove.",
  },
]

function SpecialProfiles() {
  const { currentUser } = useAuth()
  const [step, setStep] = useState(1)
  const [query, setQuery] = useState("")
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedProfile, setSelectedProfile] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    loadUsers("")
  }, [])

  async function loadUsers(search) {
    try {
      setLoading(true)
      const response = await api.get("/users", { params: { q: search } })
      setUsers(response.data.data.filter((u) => u.role === "USER"))
    } catch {
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  function handleSearch(e) {
    e.preventDefault()
    loadUsers(query.trim())
  }

  function selectUser(user) {
    setSelectedUser(user)
    setSelectedProfile(user.specialProfile || "")
    setError("")
    setSuccess("")
    setStep(2)
  }

  function goBack() {
    setStep(1)
    setSelectedProfile("")
    setError("")
    setSuccess("")
  }

  async function handleAssign() {
    if (!selectedUser || !selectedProfile) {
      setError("Odaberite tip profila.")
      return
    }

    try {
      setSubmitting(true)
      setError("")
      setSuccess("")

      await api.post("/special-profiles/assign", {
        userId: selectedUser.id,
        specialProfile: selectedProfile,
        assignedBy: currentUser.name,
      })

      setSuccess(`Profil "${PROFILE_OPTIONS.find((p) => p.value === selectedProfile)?.label}" dodijeljen korisniku ${selectedUser.name}.`)
      setSelectedUser((prev) =>
        prev
          ? {
              ...prev,
              specialProfile: selectedProfile,
              specialProfileStatus: "VALIDATED",
            }
          : prev
      )
    } catch (err) {
      setError(err.response?.data?.message || "Greška pri dodjeli profila.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1 className="dashboard-title">Dodjela statusa</h1>
          <p className="section-hint">
            Korak {step} od 2 — {step === 1 ? "odaberite korisnika" : "odaberite tip profila"}.
          </p>
        </div>
        <div className="step-indicator">
          <span className={step === 1 ? "step-dot step-dot--active" : "step-dot"}>1</span>
          <span className="step-line" />
          <span className={step === 2 ? "step-dot step-dot--active" : "step-dot"}>2</span>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {step === 1 && (
        <div className="panel-card">
          <h2>Odaberite klijenta</h2>
          <form className="inline-search" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Pretražite po imenu ili emailu"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" className="edit-btn">
              Pretraži
            </button>
          </form>

          {loading ? (
            <div className="empty-state">Učitavanje korisnika...</div>
          ) : users.length === 0 ? (
            <div className="empty-state">Nema korisnika za prikaz.</div>
          ) : (
            <div className="user-select-list">
              {users.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  className="user-select-row"
                  onClick={() => selectUser(user)}
                >
                  <div>
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                  </div>
                  <div className="user-select-meta">
                    {user.specialProfile
                      ? user.specialProfile.replace(/_/g, " ")
                      : "Bez statusa"}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 2 && selectedUser && (
        <div className="panel-card">
          <h2>Odaberite tip profila</h2>
          <p className="section-hint">
            Korisnik: <strong>{selectedUser.name}</strong> ({selectedUser.email})
          </p>

          <div className="profile-type-grid">
            {PROFILE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`profile-type-card ${
                  selectedProfile === option.value ? "profile-type-card--selected" : ""
                }`}
                onClick={() => setSelectedProfile(option.value)}
              >
                <h3>{option.label}</h3>
                <p>{option.description}</p>
              </button>
            ))}
          </div>

          <div className="action-buttons-row">
            <button type="button" onClick={goBack}>
              Nazad
            </button>
            <button
              type="button"
              className="edit-btn"
              disabled={!selectedProfile || submitting}
              onClick={handleAssign}
            >
              {submitting ? "Dodjeljujemo..." : "Potvrdi dodjelu"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SpecialProfiles
