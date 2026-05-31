export function getReservationStartDateTime(date, startTime) {
  return new Date(`${date}T${startTime}:00`)
}

export function getHoursUntilReservation(date, startTime) {
  const start = getReservationStartDateTime(date, startTime)
  const now = new Date()
  return (start - now) / (1000 * 60 * 60)
}

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
  return new Date(`${date}T${endTime}:00`) < new Date()
}

export function isReservationReviewable(reservation) {
  return (
    reservation.status === "CONFIRMED" &&
    isReservationPast(reservation.date, reservation.endTime) &&
    !reservation.reviewed
  )
}

export function canCancelReservation(reservation) {
  return (
    reservation.status === "CONFIRMED" &&
    getHoursUntilReservation(reservation.date, reservation.startTime) > 0
  )
}
