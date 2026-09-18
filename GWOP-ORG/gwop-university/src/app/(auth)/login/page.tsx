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
  searchParams: Promise<{ next?: string; error?: string; checkout?: string }>
}) {
  const params = await searchParams

  return (
    <>
      <h1 className="auh1">Sign in</h1>
      <p className="ausub">Continue your GWOP journey.</p>

      {/* ⚠ A BUYER CAN LAND HERE STRAIGHT FROM STRIPE. Checkout's success_url
          returns them to /dashboard, and if the session needed refreshing on
          that request they arrive signed out and get bounced here — carrying
          ?checkout=success with them. Without this line they see a bare sign-in
          form seconds after paying $497, with nothing confirming the payment
          worked. That is the moment someone opens a chargeback.

          The payment itself is never in doubt at this point: Stripe's webhook
          is server-to-server and has already recorded it. */}
      {params.checkout === 'success' && (
        <p className="aunotice" role="status">
          Payment received. Sign in to open your levels.
        </p>
      )}

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
