import { useEffect, useRef } from 'react'

interface UseIdleTimerOptions {
  /** Total inactivity before onIdle fires, in milliseconds. */
  timeout: number
  /** How long before that to fire onWarning, giving the user a chance to stay. */
  warnAfter: number
  onWarning: () => void
  onIdle: () => void
  enabled: boolean
}

const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll', 'visibilitychange'] as const

/**
 * Tracks user activity and fires a warning then a logout.
 *
 * Callbacks are held in refs so a parent re-render does not tear down and
 * rebuild the listeners — which would silently reset the countdown and mean the
 * timeout never actually elapses.
 */
export function useIdleTimer({
  timeout,
  warnAfter,
  onWarning,
  onIdle,
  enabled,
}: UseIdleTimerOptions): { reset: () => void } {
  const warningRef = useRef(onWarning)
  const idleRef = useRef(onIdle)
  const timersRef = useRef<{ warn?: number; idle?: number }>({})

  useEffect(() => {
    warningRef.current = onWarning
    idleRef.current = onIdle
  }, [onWarning, onIdle])

  const scheduleRef = useRef<() => void>(() => {})

  useEffect(() => {
    if (!enabled) {
      window.clearTimeout(timersRef.current.warn)
      window.clearTimeout(timersRef.current.idle)
      return
    }

    const schedule = () => {
      window.clearTimeout(timersRef.current.warn)
      window.clearTimeout(timersRef.current.idle)

      timersRef.current.warn = window.setTimeout(() => warningRef.current(), timeout - warnAfter)
      timersRef.current.idle = window.setTimeout(() => idleRef.current(), timeout)
    }

    scheduleRef.current = schedule
    schedule()

    /**
     * Activity restarts the countdown, but only while the warning is not
     * showing — otherwise the modal would dismiss itself the moment the user
     * moved the mouse toward its button, which defeats the point of asking.
     */
    const onActivity = () => schedule()

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, onActivity, { passive: true })
    }

    return () => {
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, onActivity)
      }
      window.clearTimeout(timersRef.current.warn)
      window.clearTimeout(timersRef.current.idle)
    }
  }, [enabled, timeout, warnAfter])

  return { reset: () => scheduleRef.current() }
}
