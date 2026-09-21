import type { Metadata } from 'next'
import Link from 'next/link'
import { Crest } from '@/components/Chrome'

export const metadata: Metadata = {
  title: 'Page not found — GWOP University',
  robots: { index: false, follow: false },
}

/* ═══════════════════════════════════════════════════════════════════════════
   404 — ADDED 2026-09-21

   ⚠ THERE WAS NO not-found.tsx ANYWHERE IN THE APP. A mistyped URL got
   Next.js's built-in page: the numeral "404", the sentence "This page could
   not be found", and nothing else. It inherited the root layout's background
   and serif, so it looked *almost* like the site — which is worse than looking
   nothing like it, because the visitor cannot tell whether they have left.

   It also offered no way back. No crest, no nav, no link. A dead end on a site
   somebody may have just paid $997 to reach.

   ⚠ THIS FILE ALSO SERVES EVERY notFound() CALL, not just bad URLs. /admin
   calls it for a non-staff visitor, and the asset route's 404s are deliberate
   — a 403 would confirm that something exists at that key. So the copy has to
   work for "you mistyped" AND "you are not allowed here", without telling the
   second reader which they are. Hence no "you don't have permission" wording:
   that sentence is the confirmation we are refusing to give.

   ⚠ TWO DESTINATIONS, NOT ONE. A signed-out visitor wants the site; a student
   wants their levels. Guessing wrong strands the other, so both are offered
   and neither is styled as the obvious default.
   ═══════════════════════════════════════════════════════════════════════════ */
export default function NotFound() {
  return (
    <main className="errpage">
      <div className="errwrap">
        <Crest size={54} />
        <p className="tag">Error 404</p>
        <h1>We could not find that page.</h1>
        <p className="errlede">
          The link may be out of date, or the address may have a typo in it.
          Nothing is wrong with your account.
        </p>
        <div className="erractions">
          <Link className="btn btn-e" href="/dashboard">Go to my dashboard</Link>
          <Link className="btn btn-o" href="/">Back to the site</Link>
        </div>
      </div>
    </main>
  )
}
