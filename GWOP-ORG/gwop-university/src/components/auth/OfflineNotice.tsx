'use client'

import { useEffect, useState } from 'react'

/**
 * OFFLINE NOTICE for the auth forms.
 *
 * Sign-in and sign-up run as React server actions. When the network drops, the
 * action's POST fails and React surfaces nothing to the user — the button
 * returns from its pending state and the page sits there unchanged. Someone on
 * bad wifi taps Sign in repeatedly and concludes their password is wrong.
 *
 * /830 already handles this properly for the lead form, checking navigator
 * .onLine before submitting and mapping each failure to a plain-English message.
 * The auth pages had none of that, so this restores parity: say what happened,
 * before they blame themselves.
 *
 * Renders nothing while online, so it costs a listener and no layout.
 */
export function OfflineNotice() {
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    /* Read once on mount as well as subscribing: the page may have been loaded
       from cache while already disconnected, in which case no event fires. */
    const sync = () => setOffline(!navigator.onLine)
    sync()

    window.addEventListener('online', sync)
    window.addEventListener('offline', sync)
    return () => {
      window.removeEventListener('online', sync)
      window.removeEventListener('offline', sync)
    }
  }, [])

  if (!offline) return null

  return (
    /* role="status", not "alert": this is a condition that became true, not a
       response to something the person just did. Alert interrupts a screen
       reader mid-sentence; status waits for a pause. */
    <p className="aualert is-offline" role="status">
      You’re offline. Reconnect to wifi or data — anything you’ve typed will
      still be here.
    </p>
  )
}
