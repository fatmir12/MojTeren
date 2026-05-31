function getTomorrowDate() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

export function ensureReminderNotifications(data) {
  if (!data.notifications) {
    data.notifications = []
  }

  const tomorrow = getTomorrowDate()

  const activeReservations = data.reservations.filter(
    (r) => r.status === "CONFIRMED" && r.date === tomorrow
  )

  activeReservations.forEach((reservation) => {
    const exists = data.notifications.some(
      (n) =>
        n.type === "REMINDER" &&
        n.reservationId === reservation.id &&
        n.userName === reservation.userName
    )

    if (!exists) {
      data.notifications.push({
        id: Date.now() + Math.random(),
        userName: reservation.userName,
        reservationId: reservation.id,
        type: "REMINDER",
        title: "Podsjetnik za rezervaciju",
        message: `Sutra imate termin: ${reservation.objectName}, ${reservation.date} ${reservation.startTime}–${reservation.endTime}.`,
        read: false,
        createdAt: new Date().toISOString(),
      })
    }
  })

  return data
}

export function addNotification(data, { userName, type, title, message, reservationId }) {
  if (!data.notifications) {
    data.notifications = []
  }

  data.notifications.unshift({
    id: Date.now(),
    userName,
    type,
    title,
    message,
    reservationId: reservationId || null,
    read: false,
    createdAt: new Date().toISOString(),
  })
}
