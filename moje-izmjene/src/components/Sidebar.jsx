import { NavLink } from "react-router-dom"
import "../styles/sidebar.css"

function Sidebar({ type }) {
  const ownerLinks = [
    { path: "/owner/dashboard", label: "Dashboard" },
    { path: "/owner/objects", label: "Objekti" },
    { path: "/owner/workers", label: "Radnici" },
    { path: "/owner/reports", label: "Izvještaji" },
  ]

  const workerLinks = [
  { path: "/worker/dashboard", label: "Dashboard" },
  { path: "/worker/terms", label: "Termini" },
  { path: "/worker/reservations", label: "Rezervacije" },
  { path: "/worker/schedule", label: "Raspored" },
  { path: "/worker/profile", label: "Profil" },
]

  const userLinks = [
    { path: "/user/home", label: "Početna" },
    { path: "/user/courts", label: "Tereni i rezervacije" },
    { path: "/user/history", label: "Historija" },
    { path: "/user/profile", label: "Profil" },
  ]

  let links = ownerLinks

  if (type === "worker") links = workerLinks
  if (type === "user") links = userLinks

  return (
    <aside className="sidebar">
      <h3>Meni</h3>

      <div className="sidebar-links">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            {link.label}
          </NavLink>
        ))}
      </div>
    </aside>
  )
}

export default Sidebar