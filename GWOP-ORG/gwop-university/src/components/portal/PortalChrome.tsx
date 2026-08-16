import Link from 'next/link'
import { Crest } from '@/components/Chrome'
import { isStaff, type AccessState } from '@/lib/access/policy'

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
          <Link href="/account">Account</Link>
          {/* Rendered from the centralized policy, never an inline role string.
              Note this only HIDES the link — /admin is guarded server-side and
              by RLS regardless of what is rendered here. */}
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
    </div>
  )
}
