import { useCallback, useEffect, useRef } from 'react';

interface UseIdleTimerOptions {
  /** Ms of inactivity before the warning fires. */
  warningTimeout: number;
  /** Ms of inactivity (from last activity, not from warning) before onIdle fires. */
  idleTimeout: number;
  onWarning: () => void;
  onIdle: () => void;
  /** Set false to pause tracking entirely (e.g. when logged out). */
  enabled?: boolean;
}

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  'mousemove',
  'mousedown',
  'keydown',
  'scroll',
  'touchstart',
  'wheel',
];

export function useIdleTimer({
  warningTimeout,
  idleTimeout,
  onWarning,
  onIdle,
  enabled = true,
}: UseIdleTimerOptions) {
  const warningTimer = useRef<ReturnType<typeof setTimeout>>();
  const idleTimer = useRef<ReturnType<typeof setTimeout>>();

  const clearTimers = useCallback(() => {
    if (warningTimer.current) clearTimeout(warningTimer.current);
    if (idleTimer.current) clearTimeout(idleTimer.current);
  }, []);

  const resetTimers = useCallback(() => {
    clearTimers();
    if (!enabled) return;
    warningTimer.current = setTimeout(onWarning, warningTimeout);
    idleTimer.current = setTimeout(onIdle, idleTimeout);
  }, [clearTimers, enabled, warningTimeout, idleTimeout, onWarning, onIdle]);

  useEffect(() => {
    if (!enabled) {
      clearTimers();
      return;
    }

    resetTimers();
    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, resetTimers));

    return () => {
      clearTimers();
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, resetTimers));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, warningTimeout, idleTimeout]);

  return { resetTimers };
}
