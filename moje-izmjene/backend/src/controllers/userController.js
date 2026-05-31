import { readData } from "../config/fileStorage.js"

function sanitizeUser(user) {
  if (!user) return null
  const {
    id,
    name,
    email,
    role,
    specialProfile,
    specialProfileStatus,
  } = user

  return {
    id,
    name,
    email,
    role,
    specialProfile: specialProfile || null,
    specialProfileStatus: specialProfileStatus || null,
  }
}

export async function searchUsers(req, res) {
  const q = String(req.query.q || "").trim().toLowerCase()

  const data = await readData()

  const users = (data.users || [])
    .filter((u) => {
      if (!q) return u.role !== "OWNER" // keep it simple: hide owners in search
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      )
    })
    .map(sanitizeUser)

  res.json({
    success: true,
    data: users,
  })
}

export async function getUserById(req, res) {
  const id = Number(req.params.id)
  if (!id) {
    return res.status(400).json({ success: false, message: "id je obavezan." })
  }

  const data = await readData()
  const user = (data.users || []).find((u) => u.id === id)

  if (!user) {
    return res.status(404).json({ success: false, message: "Korisnik nije pronađen." })
  }

  res.json({
    success: true,
    data: sanitizeUser(user),
  })
}

