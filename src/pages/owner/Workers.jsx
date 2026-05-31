import { useEffect, useState } from "react"
import api from "../../services/api"
import { formatRole } from "../../utils/roleLabels"

function Workers() {
  const [workers, setWorkers] = useState([])
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [editingId, setEditingId] = useState(null)

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWorkers()
  }, [])

  async function fetchWorkers() {
    try {
      setLoading(true)

      const response = await api.get("/workers")

      setWorkers(response.data.data)
    } catch (error) {
      setError("Greška pri učitavanju radnika.")
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    setSuccess("")

    const trimmedName = name.trim()
    const trimmedEmail = email.trim()

    if (!trimmedName || !trimmedEmail) {
      setError("Ime i email su obavezni.")
      return
    }

    if (!trimmedEmail.includes("@")) {
      setError("Email adresa nije validna.")
      return
    }

    const workerExists = workers.find(
      (worker) =>
        worker.email.toLowerCase() === trimmedEmail.toLowerCase() &&
        worker.id !== editingId
    )

    if (workerExists) {
      setError("Radnik sa ovim emailom već postoji.")
      return
    }

    if (editingId) {
      try {
        const response = await api.put(`/workers/${editingId}`, {
          name: trimmedName,
          email: trimmedEmail,
        })

        setWorkers(
          workers.map((worker) =>
            worker.id === editingId ? response.data.data : worker
          )
        )

        setEditingId(null)
        setName("")
        setEmail("")
        setSuccess("Radnik je uspješno izmijenjen.")
      } catch (error) {
        setError(error.response?.data?.message || "Greška pri izmjeni radnika.")
      }

      return
    }

    try {
      const response = await api.post("/workers", {
        name: trimmedName,
        email: trimmedEmail,
      })

      setWorkers([...workers, response.data.data])
      setName("")
      setEmail("")
      setSuccess("Radnik je uspješno dodan.")
    } catch (error) {
      setError(error.response?.data?.message || "Greška pri dodavanju radnika.")
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Da li ste sigurni da želite obrisati ovog radnika?")) {
      return
    }

    try {
      await api.delete(`/workers/${id}`)

      setWorkers(workers.filter((worker) => worker.id !== id))
      setSuccess("Radnik je uspješno obrisan.")
      setError("")
    } catch (error) {
      setError(error.response?.data?.message || "Greška pri brisanju radnika.")
    }
  }

  function handleEdit(worker) {
    setEditingId(worker.id)
    setName(worker.name)
    setEmail(worker.email)
    setError("")
    setSuccess("")
  }

  function cancelEdit() {
    setEditingId(null)
    setName("")
    setEmail("")
    setError("")
    setSuccess("")
  }

  if (loading) {
    return <div className="empty-state">Učitavanje radnika...</div>
  }

  return (
    <div>
      <h1 className="dashboard-title">Upravljanje radnicima</h1>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form className="object-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Ime radnika"
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

        <button type="submit">
          {editingId ? "Sačuvaj izmjene" : "Dodaj radnika"}
        </button>

        {editingId && (
          <button type="button" className="delete-btn" onClick={cancelEdit}>
            Odustani
          </button>
        )}
      </form>

      {workers.length === 0 ? (
        <div className="empty-state">Trenutno nema dodanih radnika.</div>
      ) : (
        <div className="object-list">
          {workers.map((worker) => (
            <div className="object-card" key={worker.id}>
              <h3>{worker.name}</h3>
              <p>{worker.email}</p>
              <p>
                {formatRole(worker.role)}
              </p>

              <div className="card-buttons">
                <button className="edit-btn" onClick={() => handleEdit(worker)}>
                  Izmijeni
                </button>

                <button
                  className="delete-btn"
                  onClick={() => handleDelete(worker.id)}
                >
                  Obriši
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Workers