export function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

export function minutesToTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
}

export function getTimeOptions(startTime, endTime, stepMinutes = 60) {
  const start = timeToMinutes(startTime)
  const end = timeToMinutes(endTime)
  const options = []

  for (let time = start; time <= end; time += stepMinutes) {
    options.push(minutesToTime(time))
  }

  return options
}

const ACTIVE_RESERVATION_STATUSES = ["CONFIRMED", "WAITING_PAYMENT", "CREATED"]

export function isHourLocked(term, hourStart) {
  if (!term) return false
  if (term.status === "LOCKED") return true
  return (term.lockedSlots || []).includes(hourStart)
}

export function isHourReserved(hourStart, hourEnd, reservations, objectName, date) {
  return reservations.some(
    (reservation) =>
      reservation.objectName === objectName &&
      reservation.date === date &&
      ACTIVE_RESERVATION_STATUSES.includes(reservation.status) &&
      timeToMinutes(hourStart) < timeToMinutes(reservation.endTime) &&
      timeToMinutes(hourEnd) > timeToMinutes(reservation.startTime)
  )
}

/** Satnice za objekat i datum – status: FREE | RESERVED | LOCKED */
export function getHourlySlots(terms, reservations, objectName, date, rangeStart, rangeEnd) {
  const objectTerms = terms.filter(
    (term) =>
      term.objectName === objectName &&
      term.date === date &&
      term.status !== "CANCELLED"
  )

  if (objectTerms.length === 0) return []

  const slots = []
  const filterStart = timeToMinutes(rangeStart)
  const filterEnd = timeToMinutes(rangeEnd)

  objectTerms.forEach((term) => {
    const termStart = timeToMinutes(term.startTime)
    const termEnd = timeToMinutes(term.endTime)
    const start = Math.max(termStart, filterStart)
    const end = Math.min(termEnd, filterEnd)

    for (let minutes = start; minutes < end; minutes += 60) {
      const hourStart = minutesToTime(minutes)
      const hourEnd = minutesToTime(minutes + 60)

      let status = "FREE"
      let label = "Slobodno"
      const hourLocked = isHourLocked(term, hourStart)
      const hourReserved = isHourReserved(
        hourStart,
        hourEnd,
        reservations,
        objectName,
        date
      )

      if (hourReserved) {
        status = "RESERVED"
        label = "Rezervisano"
      } else if (hourLocked) {
        status = "LOCKED"
        label = "Zaključan"
      } else if (term.status === "RESERVED") {
        status = "RESERVED"
        label = "Rezervisano"
      }

      const exists = slots.some((s) => s.startTime === hourStart)
      if (!exists) {
        slots.push({
          startTime: hourStart,
          endTime: hourEnd,
          status,
          label,
          price: term.price,
          objectName,
          date,
          dayLocked: hourLocked,
        })
      }
    }
  })

  return slots.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
}

export function getOperatingWindow(terms, objectName, date) {
  const objectTerms = terms.filter(
    (term) => term.objectName === objectName && term.date === date && term.status === "FREE"
  )

  if (objectTerms.length === 0) {
    return { startTime: "08:00", endTime: "22:00" }
  }

  const starts = objectTerms.map((t) => timeToMinutes(t.startTime))
  const ends = objectTerms.map((t) => timeToMinutes(t.endTime))

  return {
    startTime: minutesToTime(Math.min(...starts)),
    endTime: minutesToTime(Math.max(...ends)),
  }
}

/** Radni prozor za objekat i datum (svi termini, ne samo FREE) */
export function getObjectDayWindow(terms, objectName, date) {
  const objectTerms = terms.filter(
    (term) => term.objectName === objectName && term.date === date
  )

  if (objectTerms.length === 0) return null

  const starts = objectTerms.map((t) => timeToMinutes(t.startTime))
  const ends = objectTerms.map((t) => timeToMinutes(t.endTime))

  return {
    startTime: minutesToTime(Math.min(...starts)),
    endTime: minutesToTime(Math.max(...ends)),
  }
}

export function findReservationForHour(reservations, objectName, date, hourStart, hourEnd) {
  return reservations.find(
    (reservation) =>
      reservation.objectName === objectName &&
      reservation.date === date &&
      ACTIVE_RESERVATION_STATUSES.includes(reservation.status) &&
      timeToMinutes(hourStart) < timeToMinutes(reservation.endTime) &&
      timeToMinutes(hourEnd) > timeToMinutes(reservation.startTime)
  )
}

/** Satnice za radnički pregled – sa podacima o rezervaciji */
export function getWorkerHourlySlots(terms, reservations, objectName, date) {
  const window = getObjectDayWindow(terms, objectName, date)

  if (!window) return []

  const slots = getHourlySlots(
    terms,
    reservations,
    objectName,
    date,
    window.startTime,
    window.endTime
  )

  return slots.map((slot) => {
    const reservation = findReservationForHour(
      reservations,
      objectName,
      date,
      slot.startTime,
      slot.endTime
    )

    return {
      ...slot,
      reservation,
      userName: reservation?.userName ?? null,
    }
  })
}

/** Aktivne rezervacije za objekat i datum */
export function getActiveReservationsForDay(reservations, objectName, date) {
  return reservations.filter(
    (r) =>
      r.objectName === objectName &&
      r.date === date &&
      ACTIVE_RESERVATION_STATUSES.includes(r.status)
  )
}

