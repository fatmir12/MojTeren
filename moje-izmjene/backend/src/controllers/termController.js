import { readData, writeData } from "../config/fileStorage.js"
import {
  canCancelWithRefund,
  getCancellationPolicyMessage,
  isActiveReservation,
} from "../utils/reservationRules.js"
import {
  normalizeSlotsPayload,
  reservationOverlapsSlots,
} from "../utils/termLockUtils.js"
import { deductLoyaltyPoints } from "./loyaltyController.js"
import { addNotification } from "../services/notificationService.js"
<<<<<<< HEAD
import {
  cleanupExpiredLocks,
  getPaymentLockedSlotsForTerm,
} from "../services/lockService.js"
=======
>>>>>>> 4ffb565aaf6b17a6fe10e4e498a6a39ffe35c473

function cancelReservationsForTerm(data, term, reservations, reasonTitle) {
  const cancelled = []

  reservations.forEach((reservation) => {
    const withRefund = canCancelWithRefund(
      reservation.date,
      reservation.startTime
    )
    const policyMessage = getCancellationPolicyMessage(
      reservation.date,
      reservation.startTime
    )

    reservation.status = "CANCELLED"
    reservation.cancelledAt = new Date().toISOString()
    reservation.cancelReason = "TEREN_ZAKLJUCAN"
    reservation.refundEligible = withRefund

    if (withRefund && reservation.loyaltyEarned) {
      deductLoyaltyPoints(data, reservation.userName, reservation.loyaltyEarned)
    }

    addNotification(data, {
      userName: reservation.userName,
      type: "CANCELLATION",
      title: reasonTitle,
      message: `Teren ${term.objectName} (${term.date}) – sat ${reservation.startTime}–${reservation.endTime} više nije dostupan. Rezervacija je otkazana. ${policyMessage}`,
      reservationId: reservation.id,
    })

    cancelled.push({
      id: reservation.id,
      userName: reservation.userName,
      startTime: reservation.startTime,
      endTime: reservation.endTime,
      refundEligible: withRefund,
    })
  })

  return cancelled
}

function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

function isValidTimeRange(startTime, endTime) {
  return timeToMinutes(startTime) < timeToMinutes(endTime)
}

