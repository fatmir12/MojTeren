import { useAuth } from "../../context/AuthContext"
<<<<<<< HEAD
import { formatRole } from "../../utils/roleLabels"
=======
>>>>>>> 4ffb565aaf6b17a6fe10e4e498a6a39ffe35c473

function Profile() {
  const { currentUser } = useAuth()

  return (
    <div>
      <h1 className="dashboard-title">Profil radnika</h1>

      <div className="profile-card">
        <h2>{currentUser.name}</h2>
<<<<<<< HEAD
        <p>
          <strong>Email:</strong> {currentUser.email}
        </p>
        <p>
          <strong>Uloga:</strong> {formatRole(currentUser.role)}
        </p>
=======

        <p>
          <strong>Email:</strong> {currentUser.email}
        </p>

        <p>
          <strong>Uloga:</strong> {currentUser.role}
        </p>

>>>>>>> 4ffb565aaf6b17a6fe10e4e498a6a39ffe35c473
        <p>
          <strong>Status:</strong> Aktivan
        </p>
      </div>
    </div>
  )
}

<<<<<<< HEAD
export default Profile
=======
export default Profile
>>>>>>> 4ffb565aaf6b17a6fe10e4e498a6a39ffe35c473
