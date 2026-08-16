import Link from 'next/link'
import type { Metadata } from 'next'
import { ResetForm } from './ResetForm'

export const metadata: Metadata = {
  title: 'Reset your password · GWOP University',
  robots: { index: false, follow: false },
}

export default function ResetPasswordPage() {
  return (
    <>
      <h1 className="auh1">Reset your password</h1>
      <p className="ausub">We&rsquo;ll email you a link to set a new one.</p>
      <ResetForm />
      <p className="aufoot">
        <Link href="/login">Back to sign in</Link>
      </p>
    </>
  )
}
