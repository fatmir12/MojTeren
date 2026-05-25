import { useAuth } from "../../context/AuthContext"

function Profile() {
  const { currentUser } = useAuth()

  return (
    <div>
      <h1 className="dashboard-title">Profil radnika</h1>

      <div className="profile-card">
        <h2>{currentUser.name}</h2>

        <p>
          <strong>Email:</strong> {currentUser.email}
        </p>

        <p>
          <strong>Uloga:</strong> {currentUser.role}
        </p>

        <p>
          <strong>Status:</strong> Aktivan
        </p>
      </div>
    </div>
  )
}

export default Profile