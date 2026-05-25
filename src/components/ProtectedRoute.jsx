import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser } = useAuth()

  if (!currentUser) {
    return <Navigate to="/login" />
  }

  if (!allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/login" />
  }

  return children
}

export default ProtectedRoute