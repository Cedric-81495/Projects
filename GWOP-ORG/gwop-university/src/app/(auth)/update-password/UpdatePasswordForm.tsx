'use client'

import { useActionState } from 'react'
import { updatePassword, type ActionState } from '@/lib/auth/actions'
import { PasswordField } from '@/components/auth/PasswordField'

const initial: ActionState = {}

export function UpdatePasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, initial)

  return (
    <form className="auform" action={action} noValidate>
      {state.error && (
        <p className="aualert" role="alert">
          {state.error}
        </p>
      )}

      <PasswordField name="password" label="New password"
        autoComplete="new-password" minLength={10} required
        hint="At least 10 characters." />

      <PasswordField name="confirm" label="Confirm new password"
        autoComplete="new-password" minLength={10} required />

      <button className="btn btn-e aubtn" type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Save password'}
      </button>
    </form>
  )
}
