import Link from 'next/link'
import { Crest } from '@/components/Chrome'
import { isStaff, canAccessLevel, LEVELS, type AccessState } from '@/lib/access/policy'

/**
 * Portal shell. Server component — it renders no interactivity beyond links and
 * one POST form, so it ships zero JavaScript.
 *
 * Sign-out is a POST form, not a link: a GET sign-out is CSRF-able and gets
 * fired by link prefetchers and antivirus scanners, logging people out at
 * random for no reason they can see.
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
      <header className="pobar">
        <Link className="pologo" href="/dashboard">
          <Crest size={32} />
          <b>
            GWOP UNIVERSITY
            <small>KNOWLEDGE PAYS</small>
          </b>
        </Link>

        <nav className="ponav" aria-label="Student">
          <Link href="/dashboard">Dashboard</Link>

          {/* THE PATHWAY, always all four.
              A locked level renders as dimmed text rather than being hidden:
              Package p.3 says the university should "visually show progression",
              and a student cannot want what they cannot see. Hiding Junior makes
              the product look like it ends at Sophomore.

              Lock state comes from canAccessLevel — never `level <=
              enrolledLevel` inline. policy.ts is explicit that the moment that
              comparison is copied into a component, changing a rule means
              auditing the whole tree.

              This governs affordance only. RLS decides what data returns. */}
          {LEVELS.map(l =>
            canAccessLevel(access, l.level) ? (
              <Link key={l.slug} href={`/app/${l.slug}`}>{l.label}</Link>
            ) : (
              <span
                key={l.slug}
                className="polock"
                aria-disabled="true"
                title={`${l.label} — not yet unlocked`}
              >
                {l.label}
              </span>
            ),
          )}

          {/* Only HIDES the link — /admin is guarded server-side and by RLS
              regardless of what is rendered here. */}
          {isStaff(access) && <Link href="/admin">Admin</Link>}
        </nav>

        <form className="poout" action="/auth/signout" method="post">
          <span className="poemail" title={email}>
            {email}
          </span>
          <button type="submit">Sign out</button>
        </form>
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
        <p className="pofoot-brand">
          GWOP UNIVERSITY <span>· Knowledge Pays</span>
        </p>
        <nav className="pofoot-links" aria-label="Legal">
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms &amp; Conditions</Link>
          <Link href="/sms-terms">SMS Terms</Link>
          <Link href="/refunds">Refunds</Link>
          <Link href="/disclosures">Disclosures</Link>
        </nav>
      </footer>
    </div>
  )
} 