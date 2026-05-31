import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

<<<<<<< HEAD
function ProtectedRoute({ children, allowedRoles, requiredSpecialProfile }) {
=======
function ProtectedRoute({ children, allowedRoles }) {
>>>>>>> 4ffb565aaf6b17a6fe10e4e498a6a39ffe35c473
  const { currentUser } = useAuth()

  if (!currentUser) {
    return <Navigate to="/login" />
  }

  if (!allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/login" />
  }

<<<<<<< HEAD
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
=======
  return children
}

export default ProtectedRoute
>>>>>>> 4ffb565aaf6b17a6fe10e4e498a6a39ffe35c473
