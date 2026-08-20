'use client'

import { useActionState } from 'react'
import { updatePassword, type ActionState } from '@/lib/auth/actions'
import { PasswordField } from '@/components/auth/PasswordField'
/* auth.css is imported by the (auth) layout, which this page is not inside — so
   without this the shared `.aufield` / `.pwwrap` rules never load and the inputs
   render as unstyled browser defaults. Next dedupes the import when both are on
   screen, so there is no cost to declaring it in both places. */
import '@/styles/auth.css'

const initial: ActionState = {}

/**
 * Reuses `updatePassword` rather than adding a second action. That function
 * calls `supabase.auth.updateUser`, which works against whatever session is
 * present — the recovery session from a reset link, or an ordinary signed-in
 * one. Duplicating it would mean two places to keep the 10-character rule and
 * the confirm-match check in step.
 *
 * On success the action redirects to /dashboard?password=updated, which is the
 * existing behaviour and reads correctly here too: the change is saved and you
 * land somewhere useful rather than staring at a form you have finished with.
 */
export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, initial)

  return (
    <form className="auform acct-form" action={action} noValidate>
      {state.error && (
        <p className="aualert" role="alert">
          {state.error}
        </p>
      )}

      <PasswordField
        name="password"
        label="New password"
        autoComplete="new-password"
        minLength={10}
        required
        hint="At least 10 characters."
      />

      <PasswordField
        name="confirm"
        label="Confirm new password"
        autoComplete="new-password"
        minLength={10}
        required
      />

      <button className="btn btn-e aubtn" type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Save password'}
      </button>
    </form>
  )
}
