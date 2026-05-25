import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import api from "../../services/api"

function Dashboard() {
  const [stats, setStats] = useState({
    terms: 0,
    reservations: 0,
    confirmed: 0,
    cancelled: 0,
    todayReservations: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    try {
      const [termsResponse, reservationsResponse] = await Promise.all([
        api.get("/terms"),
        api.get("/reservations"),
      ])

      const terms = termsResponse.data.data
      const reservations = reservationsResponse.data.data
      const today = new Date().toISOString().slice(0, 10)

      setStats({
        terms: terms.length,
        reservations: reservations.length,
        confirmed: reservations.filter((r) => r.status === "CONFIRMED").length,
        cancelled: reservations.filter((r) => r.status === "CANCELLED").length,
        todayReservations: reservations.filter((r) => r.date === today).length,
      })
    } catch {
      setStats({
        terms: 0,
        reservations: 0,
        confirmed: 0,
        cancelled: 0,
        todayReservations: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="empty-state">Učitavanje...</div>
  }

  return (
    <div>
      <h1 className="dashboard-title">Radnički panel</h1>

      <div className="dashboard-grid">
        <div className="dashboard-card green">
          <h3>Ukupno termina</h3>
          <h1>{stats.terms}</h1>
        </div>

        <div className="dashboard-card blue">
          <h3>Rezervacije danas</h3>
          <h1>{stats.todayReservations}</h1>
        </div>

        <div className="dashboard-card orange">
          <h3>Potvrđene</h3>
          <h1>{stats.confirmed}</h1>
        </div>

        <div className="dashboard-card purple">
          <h3>Otkazane</h3>
          <h1>{stats.cancelled}</h1>
        </div>
      </div>

      <div className="quick-links">
        <Link to="/worker/terms" className="quick-link-card">
          <h3>Upravljanje terminima</h3>
          <p>Kreirajte, zaključajte ili oslobodite termine</p>
        </Link>
        <Link to="/worker/reservations" className="quick-link-card">
          <h3>Rezervacije</h3>
          <p>Izmjena i otkazivanje rezervacija</p>
        </Link>
        <Link to="/worker/schedule" className="quick-link-card">
          <h3>Dnevni raspored</h3>
          <p>Pregled popunjenosti terena</p>
        </Link>
      </div>
    </div>
  )
}

export default Dashboard
