import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../lib/api'
import { Button } from '../components/ui/Button'
import { FormError, TextField } from '../components/ui/Field'
import { AuthShell } from '../components/auth/AuthShell'

interface RedirectState {
  from?: string
}

export function Login() {
  const { login, refetch } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const from = (location.state as RedirectState | null)?.from

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

      if (from) {
        navigate(from, { replace: true })
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
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {error && <FormError>{error}</FormError>}

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
