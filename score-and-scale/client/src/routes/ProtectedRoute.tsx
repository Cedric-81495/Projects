import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LoadingBlock } from '../components/ui/Spinner'

/**
 * Gate for any authenticated route.
 *
 * Waiting on `initialising` is essential: the session lives in an httpOnly
 * cookie, so on a hard refresh the app cannot know who the user is until /me
 * resolves. Redirecting before then would bounce a signed-in user to the login
 * page on every reload.
 */
export function ProtectedRoute() {
  const { user, initialising } = useAuth()
  const location = useLocation()

  if (initialising) return <LoadingBlock label="Checking your session" />

  if (!user) {
    /**
     * The attempted destination travels in location state so login can return
     * the user there instead of dropping them on a generic dashboard.
     */
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }

  return <Outlet />
}
