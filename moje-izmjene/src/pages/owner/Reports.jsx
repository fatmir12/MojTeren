import { useEffect, useMemo, useState } from "react"
import api from "../../services/api"
import { useToast } from "../../context/ToastContext"
import {
  computeOccupancy,
  computeRevenueByMonth,
  computeRevenueByObject,
  formatMonthLabel,
} from "../../utils/reportUtils"

function Reports() {
  const { toast } = useToast()
  const [objects, setObjects] = useState([])
  const [terms, setTerms] = useState([])
  const [reservations, setReservations] = useState([])
  const [workers, setWorkers] = useState([])

  const today = new Date().toISOString().slice(0, 10)
  const monthStart = today.slice(0, 8) + "01"

  const [dateFrom, setDateFrom] = useState(monthStart)
  const [dateTo, setDateTo] = useState(today)
  const [objectFilter, setObjectFilter] = useState("")

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReports()
  }, [])

  async function fetchReports() {
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
    } catch {
      toast.error("Greška pri učitavanju izvještaja.")
    } finally {
      setLoading(false)
    }
  }

  const filter = useMemo(
    () => ({ from: dateFrom, to: dateTo, objectName: objectFilter }),
    [dateFrom, dateTo, objectFilter]
  )

  const occupancy = useMemo(
    () => computeOccupancy(terms, reservations, filter),
    [terms, reservations, filter]
  )

  const revenueByObject = useMemo(
    () => computeRevenueByObject(reservations, filter),
    [reservations, filter]
  )

  const revenueByMonth = useMemo(
    () => computeRevenueByMonth(reservations, filter),
    [reservations, filter]
  )

  const totalRevenue = revenueByObject.reduce((s, r) => s + r.revenue, 0)

  const maxObjectRevenue = Math.max(
    ...revenueByObject.map((r) => r.revenue),
    1
  )

  const maxMonthRevenue = Math.max(
    ...revenueByMonth.map((r) => r.revenue),
    1
  )

  const filteredReservations = reservations.filter((r) => {
    const inRange =
      (!dateFrom || r.date >= dateFrom) && (!dateTo || r.date <= dateTo)
    const matchObj = !objectFilter || r.objectName === objectFilter
    return inRange && matchObj
  })

  const confirmedCount = filteredReservations.filter(
    (r) => r.status === "CONFIRMED"
  ).length

  const cancelledCount = filteredReservations.filter(
    (r) => r.status === "CANCELLED"
  ).length

  if (loading) {
    return <div className="empty-state">Učitavanje izvještaja...</div>
  }

  return (
    <div className="reports-page">
      <h1 className="dashboard-title">Izvještaji</h1>

      <div className="object-form filters-form report-filters">
        <div className="form-field">
          <label>Od datuma</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label>Do datuma</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label>Objekat</label>
          <select
            value={objectFilter}
            onChange={(e) => setObjectFilter(e.target.value)}
          >
            <option value="">Svi objekti</option>
            {objects.map((o) => (
              <option key={o.id} value={o.name}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            setDateFrom(monthStart)
            setDateTo(today)
            setObjectFilter("")
          }}
        >
          Ovaj mjesec
        </button>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card green">
          <h3>Prihod (period)</h3>
          <h1>{totalRevenue.toFixed(0)} KM</h1>
        </div>
        <div className="dashboard-card blue">
          <h3>Potvrđene rezervacije</h3>
          <h1>{confirmedCount}</h1>
        </div>
        <div className="dashboard-card orange">
          <h3>Otkazane</h3>
          <h1>{cancelledCount}</h1>
        </div>
        <div className="dashboard-card purple">
          <h3>Objekata / radnika</h3>
          <h1>
            {objects.length} / {workers.length}
          </h1>
        </div>
      </div>

      <section className="report-section">
        <h2>Popunjenost terena</h2>
        <p className="section-hint">
          U periodu {dateFrom} – {dateTo}
          {objectFilter ? ` · ${objectFilter}` : ""}. Zaključani sati se ne
          računaju u postotak.
        </p>

        <div className="occupancy-chart">
          <div className="occupancy-bar-wrap">
            <div
              className="occupancy-bar occupancy-bar--reserved"
              style={{ width: `${occupancy.occupancyPct}%` }}
              title={`Rezervisano: ${occupancy.occupancyPct}%`}
            />
            <div
              className="occupancy-bar occupancy-bar--free"
              style={{ width: `${occupancy.freePct}%` }}
              title={`Slobodno: ${occupancy.freePct}%`}
            />
          </div>
          <div className="occupancy-legend">
            <span className="legend-item legend-full">
              Rezervisano {occupancy.occupancyPct}% ({occupancy.reservedHours}h)
            </span>
            <span className="legend-item legend-available">
              Slobodno {occupancy.freePct}% ({occupancy.freeHours}h)
            </span>
            {occupancy.lockedHours > 0 && (
              <span className="legend-item legend-partial">
                Zaključano {occupancy.lockedHours}h
              </span>
            )}
          </div>
          <p className="occupancy-total">
            Ukupno satnih mjesta u periodu: <strong>{occupancy.totalHours}</strong>
          </p>
        </div>
      </section>

      <div className="reports-two-col">
        <section className="report-section">
          <h2>Prihod po objektu</h2>
          {revenueByObject.length === 0 ? (
            <p className="section-hint">Nema prihoda u odabranom periodu.</p>
          ) : (
            <ul className="revenue-bars-list">
              {revenueByObject.map((row) => (
                <li key={row.name}>
                  <div className="revenue-bar-label">
                    <span>{row.name}</span>
                    <strong>{row.revenue.toFixed(0)} KM</strong>
                  </div>
                  <div className="revenue-bar-track">
                    <div
                      className="revenue-bar-fill"
                      style={{
                        width: `${(row.revenue / maxObjectRevenue) * 100}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="report-section">
          <h2>Prihod po mjesecu</h2>
          {revenueByMonth.length === 0 ? (
            <p className="section-hint">Nema podataka po mjesecima.</p>
          ) : (
            <ul className="revenue-bars-list revenue-bars-list--months">
              {revenueByMonth.map((row) => (
                <li key={row.month}>
                  <div className="revenue-bar-label">
                    <span>{formatMonthLabel(row.month)}</span>
                    <strong>{row.revenue.toFixed(0)} KM</strong>
                  </div>
                  <div className="revenue-bar-track">
                    <div
                      className="revenue-bar-fill revenue-bar-fill--month"
                      style={{
                        width: `${(row.revenue / maxMonthRevenue) * 100}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

export default Reports
