import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import "../styles/navbar.css"

function Navbar() {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate("/login")
  }

  return (
    <nav className="navbar">
      <h2 className="navbar-logo">MojTeren</h2>

      <div className="navbar-user">
        <span>{currentUser?.name}</span>
        <button onClick={handleLogout}>Odjava</button>
      </div>
    </nav>
  )
}

export default Navbar