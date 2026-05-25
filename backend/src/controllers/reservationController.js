import { readData, writeData } from "../config/fileStorage.js"
import {
  getHourStartsInRange,
  isHourLocked,
} from "../utils/termLockUtils.js"
import {
  canCancelWithRefund,
  getCancellationPolicyMessage,
  isReservationPast,
  LOYALTY_POINTS_PER_HOUR,
} from "../utils/reservationRules.js"
import { addLoyaltyPoints, deductLoyaltyPoints } from "./loyaltyController.js"
import { addNotification } from "../services/notificationService.js"

function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

function calculateHours(startTime, endTime) {
  return (timeToMinutes(endTime) - timeToMinutes(startTime)) / 60
}

export async function getReservations(req, res) {
  const data = await readData()

  res.json({
    success: true,
    data: data.reservations,
  })
}

export async function addReservation(req, res) {
  const {
    userName,
    objectName,
    date,
    startTime,
    endTime,
    pricePerHour,
    status,
  } = req.body

  if (!userName || !objectName || !date || !startTime || !endTime || !pricePerHour || !status) {
    return res.status(400).json({
      success: false,
      message: "Sva polja su obavezna.",
    })
  }

  if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
    return res.status(400).json({
      success: false,
      message: "Početno vrijeme mora biti prije završnog vremena.",
    })
  }

  const data = await readData()

  const term = data.terms.find((term) => {
    return (
      term.objectName === objectName &&
      term.date === date &&
      term.status !== "CANCELLED" &&
      timeToMinutes(startTime) >= timeToMinutes(term.startTime) &&
      timeToMinutes(endTime) <= timeToMinutes(term.endTime)
    )
  })

  if (!term) {
    return res.status(400).json({
      success: false,
      message: "Odabrani termin nije dostupan.",
    })
  }

  if (term.status === "LOCKED") {
    return res.status(400).json({
      success: false,
      message: "Dan je zaključan za rezervacije.",
    })
  }

  const bookingHours = getHourStartsInRange(startTime, endTime)
  const lockedHour = bookingHours.find((hour) => isHourLocked(term, hour))

  if (lockedHour) {
    return res.status(400).json({
      success: false,
      message: `Sat ${lockedHour} je zaključan i nije dostupan za rezervaciju.`,
    })
  }

  const overlap = data.reservations.find((reservation) => {
    if (
      reservation.objectName !== objectName ||
      reservation.date !== date ||
      reservation.status === "CANCELLED"
    ) {
      return false
    }

    return (
      timeToMinutes(startTime) < timeToMinutes(reservation.endTime) &&
      timeToMinutes(endTime) > timeToMinutes(reservation.startTime)
    )
  })

  if (overlap) {
    return res.status(400).json({
      success: false,
      message: "Odabrani period je već rezervisan.",
    })
  }

  const duration = calculateHours(startTime, endTime)
  const loyaltyEarned = Math.floor(duration * LOYALTY_POINTS_PER_HOUR)

  const newReservation = {
    id: Date.now(),
    userName,
    objectName,
    date,
    startTime,
    endTime,
    duration,
    pricePerHour: Number(pricePerHour),
    totalPrice: Number(pricePerHour) * duration,
    status,
    loyaltyEarned,
    reviewed: false,
  }

  data.reservations.push(newReservation)

  if (status === "CONFIRMED") {
    addLoyaltyPoints(data, userName, loyaltyEarned)

    addNotification(data, {
      userName,
      type: "CONFIRMATION",
      title: "Rezervacija potvrđena",
      message: `${objectName}, ${date} ${startTime}–${endTime}. Ukupno ${newReservation.totalPrice} KM. +${loyaltyEarned} loyalty bodova.`,
      reservationId: newReservation.id,
    })

    const user = data.users.find((u) => u.name === userName)
    if (user?.remindersEnabled !== false) {
      addNotification(data, {
        userName,
        type: "REMINDER_SCHEDULED",
        title: "Podsjetnik zakazan",
        message: `Poslaćemo podsjetnik dan prije termina (${date}).`,
        reservationId: newReservation.id,
      })
    }
  }

  await writeData(data)

  const user = data.users.find((u) => u.name === userName)

  res.status(201).json({
    success: true,
    message: "Rezervacija je uspješno dodana.",
    data: newReservation,
    loyaltyEarned,
    loyaltyPoints: user?.loyaltyPoints ?? 0,
  })
}

export async function cancelReservation(req, res) {
  const id = Number(req.params.id)
  const { userName } = req.body

  const data = await readData()

  const reservation = data.reservations.find((r) => r.id === id)

  if (!reservation) {
    return res.status(404).json({
      success: false,
      message: "Rezervacija nije pronađena.",
    })
  }

  if (reservation.status === "CANCELLED") {
    return res.status(400).json({
      success: false,
      message: "Rezervacija je već otkazana.",
    })
  }

  if (isReservationPast(reservation.date, reservation.startTime)) {
    return res.status(400).json({
      success: false,
      message: "Ne možete otkazati termin koji je već počeo.",
    })
  }

  const withRefund = canCancelWithRefund(reservation.date, reservation.startTime)
  const policyMessage = getCancellationPolicyMessage(
    reservation.date,
    reservation.startTime
  )

  reservation.status = "CANCELLED"
  reservation.cancelledAt = new Date().toISOString()
  reservation.refundEligible = withRefund

  if (withRefund && reservation.loyaltyEarned) {
    deductLoyaltyPoints(data, reservation.userName, reservation.loyaltyEarned)
  }

  addNotification(data, {
    userName: reservation.userName,
    type: "CANCELLATION",
    title: "Rezervacija otkazana",
    message: `${reservation.objectName}, ${reservation.date}. ${policyMessage}`,
    reservationId: reservation.id,
  })

  await writeData(data)

  const user = data.users.find((u) => u.name === reservation.userName)

  res.json({
    success: true,
    message: withRefund
      ? "Rezervacija je otkazana. Povrat sredstava i loyalty bodova."
      : "Rezervacija je otkazana bez povrata (pravilo 24h).",
    data: reservation,
    policyMessage,
    refundEligible: withRefund,
    loyaltyPoints: user?.loyaltyPoints ?? 0,
  })
}

export async function updateReservation(req, res) {
  const id = Number(req.params.id)
  const data = await readData()

  const reservationIndex = data.reservations.findIndex(
    (reservation) => reservation.id === id
  )

  if (reservationIndex === -1) {
    return res.status(404).json({
      success: false,
      message: "Rezervacija nije pronađena.",
    })
  }

  data.reservations[reservationIndex] = {
    ...data.reservations[reservationIndex],
    ...req.body,
  }

  await writeData(data)

  res.json({
    success: true,
    message: "Rezervacija uspješno izmijenjena.",
    data: data.reservations[reservationIndex],
  })
}

export async function deleteReservation(req, res) {
  const id = Number(req.params.id)
  const data = await readData()

  data.reservations = data.reservations.filter(
    (reservation) => reservation.id !== id
  )

  await writeData(data)

  res.json({
    success: true,
    message: "Rezervacija uspješno obrisana.",
  })
}
