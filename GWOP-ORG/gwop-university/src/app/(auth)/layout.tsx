import Link from 'next/link'
import { Crest } from '@/components/Chrome'
import '@/styles/auth.css'

/* ══ WHY THIS SEGMENT IS DYNAMIC ════════════════════════════════════════════
   ⚠ ADDED 2026-09-11. WITHOUT IT, NO JAVASCRIPT RUNS ON A DIRECT LOAD OF
   /login OR /signup, AND NOTHING REPORTS AN ERROR.

   middleware.ts issues a fresh CSP per request with 'nonce-<random>' and
   'strict-dynamic'. Every script has to carry that exact nonce or the browser
   refuses it.

   A nonce is unique per request, so Next can only stamp it onto script tags
   when the page is rendered per request. These four pages had no dynamic
   marker and no dynamic API call, so they were statically rendered: their
   script tags were emitted at build time with no nonce at all, while the
   middleware still attached a nonce-bearing CSP to the response. Result — every
   script blocked, no hydration.

   ── WHAT THAT LOOKED LIKE, AND WHY IT HID FOR SO LONG ─────────────────────
   The forms kept working. React form actions post natively, so sign-in and
   sign-up were unaffected — exactly the property PasswordField and the rest
   were built for. What disappeared was everything that needs the client:

     · the show/hide password toggle, which PasswordField withholds until
       useEffect fires so it never renders as a dead control
     · the Turnstile widget, which needs its script to execute

   And it came back the moment you navigated in from another page, because
   React was already running and rendered both client-side. So the bug was
   invisible to anyone clicking through the app and only hit people arriving
   at /signup from a link — which is everybody who is not us.

   ⚠ DO NOT "OPTIMISE" THIS BACK TO STATIC. There is nothing per-request in
   the markup, so it looks like a free win. The nonce is the per-request thing,
   and it lives in a header rather than the page. Removing this line returns
   the signup form to having no CAPTCHA.

   The alternative fix is calling headers() in this layout, which opts into
   dynamic rendering as a side effect. This is the same outcome stated out
   loud instead of implied by an unused call. */
export const dynamic = 'force-dynamic'

/**
 * Shell for login, signup and password reset.
 *
 * No footer and no navigation by design: every clickable thing that is not the
 * form is a way to abandon it. The crest links home, and that is the only exit.
 *
 * `min-height: 100svh` — svh, not vh, because vh is measured against the
 * viewport WITHOUT the iOS Safari URL bar and leaves the page scrollable by
 * exactly the height of that bar.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="aushell">
      <div className="aucard">
        <Link className="aubrand" href="/">
          <Crest size={44} />
          <b>
            GWOP UNIVERSITY
            <small>KNOWLEDGE PAYS</small>
          </b>
        </Link>
        {children}
      </div>
    </main>
  )
}
