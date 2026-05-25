import { useToast } from "../context/ToastContext"
import "../styles/toast.css"

function ToastContainer() {
  const { toasts, dismiss } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast toast--${t.type}`}
          role="alert"
        >
          <span className="toast-message">{t.message}</span>
          <button
            type="button"
            className="toast-close"
            onClick={() => dismiss(t.id)}
            aria-label="Zatvori"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}

export default ToastContainer
