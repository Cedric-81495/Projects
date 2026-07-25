import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useIdleTimer } from '../../hooks/useIdleTimer';
import { SessionTimeoutModal } from '../ui/SessionTimeoutModal';
import { apiFetch } from '../../lib/api';

// Idle for 13 minutes -> show "still there?" warning.
// From that point, 2 more minutes (countdown shown to the user) -> auto logout.
// 13 + 2 = 15 minutes total, matching the access token's own expiry, so the
// warning appears right around when silent refresh would otherwise kick in.
const WARNING_AFTER_MS = 13 * 60 * 1000;
const IDLE_AFTER_MS = 15 * 60 * 1000;
const COUNTDOWN_SECONDS = (IDLE_AFTER_MS - WARNING_AFTER_MS) / 1000;

export function SessionManager() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);

  const handleWarning = useCallback(() => {
    setShowWarning(true);
  }, []);

  const handleIdle = useCallback(async () => {
    setShowWarning(false);
    await logout();
    navigate('/login');
  }, [logout, navigate]);

  const { resetTimers } = useIdleTimer({
    warningTimeout: WARNING_AFTER_MS,
    idleTimeout: IDLE_AFTER_MS,
    onWarning: handleWarning,
    onIdle: handleIdle,
    enabled: !!user,
  });

  async function handleStayLoggedIn() {
    setShowWarning(false);
    try {
      // Proactively refresh the access token rather than waiting for the
      // next request to hit a 401 and retry.
      await apiFetch('/api/auth/refresh', { method: 'POST' });
    } catch {
      // If refresh itself fails (e.g. refresh token already expired),
      // fall back to logging out cleanly.
      await logout();
      navigate('/login');
      return;
    }
    resetTimers();
  }

  async function handleLogoutNow() {
    setShowWarning(false);
    await logout();
    navigate('/login');
  }

  if (!user || !showWarning) return null;

  return (
    <SessionTimeoutModal
      countdownSeconds={COUNTDOWN_SECONDS}
      onStayLoggedIn={handleStayLoggedIn}
      onLogoutNow={handleLogoutNow}
    />
  );
}
