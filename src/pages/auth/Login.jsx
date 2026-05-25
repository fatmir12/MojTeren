import { useState } from "react"
import { useAuth } from "../../context/AuthContext"
import { Link, useNavigate } from "react-router-dom"

function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()

    setError("")

    if (!email || !password) {
      setError("Email i lozinka su obavezni.")
      return
    }

    if (!email.includes("@")) {
      setError("Email adresa nije validna.")
      return
    }

    setLoading(true)

    const result = await login(email, password)

    if (!result.success) {
      setError(result.message)
      setLoading(false)
      return
    }

    if (result.user.role === "OWNER") {
      navigate("/owner/dashboard")
    } else if (result.user.role === "WORKER") {
      navigate("/worker/dashboard")
    } else {
      navigate("/user/home")
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>MojTeren</h1>
        <p>Prijava u sistem</p>

        {error && <div className="auth-error">{error}</div>}

        <input
          type="email"
          placeholder="Email adresa"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Lozinka"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Prijavljivanje..." : "Prijavi se"}
        </button>

        <div className="auth-link">
          Nemate nalog? <Link to="/register">Registrujte se</Link>
        </div>

        <div className="demo-users">
          <p>Demo nalozi:</p>
          <span>Fatmir@test.com / 123456</span>
          <span>Deni@test.com / 123456</span>
          <span>Matko@test.com / 123456</span>
        </div>
      </form>
    </div>
  )
}

export default Login