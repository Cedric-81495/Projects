import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../lib/api'
import { Button } from '../components/ui/Button'
import { FormError, TextField } from '../components/ui/Field'
import { AuthShell } from '../components/auth/AuthShell'
import { AuthDivider, GoogleButton } from '../components/auth/GoogleButton'

interface RedirectState {
  from?: string
}

/**
 * Messages for the codes the Google callback can redirect back with.
 *
 * The OAuth flow is a browser navigation, so a failure cannot return JSON — it
 * arrives as ?error=CODE on this page instead. Mapping is done here so the
 * server never has to send user-facing copy through a URL.
 */
const OAUTH_ERRORS: Record<string, string> = {
  GOOGLE_ACCESS_DENIED: 'You cancelled the Google sign-in. You can try again or use your password.',
  GOOGLE_STATE_INVALID: 'That sign-in attempt expired or was interrupted. Please try again.',
  GOOGLE_EMAIL_UNVERIFIED:
    'That Google account has an unverified email address. Verify it with Google, or sign in with a password.',
  GOOGLE_CODE_INVALID: 'We could not complete that Google sign-in. Please try again.',
  GOOGLE_TOKEN_INVALID: 'We could not verify that Google sign-in. Please try again.',
  GOOGLE_TOKEN_MISSING: 'Google did not return the expected identity details. Please try again.',
  GOOGLE_PROFILE_INCOMPLETE: 'That Google account did not share an email address.',
  GOOGLE_NOT_CONFIGURED: 'Google sign-in is not available right now. Please use your password.',
  GOOGLE_SIGNIN_FAILED: 'We could not complete that Google sign-in. Please try again.',
}

export function Login() {
  const { login, refetch } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const from = (location.state as RedirectState | null)?.from

  /**
   * A redirect-back destination can arrive two ways: in router state when a
   * guard bounced the user here, or as ?next= when they came from a link. Only
   * same-site paths are honoured, so neither can be used as an open redirect.
   */
  const nextParam = searchParams.get('next')
  const safeNext =
    nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : null
  const destination = from ?? safeNext

  const oauthErrorCode = searchParams.get('error')
  const oauthError = oauthErrorCode
    ? (OAUTH_ERRORS[oauthErrorCode] ?? 'We could not complete that sign-in. Please try again.')
    : null

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const form = new FormData(event.currentTarget)

    try {
      const user = await login(
        String(form.get('email') ?? ''),
        String(form.get('password') ?? ''),
      )

      /**
       * The login response already carries the user, but /me is the authority on
       * role — it re-reads from the database. Confirming it before navigating
       * prevents sending a freshly-promoted admin to the customer dashboard, or
       * bouncing them off /admin a moment later.
       */
      const confirmed = (await refetch()) ?? user

      if (destination) {
        navigate(destination, { replace: true })
        return
      }

      navigate(confirmed.role === 'admin' ? '/admin' : '/dashboard', { replace: true })
    } catch (caught) {
      /**
       * The server's own message is shown rather than a generic string, so
       * INVALID_CREDENTIALS and RATE_LIMITED read differently — a user locked out
       * by the rate limiter should not be told their password is wrong.
       */
      if (caught instanceof ApiError) {
        setError(caught.message)
      } else {
        setError('We could not sign you in. Please check your connection and try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to pick up where you left off."
      footer={
        <>
          New here?{' '}
          <Link to="/register" className="font-medium text-accent underline-offset-4 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      {(error ?? oauthError) && (
        <div className="mb-5">
          <FormError>{error ?? oauthError}</FormError>
        </div>
      )}

      {/*
        OAuth sits above the password form: it is the faster path, and a
        returning Google user should not have to scan past a form they never use.
      */}
      <GoogleButton mode="signin" next={destination} />

      <AuthDivider label="or sign in with email" />

      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@company.com"
        />

        <TextField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••••"
        />

        <Button type="submit" variant="primary" size="lg" fullWidth loading={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthShell>
  )
}