/** Objekti koji imaju termin na određeni datum */
export function getActiveReservationsForSlots(
  reservations,
  objectName,
  date,
  slots
) {
  return reservations.filter(
    (r) =>
      r.objectName === objectName &&
      r.date === date &&
      ACTIVE_RESERVATION_STATUSES.includes(r.status) &&
      slots.some((hourStart) => {
        const hourEnd = minutesToTime(timeToMinutes(hourStart) + 60)
        return (
          timeToMinutes(hourStart) < timeToMinutes(r.endTime) &&
          timeToMinutes(hourEnd) > timeToMinutes(r.startTime)
        )
      })
  )
}

export function getObjectsForDate(terms, objects, date) {
  const names = new Set(
    terms.filter((t) => t.date === date).map((t) => t.objectName)
  )

  return objects.filter((o) => names.has(o.name))
}

function pushFreeSegments(term, rangeStart, rangeEnd, slots) {
  if (timeToMinutes(rangeStart) >= timeToMinutes(rangeEnd)) return

  let segmentStart = rangeStart

  for (
    let m = timeToMinutes(rangeStart);
    m < timeToMinutes(rangeEnd);
    m += 60
  ) {
    const hourStart = minutesToTime(m)
    const hourEnd = minutesToTime(m + 60)

    if (isHourLocked(term, hourStart)) {
      if (timeToMinutes(segmentStart) < m) {
        slots.push({
          objectName: term.objectName,
          date: term.date,
          startTime: segmentStart,
          endTime: hourStart,
          price: term.price,
        })
      }
      segmentStart = hourEnd
    }
  }

  if (timeToMinutes(segmentStart) < timeToMinutes(rangeEnd)) {
    slots.push({
      objectName: term.objectName,
      date: term.date,
      startTime: segmentStart,
      endTime: rangeEnd,
      price: term.price,
    })
  }
}

export function getFreeBookingSlots(terms, reservations, objectName, date) {
  const slots = []

  terms
    .filter(
      (term) =>
        term.objectName === objectName &&
        term.date === date &&
        term.status === "FREE"
    )
    .forEach((term) => {
      const relatedReservations = reservations
        .filter(
          (reservation) =>
            reservation.objectName === term.objectName &&
            reservation.date === term.date &&
            ACTIVE_RESERVATION_STATUSES.includes(reservation.status)
        )
        .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))

      let currentStart = term.startTime

      relatedReservations.forEach((reservation) => {
        if (timeToMinutes(currentStart) < timeToMinutes(reservation.startTime)) {
          pushFreeSegments(
            term,
            currentStart,
            reservation.startTime,
            slots
          )
        }

        if (timeToMinutes(reservation.endTime) > timeToMinutes(currentStart)) {
          currentStart = reservation.endTime
        }
      })

      pushFreeSegments(term, currentStart, term.endTime, slots)
    })

  return slots
}

export function countFreeHourlySlots(terms, reservations) {
  const today = new Date().toISOString().slice(0, 10)
  let count = 0

  terms
    .filter((term) => term.status === "FREE" && term.date >= today)
    .forEach((term) => {
      const hourly = getHourlySlots(
        [term],
        reservations,
        term.objectName,
        term.date,
        term.startTime,
        term.endTime
      )
      count += hourly.filter((slot) => slot.status === "FREE").length
    })

  return count
}

const DAY_NAMES = ["Ned", "Pon", "Uto", "Sri", "Čet", "Pet", "Sub"]

/** Narednih 7 dana od danas (uključujući danas) */
export function getNext7Days(baseDate = new Date()) {
  const days = []

  for (let i = 0; i < 7; i++) {
    const d = new Date(baseDate)
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() + i)

    days.push({
      date: d.toISOString().slice(0, 10),
      dayName: DAY_NAMES[d.getDay()],
      dayNumber: d.getDate(),
      month: d.getMonth() + 1,
      isToday: i === 0,
    })
  }

  return days
}

/**
 * Dostupnost objekta za jedan dan
 * status: none | available | partial | full
 */
export function getDayAvailability(terms, reservations, objectName, date) {
  const objectTerms = terms.filter(
    (term) =>
      term.objectName === objectName &&
      term.date === date &&
      term.status === "FREE"
  )

  if (objectTerms.length === 0) {
    const hasAnyTerm = terms.some(
      (term) => term.objectName === objectName && term.date === date
    )

    return {
      status: "none",
      label: hasAnyTerm ? "Nedostupan" : "Nema termina",
      freeHours: 0,
      totalHours: 0,
    }
  }

  let freeHours = 0
  let totalHours = 0

  objectTerms.forEach((term) => {
    const hourly = getHourlySlots(
      terms,
      reservations,
      objectName,
      date,
      term.startTime,
      term.endTime
    )

    totalHours += hourly.length
    freeHours += hourly.filter((slot) => slot.status === "FREE").length
  })

  if (totalHours === 0) {
    return { status: "none", label: "Nema termina", freeHours: 0, totalHours: 0 }
  }

  if (freeHours === 0) {
    return { status: "full", label: "Popunjeno", freeHours: 0, totalHours }
  }

  if (freeHours === totalHours) {
    return {
      status: "available",
      label: "Slobodno",
      freeHours,
      totalHours,
    }
  }

  return {
    status: "partial",
    label: `${freeHours}h slob.`,
    freeHours,
    totalHours,
  }
}

export function getUpcomingFreeSlots(terms, reservations, limit = 8) {
  const today = new Date().toISOString().slice(0, 10)
  const result = []

  const sortedTerms = [...terms]
    .filter((term) => term.status === "FREE" && term.date >= today)
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      return timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    })

  for (const term of sortedTerms) {
    const freeSlots = getFreeBookingSlots(terms, reservations, term.objectName, term.date)

    for (const slot of freeSlots) {
      result.push(slot)
      if (result.length >= limit) return result
    }
  }

  return result
}
