import { useEffect, useState } from "react"
import api from "../../services/api"
<<<<<<< HEAD
import LocationMapPicker from "../../components/map/LocationMapPicker"

function Objects() {
  const [objects, setObjects] = useState([])
=======

function Objects() {
  const [objects, setObjects] = useState([])
  const [name, setName] = useState("")
  const [city, setCity] = useState("")
  const [sport, setSport] = useState("")
  const [editingId, setEditingId] = useState(null)
>>>>>>> 4ffb565aaf6b17a6fe10e4e498a6a39ffe35c473
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(true)

<<<<<<< HEAD
  const [showModal, setShowModal] = useState(false)
  const [modalStep, setModalStep] = useState(1)
  const [editingId, setEditingId] = useState(null)

  const [name, setName] = useState("")
  const [sport, setSport] = useState("")
  const [city, setCity] = useState("")
  const [address, setAddress] = useState("")
  const [lat, setLat] = useState(null)
  const [lng, setLng] = useState(null)
  const [submitting, setSubmitting] = useState(false)

=======
>>>>>>> 4ffb565aaf6b17a6fe10e4e498a6a39ffe35c473
  useEffect(() => {
    fetchObjects()
  }, [])

  async function fetchObjects() {
    try {
      setLoading(true)
<<<<<<< HEAD
      const response = await api.get("/objects")
      setObjects(response.data.data)
    } catch {
=======

      const response = await api.get("/objects")

      setObjects(response.data.data)
    } catch (error) {
>>>>>>> 4ffb565aaf6b17a6fe10e4e498a6a39ffe35c473
      setError("Greška pri učitavanju objekata.")
    } finally {
      setLoading(false)
    }
  }

<<<<<<< HEAD
  function resetForm() {
    setName("")
    setSport("")
    setCity("")
    setAddress("")
    setLat(null)
    setLng(null)
    setModalStep(1)
    setEditingId(null)
    setError("")
  }

  function openAddModal() {
    resetForm()
    setShowModal(true)
  }

  function openEditModal(object) {
    setEditingId(object.id)
    setName(object.name)
    setSport(object.sport)
    setCity(object.city)
    setAddress(object.address || "")
    setLat(object.lat ?? null)
    setLng(object.lng ?? null)
    setModalStep(object.lat != null ? 2 : 1)
    setError("")
    setSuccess("")
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    resetForm()
  }

  function handleLocationSelect(location) {
    setLat(location.lat)
    setLng(location.lng)
  }

  function goToDetailsStep() {
    if (lat == null || lng == null) {
      setError("Postavite pin na mapi prije nastavka.")
      return
    }
    setError("")
    setModalStep(2)
  }

=======
>>>>>>> 4ffb565aaf6b17a6fe10e4e498a6a39ffe35c473
  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    setSuccess("")

    const trimmedName = name.trim()
    const trimmedCity = city.trim()
    const trimmedSport = sport.trim()
<<<<<<< HEAD
    const trimmedAddress = address.trim()

    if (!trimmedName || !trimmedCity || !trimmedSport || !trimmedAddress) {
      setError("Naziv, grad, adresa i sport su obavezni.")
      return
    }

    if (lat == null || lng == null) {
      setError("Lokacija na mapi je obavezna.")
=======

    if (!trimmedName || !trimmedCity || !trimmedSport) {
      setError("Sva polja moraju biti popunjena.")
>>>>>>> 4ffb565aaf6b17a6fe10e4e498a6a39ffe35c473
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

<<<<<<< HEAD
    const payload = {
      name: trimmedName,
      city: trimmedCity,
      sport: trimmedSport,
      lat,
      lng,
      address: trimmedAddress,
    }

    try {
      setSubmitting(true)

      if (editingId) {
        const response = await api.put(`/objects/${editingId}`, payload)
        setObjects(objects.map((o) => (o.id === editingId ? response.data.data : o)))
        setSuccess("Objekat je uspješno izmijenjen.")
      } else {
        const response = await api.post("/objects", payload)
        setObjects([...objects, response.data.data])
        setSuccess("Objekat je uspješno dodan.")
      }

      closeModal()
    } catch (err) {
      setError(err.response?.data?.message || "Greška pri spremanju objekta.")
    } finally {
      setSubmitting(false)
=======
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
>>>>>>> 4ffb565aaf6b17a6fe10e4e498a6a39ffe35c473
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Da li ste sigurni da želite obrisati ovaj objekat?")) {
      return
    }

    try {
      await api.delete(`/objects/${id}`)
<<<<<<< HEAD
      setObjects(objects.filter((object) => object.id !== id))
      setSuccess("Objekat je uspješno obrisan.")
      setError("")
    } catch (err) {
      setError(err.response?.data?.message || "Greška pri brisanju objekta.")
    }
  }

=======

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

>>>>>>> 4ffb565aaf6b17a6fe10e4e498a6a39ffe35c473
  if (loading) {
    return <div className="empty-state">Učitavanje objekata...</div>
  }

  return (
    <div>
<<<<<<< HEAD
      <div className="page-header">
        <h1 className="dashboard-title">Upravljanje objektima</h1>
        <button type="button" className="edit-btn" onClick={openAddModal}>
          Dodaj objekat
        </button>
      </div>

      {error && !showModal && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

=======
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

>>>>>>> 4ffb565aaf6b17a6fe10e4e498a6a39ffe35c473
      {objects.length === 0 ? (
        <div className="empty-state">Trenutno nema dodanih objekata.</div>
      ) : (
        <div className="object-list">
          {objects.map((object) => (
            <div className="object-card" key={object.id}>
              <h3>{object.name}</h3>
              <p>Grad: {object.city}</p>
<<<<<<< HEAD
              {object.address && <p>Adresa: {object.address}</p>}
              <p>Sport: {object.sport}</p>

              <div className="card-buttons">
                <button className="edit-btn" type="button" onClick={() => openEditModal(object)}>
                  Izmijeni
                </button>
                <button className="delete-btn" type="button" onClick={() => handleDelete(object.id)}>
=======
              <p>Sport: {object.sport}</p>

              <div className="card-buttons">
                <button className="edit-btn" onClick={() => handleEdit(object)}>
                  Izmijeni
                </button>

                <button
                  className="delete-btn"
                  onClick={() => handleDelete(object.id)}
                >
>>>>>>> 4ffb565aaf6b17a6fe10e4e498a6a39ffe35c473
                  Obriši
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
<<<<<<< HEAD

      {showModal && (
        <div className="reservation-modal-overlay" onClick={closeModal}>
          <div className="reservation-modal reservation-modal--wide" onClick={(e) => e.stopPropagation()}>
            <div className="reservation-modal-header">
              <h2>{editingId ? "Izmjena objekta" : "Novi objekat"}</h2>
              <button className="delete-btn" type="button" onClick={closeModal}>
                Zatvori
              </button>
            </div>

            <div className="step-indicator step-indicator--modal">
              <span className={modalStep === 1 ? "step-dot step-dot--active" : "step-dot"}>1</span>
              <span className="step-line" />
              <span className={modalStep === 2 ? "step-dot step-dot--active" : "step-dot"}>2</span>
            </div>

            {error && <div className="error-message">{error}</div>}

            {modalStep === 1 && (
              <>
                <p className="section-hint">
                  Korak 1 — postavite pin na mapi za lokaciju terena.
                </p>
                <LocationMapPicker
                  initialLat={lat}
                  initialLng={lng}
                  onLocationSelect={handleLocationSelect}
                />
                {lat != null && lng != null && (
                  <p className="map-status">Lokacija postavljena ({lat.toFixed(5)}, {lng.toFixed(5)})</p>
                )}
                <div className="action-buttons-row">
                  <button type="button" className="edit-btn" onClick={goToDetailsStep}>
                    Nastavi
                  </button>
                </div>
              </>
            )}

            {modalStep === 2 && (
              <>
                <p className="section-hint">
                  Korak 2 — unesite podatke o terenu. Lokacija je već odabrana na mapi.
                </p>
                <form className="object-form object-form--stacked object-form--centered" onSubmit={handleSubmit}>
                  <div className="form-field">
                    <label>Naziv terena</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>Grad</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>Adresa</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>Tip sporta</label>
                    <input
                      type="text"
                      value={sport}
                      onChange={(e) => setSport(e.target.value)}
                      required
                    />
                  </div>
                  <div className="action-buttons-row">
                    <button type="button" onClick={() => setModalStep(1)}>
                      Nazad na mapu
                    </button>
                    <button type="submit" className="edit-btn" disabled={submitting}>
                      {submitting ? "Spremanje..." : editingId ? "Sačuvaj" : "Dodaj objekat"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
=======
>>>>>>> 4ffb565aaf6b17a6fe10e4e498a6a39ffe35c473
    </div>
  )
}

<<<<<<< HEAD
export default Objects
=======
export default Objects
>>>>>>> 4ffb565aaf6b17a6fe10e4e498a6a39ffe35c473
