import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LoadingBlock } from '../components/ui/Spinner'

/**
 * Gate for the admin area.
 *
 * This is a usability guard, not the security boundary — every /api/admin route
 * independently re-checks the role against the database. Hiding the UI from a
 * non-admin is presentation; the server is what actually refuses the data.
 */
export function AdminRoute() {
  const { user, initialising } = useAuth()
  const location = useLocation()

  if (initialising) return <LoadingBlock label="Checking your access" />

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }

  /**
   * A signed-in non-admin is sent to their own dashboard rather than to login —
   * they are authenticated, just not authorised, and a login prompt would be
   * confusing and unhelpful.
   */
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />

  return <Outlet />
}
