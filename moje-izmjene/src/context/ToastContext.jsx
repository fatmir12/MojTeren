import { createContext, useCallback, useContext, useState } from "react"

const ToastContext = createContext(null)

let toastId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (message, type = "success", duration = 4000) => {
      const id = ++toastId
      setToasts((prev) => [...prev, { id, message, type }])

      setTimeout(() => dismiss(id), duration)
    },
    [dismiss]
  )

  const toast = {
    success: (msg) => showToast(msg, "success"),
    error: (msg) => showToast(msg, "error", 5000),
    info: (msg) => showToast(msg, "info"),
  }

  return (
    <ToastContext.Provider value={{ toast, toasts, dismiss }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error("useToast mora biti unutar ToastProvider")
  }
  return ctx
}
