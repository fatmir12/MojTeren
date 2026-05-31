import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

function ProtectedRoute({ children, allowedRoles, requiredSpecialProfile }) {
  const { currentUser } = useAuth()

  if (!currentUser) {
    return <Navigate to="/login" />
  }

  if (!allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/login" />
  }

  if (requiredSpecialProfile) {
    if (
      currentUser.specialProfile !== requiredSpecialProfile ||
      currentUser.specialProfileStatus !== "VALIDATED"
    ) {
      return <Navigate to="/user/home" replace />
    }
  }

  return children
}

export default ProtectedRoute
