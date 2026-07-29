import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../lib/api'
import { Button } from '../components/ui/Button'
import { FormError, TextField } from '../components/ui/Field'
import { AuthShell } from '../components/auth/AuthShell'

const MIN_PASSWORD_LENGTH = 10

export function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  /**
   * Where to land after signing up. Set when a visitor picked a tier before
   * having an account, so the flow resumes at checkout instead of dumping them
   * on the dashboard to start over.
   *
   * Only same-site paths are honoured — accepting an arbitrary value here would
   * be an open redirect.
   */
  const nextParam = searchParams.get('next')
  const next = nextParam?.startsWith('/') && !nextParam.startsWith('//') ? nextParam : null

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setFieldErrors({})

    const form = new FormData(event.currentTarget)
    const name = String(form.get('name') ?? '')
    const email = String(form.get('email') ?? '')
    const password = String(form.get('password') ?? '')
    const confirm = String(form.get('confirmPassword') ?? '')

    // Checked client-side because the server has no reason to know about a
    // confirmation field — it is purely a typo guard.
    if (password !== confirm) {
      setFieldErrors({ confirmPassword: 'Those passwords do not match' })
      return
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setFieldErrors({ password: `Use at least ${MIN_PASSWORD_LENGTH} characters` })
      return
    }

    setSubmitting(true)

    try {
      await register(name, email, password)
      navigate(next ?? '/dashboard', { replace: true })
    } catch (caught) {
      if (caught instanceof ApiError) {
        if (caught.code === 'VALIDATION_ERROR' && caught.details) {
          const mapped: Record<string, string> = {}
          for (const detail of caught.details) mapped[detail.field] = detail.message
          setFieldErrors(mapped)
        } else {
          setError(caught.message)
        }
      } else {
        setError('We could not create your account. Please check your connection and try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start your assessment — no card required."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-accent underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {error && <FormError>{error}</FormError>}

        <TextField
          label="Full name"
          name="name"
          autoComplete="name"
          required
          error={fieldErrors.name}
          placeholder="Jordan Whitfield"
        />

        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          error={fieldErrors.email}
          placeholder="you@company.com"
        />

        <TextField
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          error={fieldErrors.password}
          hint={`At least ${MIN_PASSWORD_LENGTH} characters. Length beats complexity.`}
          placeholder="••••••••••"
        />

        <TextField
          label="Confirm password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          error={fieldErrors.confirmPassword}
          placeholder="••••••••••"
        />

        <Button type="submit" variant="primary" size="lg" fullWidth loading={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>

        <p className="text-center text-xs leading-relaxed text-subtle">
          By creating an account you agree to our terms of service and privacy policy.
        </p>
      </form>
    </AuthShell>
  )
}
