'use client'

import { useEffect, useRef } from 'react'

/**
 * Cloudflare Turnstile, rendered EXPLICITLY.
 *
 * ⚠ WHY THIS EXISTS — the implicit pattern breaks on client-side navigation.
 *
 * The documented shortcut is to drop the API script on the page and let it find
 * any `.cf-turnstile` div by itself. That auto-scan runs ONCE, when the script
 * first loads. It never runs again.
 *
 * On these pages that is a real failure, not a theoretical one. Log out, land on
 * /login, tap "Create your account" — Next handles that as a client-side
 * navigation, so the script is already in the document and is not re-added.
 * Nothing re-scans, the new div stays empty, and there is no widget.
 *
 * No widget means no token. `signUp` and `requestReset` both reject a missing
 * token whenever TURNSTILE_SECRET_KEY is configured, so the form cannot be
 * submitted at all: the button works, the request goes out, and it comes back
 * refused with nothing on screen explaining why. Reported 2026-08-28 after
 * exactly that sequence.
 *
 * Rendering explicitly fixes it for every entry path. `turnstile.render()` is
 * called on mount, so a fresh widget exists whether the page arrived by full
 * load or by client-side navigation, and `turnstile.remove()` on unmount stops
 * orphaned widgets accumulating as someone moves between login and signup.
 *
 * ⚠ NOT used on /830. That page is deliberately excluded from client-side
 * navigation — Pathway.tsx links to it with a plain <a> so the document is
 * always fresh — and the implicit pattern there works for that reason. Leave it
 * alone: /830 is the event path and is frozen.
 */

const SCRIPT_ID = 'cf-turnstile-script'
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js'

interface Turnstile {
  render: (
    el: HTMLElement,
    opts: { sitekey: string; theme?: 'light' | 'dark' | 'auto' },
  ) => string | undefined
  remove: (id: string) => void
}

function turnstile(): Turnstile | undefined {
  return (window as unknown as { turnstile?: Turnstile }).turnstile
}

export function TurnstileWidget({ siteKey }: { siteKey: string }) {
  const holder = useRef<HTMLDivElement>(null)
  /* The widget id Cloudflare hands back, kept so unmount can remove exactly
     this instance rather than guessing. */
  const widgetId = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false

    function draw() {
      if (cancelled) return
      const api = turnstile()
      const el = holder.current
      /* Both guards matter. `api` is absent until the script finishes, and on a
         slow connection that is well after mount. `el` is null if React has
         already torn the subtree down while we were waiting. */
      if (!api || !el || widgetId.current) return
      /* Cleared first: React may reuse the node across navigations, and
         rendering into a div that still holds a dead widget stacks two. */
      el.innerHTML = ''
      widgetId.current = api.render(el, { sitekey: siteKey, theme: 'light' }) ?? null
    }

    /* Already loaded — the common case after any navigation, and precisely the
       case the implicit pattern gets wrong. */
    if (turnstile()) {
      draw()
    } else {
      /* Reuse the tag if a previous mount added it. Appending a second copy is
         what triggers Turnstile's "already been loaded" error, which on /830
         was what silently 422'd every submission. */
      let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null
      if (!script) {
        script = document.createElement('script')
        script.id = SCRIPT_ID
        script.src = SCRIPT_SRC
        script.async = true
        script.defer = true
        document.head.appendChild(script)
      }
      script.addEventListener('load', draw)
      /* A script tag that is present but still in flight fires no event we have
         missed, so the listener above is enough. The poll below covers the case
         where it loaded between our check and the listener being attached. */
      const poll = setInterval(() => {
        if (turnstile()) {
          clearInterval(poll)
          draw()
        }
      }, 150)
      /* Give up after 10s rather than polling forever. The server rejects a
         missing token, so the form fails loudly — which is the right outcome,
         and better than a page quietly spinning a timer for the whole session. */
      const stop = setTimeout(() => clearInterval(poll), 10_000)

      return () => {
        cancelled = true
        script?.removeEventListener('load', draw)
        clearInterval(poll)
        clearTimeout(stop)
        const api = turnstile()
        if (api && widgetId.current) api.remove(widgetId.current)
        widgetId.current = null
      }
    }

    return () => {
      cancelled = true
      const api = turnstile()
      if (api && widgetId.current) api.remove(widgetId.current)
      widgetId.current = null
    }
  }, [siteKey])

  /* The hidden input Turnstile writes into is created inside this div, so the
     surrounding <form> picks up `cf-turnstile-response` exactly as it does with
     the implicit pattern. No change needed in the server actions. */
  return <div ref={holder} />
}
