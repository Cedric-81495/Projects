import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import { UpdatePasswordForm } from './UpdatePasswordForm'

export const metadata: Metadata = {
  title: 'Set a new password · GWOP University',
  robots: { index: false, follow: false },
}

/**
 * Reached only via /auth/callback, which establishes a recovery session from
 * the emailed link. No session means the link expired or was never valid —
 * checked here on the SERVER, so the form is never rendered to someone who
 * could not use it anyway.
 */
export default async function UpdatePasswordPage() {
  const supabase = await createServerSupabase()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect('/reset-password?error=link_invalid')

  return (
    <>
      <h1 className="auh1">Set a new password</h1>
      <p className="ausub">Choose something you don&rsquo;t use anywhere else.</p>
      <UpdatePasswordForm />
    </>
  )
}
