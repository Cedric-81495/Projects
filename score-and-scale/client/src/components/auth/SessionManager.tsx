import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useIdleTimer } from '../../hooks/useIdleTimer'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

const IDLE_TIMEOUT_MS = 20 * 60 * 1000
const WARN_BEFORE_MS = 2 * 60 * 1000

/**
 * Idle-session guard, mounted once at the app root.
 *
 * This is a courtesy on shared machines, not a security control — the real
 * limit is the 15-minute access token and the server-side refresh lineage.
 * Because of that it warns first rather than logging out silently, which would
 * lose whatever the user was in the middle of typing.
 */
export function SessionManager() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [warning, setWarning] = useState(false)

  const handleIdle = useCallback(async () => {
    setWarning(false)
    await logout()
    navigate('/login', { replace: true })
  }, [logout, navigate])

  const { reset } = useIdleTimer({
    timeout: IDLE_TIMEOUT_MS,
    warnAfter: WARN_BEFORE_MS,
    onWarning: () => setWarning(true),
    onIdle: () => void handleIdle(),
    // Only runs for signed-in users; a guest has no session to expire.
    enabled: Boolean(user),
  })

  const staySignedIn = () => {
    setWarning(false)
    reset()
  }

  return (
    <Modal
      open={warning && Boolean(user)}
      title="Still there?"
      description="You will be signed out automatically in about two minutes to keep your account secure."
      // No onClose: this is a decision the user should answer explicitly rather
      // than dismiss by clicking away.
      footer={
        <>
          <Button variant="ghost" size="md" onClick={() => void handleIdle()}>
            Sign out now
          </Button>
          <Button variant="primary" size="md" onClick={staySignedIn}>
            Stay signed in
          </Button>
        </>
      }
    />
  )
}
