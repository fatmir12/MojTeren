import { Routes, Route, Navigate } from "react-router-dom"

import Login from "../pages/auth/Login"
import Register from "../pages/auth/Register"

import OwnerDashboard from "../pages/owner/Dashboard"
import Objects from "../pages/owner/Objects"
import Workers from "../pages/owner/Workers"
import Reports from "../pages/owner/Reports"

import WorkerDashboard from "../pages/worker/Dashboard"
import Reservations from "../pages/worker/Reservations"
import Schedule from "../pages/worker/Schedule"
import WorkerProfile from "../pages/worker/Profile"
import Terms from "../pages/worker/Terms"

import Home from "../pages/user/Home"
import Courts from "../pages/user/Courts"
import Reservation from "../pages/user/Reservation"
import History from "../pages/user/History"
import UserProfile from "../pages/user/Profile"

import OwnerLayout from "../layouts/OwnerLayout"
import WorkerLayout from "../layouts/WorkerLayout"
import UserLayout from "../layouts/UserLayout"

import ProtectedRoute from "../components/ProtectedRoute"

import NotFound from "../pages/NotFound"

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      

      <Route path="/owner/dashboard" element={<ProtectedRoute allowedRoles={["OWNER"]}><OwnerLayout><OwnerDashboard /></OwnerLayout></ProtectedRoute>} />
      <Route path="/owner/objects" element={<ProtectedRoute allowedRoles={["OWNER"]}><OwnerLayout><Objects /></OwnerLayout></ProtectedRoute>} />
      <Route path="/owner/workers" element={<ProtectedRoute allowedRoles={["OWNER"]}><OwnerLayout><Workers /></OwnerLayout></ProtectedRoute>} />
      <Route path="/owner/reports" element={<ProtectedRoute allowedRoles={["OWNER"]}><OwnerLayout><Reports /></OwnerLayout></ProtectedRoute>} />

      <Route path="/worker/dashboard" element={<ProtectedRoute allowedRoles={["WORKER"]}><WorkerLayout><WorkerDashboard /></WorkerLayout></ProtectedRoute>} />
      <Route path="/worker/reservations" element={<ProtectedRoute allowedRoles={["WORKER"]}><WorkerLayout><Reservations /></WorkerLayout></ProtectedRoute>} />
      <Route path="/worker/schedule" element={<ProtectedRoute allowedRoles={["WORKER"]}><WorkerLayout><Schedule /></WorkerLayout></ProtectedRoute>} />
      <Route path="/worker/profile" element={<ProtectedRoute allowedRoles={["WORKER"]}><WorkerLayout><WorkerProfile /></WorkerLayout></ProtectedRoute>} />
      <Route path="/worker/terms" element={<ProtectedRoute allowedRoles={["WORKER"]}><WorkerLayout><Terms /></WorkerLayout></ProtectedRoute>} />

      <Route path="/user/home" element={<ProtectedRoute allowedRoles={["USER"]}><UserLayout><Home /></UserLayout></ProtectedRoute>} />
      <Route path="/user/courts" element={<ProtectedRoute allowedRoles={["USER"]}><UserLayout><Courts /></UserLayout></ProtectedRoute>} />
      <Route path="/user/reservation" element={<ProtectedRoute allowedRoles={["USER"]}><UserLayout><Reservation /></UserLayout></ProtectedRoute>} />
      <Route path="/user/history" element={<ProtectedRoute allowedRoles={["USER"]}><UserLayout><History /></UserLayout></ProtectedRoute>} />
      <Route path="/user/profile" element={<ProtectedRoute allowedRoles={["USER"]}><UserLayout><UserProfile /></UserLayout></ProtectedRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default AppRoutes