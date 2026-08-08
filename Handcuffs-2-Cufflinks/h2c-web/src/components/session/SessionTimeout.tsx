import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Row } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useIdleTimer } from '@/hooks/useIdleTimer';
import { useAuth } from '@/providers/context/auth';
import { useMember } from '@/providers/context/member';
import { useScrollLock } from '@/hooks/useScrollLock';
import { ROUTES } from '@/router/routes';

/**
 * Idle session guard.
 *
 * After twenty minutes without activity the visitor is asked whether they are
 * still there. Sixty seconds later, with no answer, the session ends and the
 * tokens are cleared.
 *
 * The point is the unattended machine — a VA who publishes an episode and walks
 * away from a shared desk, leaving the CMS open behind them. The warning exists
 * so nobody loses work to that policy: twenty minutes of silence is a good
 * guess that someone has left, and a bad enough guess that it must be possible
 * to say "no, I am here".
 *
 * It covers both session types, because both can be left open on the same
 * machine. Whichever is signed in is what gets ended; if somebody is signed in
 * as both staff and member, both are.
 */

const IDLE_MS = 20 * 60 * 1000;
const GRACE_MS = 60 * 1000;

export function SessionTimeout() {
  const { user, signOut: signOutStaff } = useAuth();
  const { member, signOut: signOutMember } = useMember();
  const navigate = useNavigate();
  const location = useLocation();

  const [warning, setWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(GRACE_MS / 1000);
  const [busy, setBusy] = useState(false);
  const continueRef = useRef<HTMLButtonElement>(null);

  const signedIn = Boolean(user || member);
  useScrollLock(warning);

  const endSession = useCallback(async () => {
    setBusy(true);
    const wasStaff = Boolean(user);
    try {
      await Promise.all([user ? signOutStaff() : null, member ? signOutMember() : null]);
    } finally {
      setBusy(false);
      setWarning(false);
      // Staff land back on the CMS sign-in, because the page behind the dialog
      // is one they can no longer load. A member is usually reading a public
      // page that works perfectly well signed out, so they stay where they are.
      if (wasStaff && location.pathname.startsWith('/admin')) {
        navigate(ROUTES.signIn, { replace: true, state: { reason: 'timeout' } });
      }
    }
  }, [user, member, signOutStaff, signOutMember, navigate, location.pathname]);

  const { reset } = useIdleTimer({
    idleMs: IDLE_MS,
    graceMs: GRACE_MS,
    enabled: signedIn,
    onWarn: () => {
      setSecondsLeft(GRACE_MS / 1000);
      setWarning(true);
    },
    onExpire: () => void endSession(),
  });

  /**
   * Continuing calls the API, rather than only restarting the local timer.
   *
   * The refresh token rotates on use, so this is what actually extends the
   * session on the server — clearing the dialog without it would leave someone
   * looking at a CMS whose next save fails.
   */
  const staySignedIn = useCallback(async () => {
    setBusy(true);
    try {
      const { apiGet, apiPost } = await import('@/lib/api/client');
      if (user) await apiGet('/auth/me');
      if (member) await apiPost('/members/refresh');
      setWarning(false);
      reset();
    } catch {
      // The session is already gone on the server, so honour that rather than
      // pretending otherwise.
      await endSession();
    } finally {
      setBusy(false);
    }
  }, [user, member, reset, endSession]);

  // Visible countdown. Ticks in the component rather than the hook because it
  // is presentation — the hook's own timer is what actually ends the session.
  useEffect(() => {
    if (!warning) return;
    const id = setInterval(() => setSecondsLeft((n) => Math.max(0, n - 1)), 1000);
    return () => clearInterval(id);
  }, [warning]);

  // Focus moves to the safe action, so Enter keeps you signed in.
  useEffect(() => {
    if (warning) continueRef.current?.focus();
  }, [warning]);

  // Escape means "I am here" — the destructive path should never be the one a
  // stray keypress takes.
  useEffect(() => {
    if (!warning) return;
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') void staySignedIn();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [warning, staySignedIn]);

  if (!warning || !signedIn) return null;

  return (
    <div className="sessionscrim">
      <div
        className="sessiondlg"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="session-title"
        aria-describedby="session-body"
      >
        <p className="h-xs" id="session-title">
          Are you still there?
        </p>
        <p className="body" id="session-body">
          You have been inactive for a while. For security, this session will end
          automatically — anything unsaved will be lost.
        </p>

        {/* Announced on a coarser interval than it is drawn: a screen reader
            reading every second would drown out the buttons. */}
        <p className="sessioncount" aria-live="polite">
          <b>{secondsLeft}</b>
          <span>{secondsLeft === 1 ? 'second left' : 'seconds left'}</span>
        </p>

        <Row>
          <Button
            ref={continueRef}
            variant="gold"
            onClick={() => void staySignedIn()}
            disabled={busy}
          >
            {busy ? <Spinner size="sm" label="Working" /> : null}
            {busy ? 'One moment' : 'Continue my session'}
          </Button>
          <Button variant="ghost" onClick={() => void endSession()} disabled={busy}>
            Sign out now
          </Button>
        </Row>
      </div>
    </div>
  );
}
