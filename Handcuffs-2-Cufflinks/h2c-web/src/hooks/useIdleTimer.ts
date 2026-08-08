import { useCallback, useEffect, useRef } from 'react';

/**
 * Idle detection for signed-in sessions.
 *
 * Two timers rather than one: a warning fires first, and expiry follows only if
 * nobody answers it. Signing someone out with no warning loses whatever they
 * were typing, which on a CMS means a half-written episode.
 *
 * Activity is anything a person does — pointer, keyboard, scroll, touch — and
 * is throttled, because mousemove alone fires often enough to matter on a
 * cheap phone. Once the warning is on screen activity deliberately stops
 * resetting the timer: the dialog asks a question, and moving the mouse to read
 * it is not an answer.
 *
 * Tabs share the countdown through localStorage. Someone working in the CMS
 * with the public site open in a second tab is not idle, and being signed out
 * of the tab they are not looking at would be surprising in exactly the way a
 * security control should not be.
 */

const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'scroll', 'touchstart', 'wheel'] as const;
/** One write per second at most; the timers work in minutes. */
const THROTTLE_MS = 1000;
const STORAGE_KEY = 'h2c.last-activity';

interface Options {
  /** Milliseconds of inactivity before `onWarn` fires. */
  idleMs: number;
  /** Milliseconds after the warning before `onExpire` fires. */
  graceMs: number;
  enabled: boolean;
  onWarn: () => void;
  onExpire: () => void;
}

export function useIdleTimer({ idleMs, graceMs, enabled, onWarn, onExpire }: Options): {
  reset: () => void;
} {
  const warnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expireTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warned = useRef(false);
  const lastWrite = useRef(0);

  // Held in refs so changing a callback does not tear down and restart the
  // timers — which would hand the visitor a fresh twenty minutes on every
  // render of the component that owns them.
  const warnRef = useRef(onWarn);
  const expireRef = useRef(onExpire);
  warnRef.current = onWarn;
  expireRef.current = onExpire;

  const clear = useCallback(() => {
    if (warnTimer.current) clearTimeout(warnTimer.current);
    if (expireTimer.current) clearTimeout(expireTimer.current);
    warnTimer.current = null;
    expireTimer.current = null;
  }, []);

  const start = useCallback(() => {
    clear();
    warned.current = false;

    warnTimer.current = setTimeout(() => {
      warned.current = true;
      warnRef.current();
      expireTimer.current = setTimeout(() => expireRef.current(), graceMs);
    }, idleMs);
  }, [clear, graceMs, idleMs]);

  /** Restarts the countdown, and tells the other tabs to do the same. */
  const reset = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      // Private browsing can refuse storage. The timer still works in this tab;
      // only the cross-tab part is lost, which is a degraded feature, not a
      // broken one.
    }
    start();
  }, [start]);

  useEffect(() => {
    if (!enabled) {
      clear();
      return;
    }

    start();

    const onActivity = (): void => {
      // The warning is a question. Answering it takes a click on the dialog,
      // not a scroll behind it.
      if (warned.current) return;

      const now = Date.now();
      if (now - lastWrite.current < THROTTLE_MS) return;
      lastWrite.current = now;
      reset();
    };

    const onStorage = (event: StorageEvent): void => {
      if (event.key !== STORAGE_KEY || warned.current) return;
      start();
    };

    for (const name of ACTIVITY_EVENTS) {
      window.addEventListener(name, onActivity, { passive: true });
    }
    window.addEventListener('storage', onStorage);

    return () => {
      for (const name of ACTIVITY_EVENTS) window.removeEventListener(name, onActivity);
      window.removeEventListener('storage', onStorage);
      clear();
    };
  }, [enabled, start, clear, reset]);

  return { reset };
}
