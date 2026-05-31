import { readData, writeData } from "../config/fileStorage.js"
import { ensureReminderNotifications } from "../services/notificationService.js"

export async function getNotifications(req, res) {
  const { userName } = req.query

  if (!userName) {
    return res.status(400).json({
      success: false,
      message: "userName je obavezan.",
    })
  }

  let data = await readData()
  data = ensureReminderNotifications(data)
  await writeData(data)

  const notifications = data.notifications
    .filter((n) => n.userName === userName)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  res.json({
    success: true,
    data: notifications,
    unreadCount: notifications.filter((n) => !n.read).length,
  })
}

export async function markNotificationRead(req, res) {
  const id = Number(req.params.id)
  const data = await readData()

  const notification = data.notifications?.find((n) => n.id === id)

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: "Notifikacija nije pronađena.",
    })
  }

  notification.read = true
  await writeData(data)

  res.json({ success: true, data: notification })
}

export async function markAllNotificationsRead(req, res) {
  const { userName } = req.body

  const data = await readData()

  data.notifications?.forEach((n) => {
    if (n.userName === userName) {
      n.read = true
    }
  })

  await writeData(data)

  res.json({ success: true, message: "Sve notifikacije označene kao pročitane." })
}
