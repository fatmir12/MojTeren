import { TRAINER_BENEFITS } from "../../utils/specialProfileLabels"

function LicenciraniTrener() {
  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1 className="dashboard-title">Licencirani trener</h1>
          <p className="section-hint">
            Pogodnosti i upravljanje za licencirane trenere (demo prikaz).
          </p>
        </div>
        <span className="status-pill status-pill--validated">Validiran profil</span>
      </div>

      <div className="benefits-grid">
        {TRAINER_BENEFITS.map((benefit) => (
          <button key={benefit.id} type="button" className="benefit-card" disabled>
            <h3>{benefit.label}</h3>
            <p className="benefit-demo-tag">Demo opcija</p>
          </button>
        ))}
      </div>
    </div>
  )
}

export default LicenciraniTrener
