import { getHourStartsInRange } from "../utils/termLockUtils.js"
import { isActiveReservation } from "../utils/reservationRules.js"
import { emitEvent } from "./eventBus.js"
import { addNotification } from "./notificationService.js"

export const PAYMENT_LOCK_TTL_MS = 5 * 60 * 1000

function timeToMinutes(time) {
  const [h, m] = String(time).split(":").map(Number)
  return h * 60 + m
}

function ensureLocksArray(data) {
  if (!Array.isArray(data.locks)) data.locks = []
  return data.locks
}

export function cleanupExpiredLocks(data, nowMs = Date.now()) {
  const locks = ensureLocksArray(data)
  const active = []
  const expired = []

  for (const lock of locks) {
    if (Number(lock.expiresAtMs) <= nowMs) expired.push(lock)
    else active.push(lock)
  }

  if (expired.length === 0) return { expired: [], affectedReservationIds: [] }

  data.locks = active

  const affectedReservationIds = []

  for (const lock of expired) {
    if (lock.type !== "PAYMENT") continue
    if (!lock.reservationId) continue
    affectedReservationIds.push(lock.reservationId)
  }

  // If reservation is still waiting payment, cancel it.
  affectedReservationIds.forEach((reservationId) => {
    const reservation = data.reservations?.find((r) => r.id === reservationId)
    if (!reservation) return
    if (reservation.status !== "WAITING_PAYMENT") return

    reservation.status = "CANCELLED"
    reservation.cancelReason = "PAYMENT_TIMEOUT"
    reservation.cancelledAt = new Date().toISOString()

    addNotification(data, {
      userName: reservation.userName,
      type: "PAYMENT_EXPIRED",
      title: "Rezervacija istekla",
      message:
        "Zaključavanje termina je isteklo (5 min) jer plaćanje nije završeno. Termin je ponovo slobodan.",
      reservationId: reservation.id,
    })

    emitEvent("reservation.cancelled", { reservationId, reason: "PAYMENT_TIMEOUT" })
  })

  emitEvent("lock.expired", { count: expired.length, locks: expired })

  return { expired, affectedReservationIds }
}

export function getPaymentLockedSlotsForTerm(data, term) {
  const locks = ensureLocksArray(data)
  const now = Date.now()

  return locks
    .filter(
      (l) =>
        l.type === "PAYMENT" &&
        l.objectName === term.objectName &&
        l.date === term.date &&
        Number(l.expiresAtMs) > now
    )
    .map((l) => l.hourStart)
}

export function isSlotPaymentLocked(data, { objectName, date }, hourStart) {
  const locks = ensureLocksArray(data)
  const now = Date.now()

  return locks.some(
    (l) =>
      l.type === "PAYMENT" &&
      l.objectName === objectName &&
      l.date === date &&
      l.hourStart === hourStart &&
      Number(l.expiresAtMs) > now
  )
}

export function createPaymentLocksForReservation(data, reservation, ttlMs = PAYMENT_LOCK_TTL_MS) {
  const locks = ensureLocksArray(data)
  const now = Date.now()
  const expiresAtMs = now + ttlMs
  const hours = getHourStartsInRange(reservation.startTime, reservation.endTime)

  const newLocks = hours.map((hourStart) => ({
    id: `${reservation.id}:${reservation.objectName}:${reservation.date}:${hourStart}`,
    type: "PAYMENT",
    reservationId: reservation.id,
    userName: reservation.userName,
    objectName: reservation.objectName,
    date: reservation.date,
    hourStart,
    createdAtMs: now,
    expiresAtMs,
  }))

  newLocks.forEach((l) => locks.push(l))

  emitEvent("lock.created", {
    reservationId: reservation.id,
    objectName: reservation.objectName,
    date: reservation.date,
    slots: hours,
    expiresAtMs,
  })

  return { slots: hours, expiresAtMs, created: newLocks.length }
}

export function releaseLocksForReservation(data, reservationId) {
  const locks = ensureLocksArray(data)
  const before = locks.length
  data.locks = locks.filter((l) => l.reservationId !== reservationId)
  const removed = before - data.locks.length

  if (removed > 0) {
    emitEvent("lock.released", { reservationId, removed })
  }

  return removed
}

export function reservationOverlapsPaymentLocks(data, reservationLike) {
  const hours = getHourStartsInRange(reservationLike.startTime, reservationLike.endTime)
  return hours.some((hourStart) =>
    isSlotPaymentLocked(
      data,
      { objectName: reservationLike.objectName, date: reservationLike.date },
      hourStart
    )
  )
}

export function ensureReservationDoesNotConflictWithLocksOrReservations(data, reservationLike) {
  cleanupExpiredLocks(data)

  if (reservationOverlapsPaymentLocks(data, reservationLike)) {
    return {
      ok: false,
      message:
        "Odabrani termin je trenutno zaključan (u toku plaćanja drugog korisnika). Pokušajte ponovo za par minuta.",
    }
  }

  const overlap = (data.reservations || []).find((reservation) => {
    if (
      reservation.objectName !== reservationLike.objectName ||
      reservation.date !== reservationLike.date ||
      reservation.status === "CANCELLED"
    ) {
      return false
    }

    if (!isActiveReservation(reservation)) return false

    return (
      timeToMinutes(reservationLike.startTime) < timeToMinutes(reservation.endTime) &&
      timeToMinutes(reservationLike.endTime) > timeToMinutes(reservation.startTime)
    )
  })

  if (overlap) {
    return { ok: false, message: "Odabrani period je već rezerviran." }
  }

  return { ok: true }
}

