import { useEffect, useState } from "react"
import api from "../../services/api"

function Dashboard() {
  const [objects, setObjects] = useState([])
  const [terms, setTerms] = useState([])
  const [reservations, setReservations] = useState([])
  const [workers, setWorkers] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchDashboard()
  }, [])

  async function fetchDashboard() {
    try {
      setLoading(true)

      const [
        objectsResponse,
        termsResponse,
        reservationsResponse,
        workersResponse,
      ] = await Promise.all([
        api.get("/objects"),
        api.get("/terms"),
        api.get("/reservations"),
        api.get("/workers"),
      ])

      setObjects(objectsResponse.data.data)
      setTerms(termsResponse.data.data)
      setReservations(reservationsResponse.data.data)
      setWorkers(workersResponse.data.data)
    } catch (error) {
      setError("Greška pri učitavanju dashboard podataka.")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="empty-state">Učitavanje dashboarda...</div>
  }

  return (
    <div>
      <h1 className="dashboard-title">
        Owner Dashboard
      </h1>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="dashboard-grid">

        <div className="dashboard-card green">
          <h3>Ukupni objekti</h3>
          <h1>{objects.length}</h1>
        </div>

        <div className="dashboard-card blue">
          <h3>Aktivni termini</h3>
          <h1>{terms.length}</h1>
        </div>

        <div className="dashboard-card orange">
          <h3>Rezervacije</h3>
          <h1>{reservations.length}</h1>
        </div>

        <div className="dashboard-card purple">
          <h3>Aktivni radnici</h3>
          <h1>{workers.length}</h1>
        </div>

      </div>
    </div>
  )
}

export default Dashboard