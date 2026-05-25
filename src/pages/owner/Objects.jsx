import { useEffect, useState } from "react"
import api from "../../services/api"

function Objects() {
  const [objects, setObjects] = useState([])
  const [name, setName] = useState("")
  const [city, setCity] = useState("")
  const [sport, setSport] = useState("")
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchObjects()
  }, [])

  async function fetchObjects() {
    try {
      setLoading(true)

      const response = await api.get("/objects")

      setObjects(response.data.data)
    } catch (error) {
      setError("Greška pri učitavanju objekata.")
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    setSuccess("")

    const trimmedName = name.trim()
    const trimmedCity = city.trim()
    const trimmedSport = sport.trim()

    if (!trimmedName || !trimmedCity || !trimmedSport) {
      setError("Sva polja moraju biti popunjena.")
      return
    }

    const objectExists = objects.find(
      (object) =>
        object.name.toLowerCase() === trimmedName.toLowerCase() &&
        object.id !== editingId
    )

    if (objectExists) {
      setError("Objekat sa ovim nazivom već postoji.")
      return
    }

    if (editingId) {
  try {
    const response = await api.put(`/objects/${editingId}`, {
      name: trimmedName,
      city: trimmedCity,
      sport: trimmedSport,
    })

    setObjects(
      objects.map((object) =>
        object.id === editingId ? response.data.data : object
      )
    )

    setEditingId(null)
    setName("")
    setCity("")
    setSport("")
    setSuccess("Objekat je uspješno izmijenjen.")
  } catch (error) {
    setError(
      error.response?.data?.message || "Greška pri izmjeni objekta."
    )
  }

  return
}

    try {
      const response = await api.post("/objects", {
        name: trimmedName,
        city: trimmedCity,
        sport: trimmedSport,
      })

      setObjects([...objects, response.data.data])

      setSuccess("Objekat je uspješno dodan.")
      setName("")
      setCity("")
      setSport("")
    } catch (error) {
      setError(
        error.response?.data?.message || "Greška pri dodavanju objekta."
      )
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Da li ste sigurni da želite obrisati ovaj objekat?")) {
      return
    }

    try {
      await api.delete(`/objects/${id}`)

      setObjects(objects.filter((object) => object.id !== id))
      setSuccess("Objekat je uspješno obrisan.")
      setError("")
    } catch (error) {
      setError(
        error.response?.data?.message || "Greška pri brisanju objekta."
      )
    }
  }

  function handleEdit(object) {
    setEditingId(object.id)
    setName(object.name)
    setCity(object.city)
    setSport(object.sport)
    setError("")
    setSuccess("")
  }

  function cancelEdit() {
    setEditingId(null)
    setName("")
    setCity("")
    setSport("")
    setError("")
    setSuccess("")
  }

  if (loading) {
    return <div className="empty-state">Učitavanje objekata...</div>
  }

  return (
    <div>
      <h1 className="dashboard-title">Upravljanje objektima</h1>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form className="object-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Naziv objekta"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Grad"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Sport"
          value={sport}
          onChange={(e) => setSport(e.target.value)}
          required
        />

        <button type="submit">
          {editingId ? "Sačuvaj izmjene" : "Dodaj objekat"}
        </button>

        {editingId && (
          <button type="button" className="delete-btn" onClick={cancelEdit}>
            Odustani
          </button>
        )}
      </form>

      {objects.length === 0 ? (
        <div className="empty-state">Trenutno nema dodanih objekata.</div>
      ) : (
        <div className="object-list">
          {objects.map((object) => (
            <div className="object-card" key={object.id}>
              <h3>{object.name}</h3>
              <p>Grad: {object.city}</p>
              <p>Sport: {object.sport}</p>

              <div className="card-buttons">
                <button className="edit-btn" onClick={() => handleEdit(object)}>
                  Izmijeni
                </button>

                <button
                  className="delete-btn"
                  onClick={() => handleDelete(object.id)}
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

export default Objects