import { useEffect, useState } from "react"
import api from "../../services/api"

function NotificationsPanel({ userName, onUnreadChange }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userName) {
      fetchNotifications()
    }
  }, [userName])

  async function fetchNotifications() {
    try {
      setLoading(true)
      const response = await api.get("/notifications", {
        params: { userName },
      })
      setNotifications(response.data.data)
      onUnreadChange?.(response.data.unreadCount ?? 0)
    } catch {
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  async function markRead(id) {
    try {
      await api.put(`/notifications/${id}/read`)
      await fetchNotifications()
    } catch {
      /* ignore */
    }
  }

  async function markAllRead() {
    try {
      await api.put("/notifications/read-all", { userName })
      await fetchNotifications()
    } catch {
      /* ignore */
    }
  }

  if (loading) {
    return <div className="empty-state inline-empty">Učitavanje obavijesti...</div>
  }

  if (notifications.length === 0) {
    return (
      <div className="empty-state inline-empty">
        Nema obavijesti. Podsjetnici stižu dan prije termina.
      </div>
    )
  }

  return (
    <div className="notifications-panel">
      <div className="notifications-actions">
        <button type="button" className="text-btn" onClick={markAllRead}>
          Označi sve pročitano
        </button>
      </div>

      <ul className="notifications-list">
        {notifications.map((notification) => (
          <li
            key={notification.id}
            className={`notification-item ${notification.read ? "read" : "unread"}`}
          >
            <div className="notification-content">
              <strong>{notification.title}</strong>
              <p>{notification.message}</p>
              <span className="notification-time">
                {new Date(notification.createdAt).toLocaleString("bs-BA")}
              </span>
            </div>
            {!notification.read && (
              <button
                type="button"
                className="text-btn"
                onClick={() => markRead(notification.id)}
              >
                Pročitano
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default NotificationsPanel
