'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Crest } from '@/components/Chrome'

/* ═══════════════════════════════════════════════════════════════════════════
   ERROR BOUNDARY — ADDED 2026-09-21

   ⚠ THE APP HAD NONE. Any thrown error in a server component showed Next's
   unstyled default error screen — in production, a bare "Application error: a
   server-side exception has occurred" on a white page. To a buyer mid-checkout
   that is indistinguishable from the site being gone.

   ⚠ MUST BE A CLIENT COMPONENT WITH THESE EXACT PROPS. Next passes `error`
   and `reset`; the file will not register as a boundary without them, and
   'use client' is required. Do not convert this to a server component.

   ── WHAT IT DELIBERATELY DOES NOT DO ──────────────────────────────────────

   ⚠ NEVER RENDERS error.message. In production Next already redacts server
   errors to a digest, but a client-side throw is passed through verbatim, and
   those messages carry table names, column names and query fragments. The
   digest is shown instead: it is meaningless to a visitor and is the exact
   string to search for in the logs, which is what support actually needs.

   ⚠ NO "TRY AGAIN IN A FEW MINUTES". We do not know that. reset() re-renders
   the segment, which fixes a transient failure and does nothing for a
   persistent one — so the button says what it does and the copy promises
   nothing about time.

   ⚠ THIS DOES NOT CATCH EVERYTHING. Errors in the ROOT layout escape it —
   global-error.tsx handles those. Both are needed; neither replaces the other.
   ═══════════════════════════════════════════════════════════════════════════ */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    /* ⚠ THE ONLY RECORD THIS FAILURE LEAVES. There is no error-monitoring
       service wired up (audit H3), so a browser console is where this ends.
       When Sentry or equivalent lands, report it here — the digest is the key
       that ties it to the server-side log line. */
    console.error('app_error_boundary', { digest: error.digest, message: error.message })
  }, [error])

  return (
    <main className="errpage">
      <div className="errwrap">
        <Crest size={54} />
        <p className="tag">Something went wrong</p>
        <h1>That did not load.</h1>
        <p className="errlede">
          The problem is on our side, not yours. If you were part-way through a
          purchase, nothing has been charged twice — payments are recorded once
          and a repeated attempt returns the same checkout.
        </p>
        <div className="erractions">
          <button className="btn btn-e" onClick={reset}>Try that again</button>
          <Link className="btn btn-o" href="/dashboard">Go to my dashboard</Link>
        </div>
        {error.digest && (
          <p className="errref">
            Reference <code>{error.digest}</code> — quote this if you contact support.
          </p>
        )}
      </div>
    </main>
  )
}
