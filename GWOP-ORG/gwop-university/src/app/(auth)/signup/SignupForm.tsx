'use client'

import { useActionState } from 'react'
import { signUp, type ActionState } from '@/lib/auth/actions'
import { publicEnv } from '@/lib/env.public'
import { PasswordField } from '@/components/auth/PasswordField'
import { OfflineNotice } from '@/components/auth/OfflineNotice'
import { TurnstileWidget } from '@/components/auth/TurnstileWidget'

const initial: ActionState = {}

export function SignupForm() {
  const [state, action, pending] = useActionState(signUp, initial)
  const siteKey = publicEnv.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  if (state.notice) {
    return (
      <p className="aunotice" role="status">
        {state.notice}
      </p>
    )
  }

  return (
    <form className="auform" action={action} noValidate>
      <OfflineNotice />

      {state.error && (
        <p className="aualert" role="alert">
          {state.error}
        </p>
      )}

      <label className="aufield">
        <span>Full name</span>
        <input name="full_name" type="text" autoComplete="name" required />
      </label>

      <label className="aufield">
        <span>Email</span>
        <input
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
        />
      </label>

      <PasswordField name="password" label="Password"
        autoComplete="new-password" minLength={10} required
        hint="At least 10 characters." />

      {/* Honeypot. Hidden from people and from screen readers; bots fill it in. */}
      <div className="auhp" aria-hidden="true">
        <label>
          Company
          <input name="company" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {siteKey && (
        <>
          {/* Explicit render — see TurnstileWidget. The implicit `.cf-turnstile`
              pattern that used to sit here only renders on the script's first
              load, so arriving here by client-side navigation (log out → /login
              → "Create your account") produced no widget, no token, and a form
              that could not be submitted. */}
          <TurnstileWidget siteKey={siteKey} />
        </>
      )}

      <button className="btn btn-e aubtn" type="submit" disabled={pending}>
        {pending ? 'Creating your account…' : 'Create account'}
      </button>
    </form>
  )
}
