import { NavLink, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import "../styles/navbar.css"

function Navbar() {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate("/login")
  }

  function goHome() {
    if (currentUser?.role === "OWNER") {
      navigate("/owner/dashboard")
    } else if (currentUser?.role === "WORKER") {
      navigate("/worker/dashboard")
    } else {
      navigate("/user/home")
    }
  }

  const roleLinks = []

  if (currentUser?.role === "WORKER") {
    roleLinks.push({
      to: "/worker/special-profiles",
      label: "Dodjeli status",
    })
  }

  if (
    currentUser?.role === "USER" &&
    currentUser?.specialProfile === "LICENCIRANI_TRENER" &&
    currentUser?.specialProfileStatus === "VALIDATED"
  ) {
    roleLinks.push({
      to: "/user/licencirani-trener",
      label: "Licencirani trener",
    })
  }

  if (
    currentUser?.role === "USER" &&
    currentUser?.specialProfile === "SPORTSKI_KLUB" &&
    currentUser?.specialProfileStatus === "VALIDATED"
  ) {
    roleLinks.push({
      to: "/user/sportski-klub",
      label: "Sportski klub",
    })
  }

  return (
    <nav className="navbar">
      <button type="button" className="navbar-logo" onClick={goHome}>
        <img src="/logo.png" alt="" className="navbar-logo-icon" />
        <span className="navbar-logo-text">MojTeren</span>
      </button>

      <div className="navbar-actions">
        {roleLinks.length > 0 && (
          <div className="navbar-links">
            {roleLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  isActive ? "navbar-link navbar-link--active" : "navbar-link"
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        )}

        <div className="navbar-user">
          <span>{currentUser?.name}</span>
          <button type="button" onClick={handleLogout}>
            Odjava
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
