import { readData, writeData } from "../config/fileStorage.js"
import { emitEvent } from "../services/eventBus.js"
import {
  isValidSpecialProfileType,
  SPECIAL_PROFILE_TYPES,
} from "../utils/specialProfileTypes.js"
import { addNotification } from "../services/notificationService.js"

function nowIso() {
  return new Date().toISOString()
}

export async function assignSpecialProfile(req, res) {
  const { userId, specialProfile } = req.body

  if (!userId || !specialProfile) {
    return res.status(400).json({
      success: false,
      message: "userId i specialProfile su obavezni.",
    })
  }

  const normalizedType = String(specialProfile).toUpperCase()

  if (!isValidSpecialProfileType(normalizedType)) {
    return res.status(400).json({
      success: false,
      message: "Nepoznat tip specijalnog profila.",
    })
  }

  const data = await readData()

  const user = (data.users || []).find((u) => u.id === Number(userId))
  if (!user) {
    return res.status(404).json({ success: false, message: "Korisnik nije pronađen." })
  }

  user.specialProfile = normalizedType
  // U ovoj iteraciji radnik dodjeljuje odmah (VALIDATED), kako je traženo.
  user.specialProfileStatus = "VALIDATED"
  user.specialProfileAssignedAt = nowIso()

  addNotification(data, {
    userName: user.name,
    type: "SPECIAL_PROFILE_ASSIGNED",
    title: "Specijalni profil aktiviran",
    message: `Dobijate pogodnosti za: ${
      normalizedType === SPECIAL_PROFILE_TYPES.SPORTSKI_KLUB
        ? "Sportski klub"
        : "Licencirani trener"
    }.`,
    reservationId: null,
  })

  emitEvent("profile.special_assigned", { userId: user.id, specialProfile: normalizedType })

  await writeData(data)

  res.json({
    success: true,
    message: "Specijalni profil je uspješno dodijeljen.",
    data: {
      userId: user.id,
      specialProfile: user.specialProfile,
      specialProfileStatus: user.specialProfileStatus,
    },
  })
}

