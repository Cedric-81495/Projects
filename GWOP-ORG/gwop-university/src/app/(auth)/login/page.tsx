import Link from 'next/link'
import type { Metadata } from 'next'
import { LoginForm } from './LoginForm'

export const metadata: Metadata = {
  title: 'Sign in · GWOP University',
  // Auth pages must never be indexed: they are not landing pages and they
  // dilute the search presence of the real ones.
  robots: { index: false, follow: false },
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>
}) {
  const params = await searchParams

  return (
    <>
      <h1 className="auh1">Sign in</h1>
      <p className="ausub">Pick up where you left off.</p>

      {params.error === 'link_invalid' && (
        <p className="aualert" role="alert">
          That link is no longer valid. Request a new one below.
        </p>
      )}

      <LoginForm next={params.next} />

      <p className="aufoot">
        <Link href="/reset-password">Forgot your password?</Link>
      </p>
      <p className="aufoot">
        New here? <Link href="/signup">Create an account</Link>
      </p>
    </>
  )
}
