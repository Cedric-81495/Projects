import Link from 'next/link'
import { Crest } from '@/components/Chrome'
import { PathwayRail } from '@/components/portal/PathwayRail'
import type { AccessState } from '@/lib/access/policy'

/**
 * Portal shell. Stays a server component — the only client code in the portal is
 * PathwayRail, which needs `usePathname` to mark the current stop. Splitting it
 * out keeps the shell, the account block and the footer server-rendered.
 */
export function PortalChrome({
  access,
  email,
  children,
}: {
  access: AccessState
  email: string
  children: React.ReactNode
}) {
  return (
    <div className="poshell">
      {/* TWO BANDS, not one row.
          Everything previously sat in a single wrapping flex row: crest,
          wordmark, six nav links, the email and the sign-out button. There is no
          width at which that fits gracefully — at ~1300px "Senior" fell to a
          second line and "Sign out" broke into "Sign / out"; at ~500px the
          order rearranged entirely.

          Splitting identity from navigation removes the competition. Band one
          never has more than three things in it, and the pathway gets its own
          rail, which reads as deliberate rather than crowded. */}
      <header className="pobar">
        <div className="pobar-top">
          <Link className="pologo" href="/dashboard">
            <Crest size={30} />
            <b>
              GWOP UNIVERSITY
              <small>KNOWLEDGE PAYS</small>
            </b>
          </Link>

          {/* Sign-out is a POST form, not a link: a GET sign-out is CSRF-able
              and gets fired by link prefetchers and antivirus scanners, logging
              people out at random for no reason they can see. */}
          <div className="poacct">
            {/* The disc is a LINK to /account, not decoration. It sat inside the
                sign-out form doing nothing, which fails the first thing anyone
                tries — tapping their own avatar. It also has to be outside that
                form: a <Link> nested in a form is fine, but keeping them
                separate means a stray Enter cannot submit sign-out.

                An initial rather than the address, because the email rendered as
                "cedricsusmerano@gmail.c…" — a truncation that told the reader
                nothing and read as a defect. */}
            <Link className="poinitial" href="/account" title={email}>
              <span aria-hidden="true">
                {email.trim().charAt(0).toUpperCase() || '?'}
              </span>
              <span className="sr-only">Account settings for {email}</span>
            </Link>

            {/* Sign-out is a POST form, not a link: a GET sign-out is CSRF-able
                and gets fired by link prefetchers and antivirus scanners,
                logging people out at random for no reason they can see. */}
            <form action="/auth/signout" method="post">
              <button type="submit">Sign out</button>
            </form>
          </div>
        </div>

        <PathwayRail access={access} />
      </header>

      {/* min-height, not height: a short page must not collapse, and a long one
          must not be clipped. This is the §22 "short content" fix. */}
      <main className="pomain">{children}</main>

      {/* PORTAL FOOTER.
          Not the marketing <Footer> — that carries a pathway sitemap, socials
          and a course-card grid, which is navigation a student already has in
          the bar above. Repeating it turns every lesson page into a landing
          page.

          What it does carry is the part that has to be reachable from every
          page: the legal routes. A signed-in student is the person most likely
          to need Terms or the refund policy, and until now the portal was the
          one area of the site with no route to them at all.

          Same emerald-on-forest treatment as the marketing footer, so it reads
          as the same university — Package p.1: "every screen should feel like it
          belongs to the same university." */}
      <footer className="pofoot">
        {/* Crest + stacked wordmark, matching the bar above and the marketing
            footer. It was a single inline line with a middle dot, which read as
            a different mark from the one directly above it. */}
        <div className="pofoot-brand">
          <Crest size={26} />
          <b>
            GWOP UNIVERSITY
            <small>KNOWLEDGE PAYS</small>
          </b>
        </div>

        {/* target="_blank" on purpose. These are public marketing-chrome pages,
            so following one in the same tab swaps the portal shell for the
            website header — a signed-in student watches their pathway nav and
            account disappear and reasonably concludes they have been logged out.
            Opening a new tab keeps the portal where they left it.

            rel="noopener" because target="_blank" otherwise hands the opened
            page a reference back to this one. */}
        <nav className="pofoot-links" aria-label="Legal">
          <a href="/privacy" target="_blank" rel="noopener">Privacy Policy</a>
          <a href="/terms" target="_blank" rel="noopener">Terms &amp; Conditions</a>
          <a href="/sms-terms" target="_blank" rel="noopener">SMS Terms</a>
          <a href="/refunds" target="_blank" rel="noopener">Refunds</a>
          <a href="/disclosures" target="_blank" rel="noopener">Disclosures</a>
        </nav>
      </footer>
    </div>
  )
} 