import Link from 'next/link'
import { Crest } from '@/components/Chrome'
import '@/styles/auth.css'

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
