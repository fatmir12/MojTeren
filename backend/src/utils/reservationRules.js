function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

export function getReservationStartDateTime(date, startTime) {
  return new Date(`${date}T${startTime}:00`)
}

export function getHoursUntilReservation(date, startTime) {
  const start = getReservationStartDateTime(date, startTime)
  const now = new Date()
  return (start - now) / (1000 * 60 * 60)
}

/** Besplatno otkazivanje ako je više od 24h do početka */
export function canCancelWithRefund(date, startTime) {
  return getHoursUntilReservation(date, startTime) >= 24
}

export function getCancellationPolicyMessage(date, startTime) {
  const hours = getHoursUntilReservation(date, startTime)

  if (hours < 0) {
    return "Termin je već prošao."
  }

  if (hours >= 24) {
    return "Besplatno otkazivanje – povrat punog iznosa i loyalty bodova."
  }

  return `Otkazivanje manje od 24h prije termina (${Math.max(0, Math.floor(hours))}h preostalo) – bez povrata novca.`
}

export function isReservationPast(date, endTime) {
  const end = new Date(`${date}T${endTime}:00`)
  return end < new Date()
}

export function isReservationReviewable(reservation) {
  return (
    reservation.status === "CONFIRMED" &&
    isReservationPast(reservation.date, reservation.endTime)
  )
}

export const LOYALTY_POINTS_PER_HOUR = 10

export const ACTIVE_RESERVATION_STATUSES = [
  "CONFIRMED",
  "WAITING_PAYMENT",
  "CREATED",
]

export function isActiveReservation(reservation) {
  return ACTIVE_RESERVATION_STATUSES.includes(reservation.status)
}
