'use client'

import { useActionState } from 'react'
import Script from 'next/script'
import { requestPasswordReset, type ActionState } from '@/lib/auth/actions'
import { publicEnv } from '@/lib/env.public'
import { OfflineNotice } from '@/components/auth/OfflineNotice'

const initial: ActionState = {}

export function ResetForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, initial)
  const siteKey = publicEnv.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  // The same message regardless of whether the address exists. Anything more
  // specific turns this form into an account-existence checker.
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

      {siteKey && (
        <>
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
          <div className="cf-turnstile" data-sitekey={siteKey} data-theme="light" />
        </>
      )}

      <button className="btn btn-e aubtn" type="submit" disabled={pending}>
        {pending ? 'Sending…' : 'Send reset link'}
      </button>
    </form>
  )
}
