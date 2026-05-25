export function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

export function minutesToTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
}

export function isHourLocked(term, hourStart) {
  if (!term) return false
  if (term.status === "LOCKED") return true
  return (term.lockedSlots || []).includes(hourStart)
}

export function getHourStartsInRange(startTime, endTime) {
  const hours = []
  for (
    let m = timeToMinutes(startTime);
    m < timeToMinutes(endTime);
    m += 60
  ) {
    hours.push(minutesToTime(m))
  }
  return hours
}

export function normalizeSlotsPayload(body, term) {
  if (body.slots && Array.isArray(body.slots) && body.slots.length > 0) {
    return body.slots
  }

  if (body.startTime && body.endTime) {
    const start = timeToMinutes(body.startTime)
    const end = timeToMinutes(body.endTime)
    const termStart = timeToMinutes(term.startTime)
    const termEnd = timeToMinutes(term.endTime)

    if (start >= end) return null

    const slots = []
    for (let m = Math.max(start, termStart); m < Math.min(end, termEnd); m += 60) {
      slots.push(minutesToTime(m))
    }
    return slots.length > 0 ? slots : null
  }

  if (body.hourStart) {
    return [body.hourStart]
  }

  return null
}

export function reservationOverlapsSlots(reservation, slots) {
  return slots.some((hourStart) => {
    const hourEnd = minutesToTime(timeToMinutes(hourStart) + 60)
    return (
      timeToMinutes(hourStart) < timeToMinutes(reservation.endTime) &&
      timeToMinutes(hourEnd) > timeToMinutes(reservation.startTime)
    )
  })
}
