import { Link } from "react-router-dom"

function NotFound() {
  return (
    <div className="not-found-page">
      <div className="not-found-card">
        <h1>404</h1>
        <h2>Stranica nije pronađena</h2>
        <p>Ruta koju ste otvorili ne postoji u MojTeren aplikaciji.</p>

        <Link to="/login">
          Nazad na prijavu
        </Link>
      </div>
    </div>
  )
}

export default NotFound