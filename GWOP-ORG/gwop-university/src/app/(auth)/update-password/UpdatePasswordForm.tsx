'use client'

import { useActionState } from 'react'
import { updatePassword, type ActionState } from '@/lib/auth/actions'

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

      <label className="aufield">
        <span>New password</span>
        <input name="password" type="password" autoComplete="new-password" minLength={10} required />
        <small>At least 10 characters.</small>
      </label>

      <label className="aufield">
        <span>Confirm new password</span>
        <input name="confirm" type="password" autoComplete="new-password" minLength={10} required />
      </label>

      <button className="btn btn-e aubtn" type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Save password'}
      </button>
    </form>
  )
}