export async function getTerms(req, res) {
  const data = await readData()
<<<<<<< HEAD
  const { expired } = cleanupExpiredLocks(data)
  if (expired.length > 0) {
    await writeData(data)
  }

  res.json({
    success: true,
    data: (data.terms || []).map((term) => ({
      ...term,
      paymentLockedSlots: getPaymentLockedSlotsForTerm(data, term),
    })),
=======

  res.json({
    success: true,
    data: data.terms,
>>>>>>> 4ffb565aaf6b17a6fe10e4e498a6a39ffe35c473
  })
}

export async function addTerm(req, res) {
<<<<<<< HEAD
  const { objectName, date, startTime, endTime, price, status } = req.body
=======
  const { objectName, date, startTime, endTime, price, status, lockedSlots } = req.body
>>>>>>> 4ffb565aaf6b17a6fe10e4e498a6a39ffe35c473

  if (!objectName || !date || !startTime || !endTime || !price || !status) {
    return res.status(400).json({
      success: false,
      message: "Sva polja su obavezna.",
    })
  }

  if (!isValidTimeRange(startTime, endTime)) {
    return res.status(400).json({
      success: false,
      message: "Početno vrijeme mora biti prije završnog vremena.",
    })
  }

  if (Number(price) <= 0) {
    return res.status(400).json({
      success: false,
      message: "Cijena mora biti veća od 0.",
    })
  }

  const data = await readData()

  const termExists = data.terms.find(
    (term) =>
      term.objectName === objectName &&
      term.date === date &&
      term.startTime === startTime &&
      term.endTime === endTime
  )

  if (termExists) {
    return res.status(400).json({
      success: false,
      message: "Termin već postoji.",
    })
  }

  const overlappingTerm = data.terms.find((term) => {
    if (term.objectName !== objectName || term.date !== date) {
      return false
    }

    const newStart = timeToMinutes(startTime)
    const newEnd = timeToMinutes(endTime)
    const existingStart = timeToMinutes(term.startTime)
    const existingEnd = timeToMinutes(term.endTime)

    return newStart < existingEnd && newEnd > existingStart
  })

  if (overlappingTerm) {
    return res.status(400).json({
      success: false,
      message: "Termin se preklapa sa postojećim terminom.",
    })
  }

  const newTerm = {
    id: Date.now(),
    objectName,
    date,
    startTime,
    endTime,
    price: Number(price),
    status,
    lockedSlots: [],
  }

  data.terms.push(newTerm)

  await writeData(data)

  res.status(201).json({
    success: true,
    message: "Termin uspješno dodan.",
    data: newTerm,
  })
}

export async function updateTerm(req, res) {
  const id = Number(req.params.id)
  const { objectName, date, startTime, endTime, price, status, lockedSlots } = req.body

  if (!objectName || !date || !startTime || !endTime || !price || !status) {
    return res.status(400).json({
      success: false,
      message: "Sva polja su obavezna.",
    })
  }

  if (!isValidTimeRange(startTime, endTime)) {
    return res.status(400).json({
      success: false,
      message: "Početno vrijeme mora biti prije završnog vremena.",
    })
  }

  if (Number(price) <= 0) {
    return res.status(400).json({
      success: false,
      message: "Cijena mora biti veća od 0.",
    })
  }

  const data = await readData()

  const termIndex = data.terms.findIndex((term) => term.id === id)

  if (termIndex === -1) {
    return res.status(404).json({
      success: false,
      message: "Termin nije pronađen.",
    })
  }

  const overlappingTerm = data.terms.find((term) => {
    if (term.id === id) {
      return false
    }

    if (term.objectName !== objectName || term.date !== date) {
      return false
    }

    const newStart = timeToMinutes(startTime)
    const newEnd = timeToMinutes(endTime)
    const existingStart = timeToMinutes(term.startTime)
    const existingEnd = timeToMinutes(term.endTime)

    return newStart < existingEnd && newEnd > existingStart
  })

  if (overlappingTerm) {
    return res.status(400).json({
      success: false,
      message: "Termin se preklapa sa postojećim terminom.",
    })
  }

  data.terms[termIndex] = {
    ...data.terms[termIndex],
    objectName,
    date,
    startTime,
    endTime,
    price: Number(price),
    status,
    lockedSlots:
      lockedSlots !== undefined
        ? lockedSlots
        : data.terms[termIndex].lockedSlots || [],
  }

  await writeData(data)

  res.json({
    success: true,
    message: "Termin uspješno izmijenjen.",
    data: data.terms[termIndex],
  })
}

export async function addWeekTerms(req, res) {
  const {
    objectName,
    startDate,
    days = 7,
    startTime,
    endTime,
    price,
    status = "FREE",
  } = req.body

  if (!objectName || !startDate || !startTime || !endTime || !price) {
    return res.status(400).json({
      success: false,
      message: "Objekat, početni datum, vrijeme i cijena su obavezni.",
    })
  }

  if (!isValidTimeRange(startTime, endTime)) {
    return res.status(400).json({
      success: false,
      message: "Početno vrijeme mora biti prije završnog vremena.",
    })
  }

  const data = await readData()
  const created = []
  const skipped = []

  for (let i = 0; i < Number(days); i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    const date = d.toISOString().slice(0, 10)

    const overlappingTerm = data.terms.find((term) => {
      if (term.objectName !== objectName || term.date !== date) {
        return false
      }

      const newStart = timeToMinutes(startTime)
      const newEnd = timeToMinutes(endTime)
      const existingStart = timeToMinutes(term.startTime)
      const existingEnd = timeToMinutes(term.endTime)

      return newStart < existingEnd && newEnd > existingStart
    })

    if (overlappingTerm) {
      skipped.push({ date, reason: "Preklapanje" })
      continue
    }

    const newTerm = {
      id: Date.now() + i,
      objectName,
      date,
      startTime,
      endTime,
      price: Number(price),
      status,
      lockedSlots: [],
    }

    data.terms.push(newTerm)
    created.push(newTerm)
  }

  await writeData(data)

  res.status(201).json({
    success: true,
    message: `Kreirano je ${created.length} termina za ${days} dana.`,
    data: { created, skipped },
  })
}

export async function lockTermSlots(req, res) {
  const id = Number(req.params.id)
  const data = await readData()

  const termIndex = data.terms.findIndex((term) => term.id === id)

  if (termIndex === -1) {
    return res.status(404).json({
      success: false,
      message: "Termin nije pronađen.",
    })
  }

  const term = data.terms[termIndex]

  if (term.status === "LOCKED") {
    return res.status(400).json({
      success: false,
      message: "Cijeli dan je zaključan. Prvo oslobodite dan.",
    })
  }

  const slots = normalizeSlotsPayload(req.body, term)

  if (!slots) {
    return res.status(400).json({
      success: false,
      message: "Navedite sat (hourStart), slots ili raspon startTime–endTime.",
    })
  }

  const locked = new Set(term.lockedSlots || [])
  const newSlots = slots.filter((s) => !locked.has(s))

  if (newSlots.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Odabrani sati su već zaključani.",
    })
  }

  const activeReservations = data.reservations.filter(
    (r) =>
      r.objectName === term.objectName &&
      r.date === term.date &&
      isActiveReservation(r) &&
      reservationOverlapsSlots(r, newSlots)
  )

  const cancelled = cancelReservationsForTerm(
    data,
    term,
    activeReservations,
    "Rezervacija otkazana – sat zaključan"
  )

  newSlots.forEach((s) => locked.add(s))

  data.terms[termIndex] = {
    ...term,
    lockedSlots: [...locked],
  }

  await writeData(data)

  const cancelMsg =
    cancelled.length > 0
      ? ` Otkazano: ${cancelled.length} rezervacija.`
      : ""

  res.json({
    success: true,
    message: `Zaključano ${newSlots.length} sat(a): ${newSlots.join(", ")}.${cancelMsg}`,
    data: data.terms[termIndex],
    lockedSlots: newSlots,
    cancelledReservations: cancelled,
    cancelledCount: cancelled.length,
  })
}

