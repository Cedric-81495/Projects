'use client'

import { useActionState } from 'react'
import { signIn, type ActionState } from '@/lib/auth/actions'

const initial: ActionState = {}

/**
 * Plain <form action={serverAction}> — this SUBMITS WITHOUT JAVASCRIPT.
 * `useActionState` only enhances it with a pending state and inline errors.
 * If the bundle fails to load on bad cellular, the form still works.
 */
export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signIn, initial)

  return (
    <form className="auform" action={action} noValidate>
      {next && <input type="hidden" name="next" value={next} />}

      {state.error && (
        <p className="aualert" role="alert">
          {state.error}
        </p>
      )}

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

      <label className="aufield">
        <span>Password</span>
        <input name="password" type="password" autoComplete="current-password" required />
      </label>

      <button className="btn btn-e aubtn" type="submit" disabled={pending}>
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
