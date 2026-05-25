import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"

function Register() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()
  const { register } = useAuth()

  async function handleSubmit(e) {
    e.preventDefault()

    setError("")
    setSuccess("")

    const trimmedName = name.trim()
    const trimmedEmail = email.trim()

    if (trimmedName.length < 3) {
      setError("Ime i prezime mora imati najmanje 3 karaktera.")
      return
    }

    if (!trimmedEmail.includes("@") || !trimmedEmail.includes(".")) {
      setError("Email adresa nije validna.")
      return
    }

    if (password.length < 6) {
      setError("Lozinka mora imati najmanje 6 karaktera.")
      return
    }

    if (password !== confirmPassword) {
      setError("Lozinke se ne poklapaju.")
      return
    }

    setLoading(true)

    const result = await register(trimmedName, trimmedEmail, password)

    if (!result.success) {
      setError(result.message)
      setLoading(false)
      return
    }

    setSuccess("Registracija je uspješna. Preusmjeravamo vas na prijavu...")

    setTimeout(() => {
      navigate("/login")
    }, 1000)
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>MojTeren</h1>
        <p>Kreiranje korisničkog naloga</p>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        <input
          type="text"
          placeholder="Ime i prezime"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          type="email"
          placeholder="Email adresa"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Lozinka"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Potvrdi lozinku"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Registracija..." : "Registruj se"}
        </button>

        <div className="auth-link">
          Već imate nalog? <Link to="/login">Prijavite se</Link>
        </div>
      </form>
    </div>
  )
}

export default Register