export async function unlockTermSlots(req, res) {
  const id = Number(req.params.id)
  const data = await readData()

  const termIndex = data.terms.findIndex((term) => term.id === id)

  if (termIndex === -1) {
    return res.status(404).json({
      success: false,
      message: "Termin nije pronađen.",
    })
  }

  const term = data.terms[termIndex]

  if (term.status === "LOCKED") {
    return res.status(400).json({
      success: false,
      message: "Dan je cjelodnevno zaključan. Koristite „Oslobodi dan”.",
    })
  }

  const slots = normalizeSlotsPayload(req.body, term)

  if (!slots) {
    return res.status(400).json({
      success: false,
      message: "Navedite sat ili raspon za oslobađanje.",
    })
  }

  const locked = new Set(term.lockedSlots || [])
  slots.forEach((s) => locked.delete(s))

  data.terms[termIndex] = {
    ...term,
    lockedSlots: [...locked],
  }

  await writeData(data)

  res.json({
    success: true,
    message: `Oslobođeno ${slots.length} sat(a).`,
    data: data.terms[termIndex],
  })
}

export async function lockTermDay(req, res) {
  const id = Number(req.params.id)
  const data = await readData()

  const termIndex = data.terms.findIndex((term) => term.id === id)

  if (termIndex === -1) {
    return res.status(404).json({
      success: false,
      message: "Termin nije pronađen.",
    })
  }

  const term = data.terms[termIndex]

  if (term.status === "LOCKED") {
    return res.status(400).json({
      success: false,
      message: "Dan je već zaključan.",
    })
  }

  const activeReservations = data.reservations.filter(
    (r) =>
      r.objectName === term.objectName &&
      r.date === term.date &&
      isActiveReservation(r)
  )

  const cancelled = cancelReservationsForTerm(
    data,
    term,
    activeReservations,
    "Rezervacija otkazana – teren zaključan"
  )

  data.terms[termIndex] = {
    ...term,
    status: "LOCKED",
    lockedSlots: [],
  }

  await writeData(data)

  const cancelMsg =
    cancelled.length > 0
      ? ` Otkazano je ${cancelled.length} rezervacija; korisnici su obaviješteni.`
      : ""

  res.json({
    success: true,
    message: `Dan je zaključan za ${term.objectName} (${term.date}).${cancelMsg}`,
    data: data.terms[termIndex],
    cancelledReservations: cancelled,
    cancelledCount: cancelled.length,
  })
}

export async function deleteTerm(req, res) {
  const id = Number(req.params.id)

  const data = await readData()

  const termExists = data.terms.some((term) => term.id === id)

  if (!termExists) {
    return res.status(404).json({
      success: false,
      message: "Termin nije pronađen.",
    })
  }

  data.terms = data.terms.filter((term) => term.id !== id)

  await writeData(data)

  res.json({
    success: true,
    message: "Termin uspješno obrisan.",
  })
}