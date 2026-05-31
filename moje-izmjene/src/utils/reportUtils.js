import { getHourlySlots, timeToMinutes } from "./slotUtils"

const REVENUE_STATUSES = ["CONFIRMED", "WAITING_PAYMENT", "CREATED"]

export function isInDateRange(date, from, to) {
  if (from && date < from) return false
  if (to && date > to) return false
  return true
}

export function filterTerms(terms, { from, to, objectName }) {
  return terms.filter(
    (t) =>
      isInDateRange(t.date, from, to) &&
      (!objectName || t.objectName === objectName)
  )
}

export function filterReservations(reservations, { from, to, objectName }) {
  return reservations.filter(
    (r) =>
      REVENUE_STATUSES.includes(r.status) &&
      isInDateRange(r.date, from, to) &&
      (!objectName || r.objectName === objectName)
  )
}

/** Popunjenost: % rezervisanih vs ukupnih satnih mjesta u periodu */
export function computeOccupancy(terms, reservations, { from, to, objectName }) {
  const filteredTerms = filterTerms(terms, { from, to, objectName })
  let totalHours = 0
  let reservedHours = 0
  let freeHours = 0
  let lockedHours = 0

  const seen = new Set()

  filteredTerms.forEach((term) => {
    const key = `${term.objectName}|${term.date}`
    if (seen.has(key)) return

    const objectTerms = filteredTerms.filter(
      (t) => t.objectName === term.objectName && t.date === term.date
    )

    const windowStart = objectTerms.reduce(
      (min, t) => Math.min(min, timeToMinutes(t.startTime)),
      Infinity
    )
    const windowEnd = objectTerms.reduce(
      (max, t) => Math.max(max, timeToMinutes(t.endTime)),
      0
    )

    if (!Number.isFinite(windowStart)) return

    seen.add(key)

    const slots = getHourlySlots(
      terms,
      reservations,
      term.objectName,
      term.date,
      minutesToTime(windowStart),
      minutesToTime(windowEnd)
    )

    totalHours += slots.length
    reservedHours += slots.filter((s) => s.status === "RESERVED").length
    freeHours += slots.filter((s) => s.status === "FREE").length
    lockedHours += slots.filter((s) => s.status === "LOCKED").length
  })

  const bookableHours = totalHours - lockedHours
  const occupancyPct =
    bookableHours > 0
      ? Math.round((reservedHours / bookableHours) * 100)
      : 0
  const freePct =
    bookableHours > 0 ? Math.round((freeHours / bookableHours) * 100) : 0

  return {
    totalHours,
    reservedHours,
    freeHours,
    lockedHours,
    occupancyPct,
    freePct,
  }
}

function minutesToTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
}

export function computeRevenueByObject(reservations, { from, to, objectName }) {
  const filtered = filterReservations(reservations, { from, to, objectName })
  const byObject = {}

  filtered.forEach((r) => {
    byObject[r.objectName] = (byObject[r.objectName] || 0) + r.totalPrice
  })

  return Object.entries(byObject)
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
}

export function computeRevenueByMonth(reservations, { from, to, objectName }) {
  const filtered = filterReservations(reservations, { from, to, objectName })
  const byMonth = {}

  filtered.forEach((r) => {
    const month = r.date.slice(0, 7)
    byMonth[month] = (byMonth[month] || 0) + r.totalPrice
  })

  return Object.entries(byMonth)
    .map(([month, revenue]) => ({ month, revenue }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

export function formatMonthLabel(ym) {
  const [y, m] = ym.split("-")
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Maj",
    "Jun",
    "Jul",
    "Avg",
    "Sep",
    "Okt",
    "Nov",
    "Dec",
  ]
  return `${months[Number(m) - 1]} ${y}`
}
