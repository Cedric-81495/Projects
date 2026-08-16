import Link from 'next/link'
import type { Metadata } from 'next'
import { SignupForm } from './SignupForm'

export const metadata: Metadata = {
  title: 'Create your account · GWOP University',
  robots: { index: false, follow: false },
}

export default function SignupPage() {
  return (
    <>
      <h1 className="auh1">Create your account</h1>
      <p className="ausub">Start your blueprint. Study in order, at your own pace.</p>
      <SignupForm />
      <p className="aufoot">
        Already have an account? <Link href="/login">Sign in</Link>
      </p>
    </>
  )
}
