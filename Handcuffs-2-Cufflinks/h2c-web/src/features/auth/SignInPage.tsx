import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { Seo } from '@/lib/seo/Seo';
import { Section, Wrap } from '@/components/ui/Section';
import { PasswordField } from '@/components/ui/PasswordField';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/providers/context/auth';
import { env } from '@/config/env';
import { ROUTES } from '@/router/routes';
import type { SignInPayload } from '@/types/auth';
import { Spinner } from '@/components/ui/Spinner';

export function SignInPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInPayload>();

  const from = (location.state as { from?: string } | null)?.from ?? ROUTES.adminDashboard;

  async function onSubmit(values: SignInPayload): Promise<void> {
    setError(null);
    try {
      await signIn(values);
      navigate(from, { replace: true });
    } catch {
      // Deliberately does not distinguish a wrong password from an unknown
      // address — that difference is how account lists get enumerated.
      setError('That email and password combination did not work.');
    }
  }

  return (
    <>
      <Seo title="Sign in" description="Administrator access." noIndex />
      <Section surface="obsidian2" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Wrap narrow style={{ maxWidth: 440 }}>
          <Eyebrow reveal={false}>Handcuffs 2 Cufflinks · CMS</Eyebrow>
          <h1 className="h-md">Sign in</h1>

          <form className="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="field">
              <label htmlFor="auth-email">Email</label>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                {...register('email', { required: 'Enter your email.' })}
              />
              {errors.email && <span className="field-hint">{errors.email.message}</span>}
            </div>

            <div className="field">
              <label htmlFor="auth-password">Password</label>
              <PasswordField
                id="auth-password"
                autoComplete="current-password"
                {...register('password', { required: 'Enter your password.' })}
              />
              {errors.password && <span className="field-hint">{errors.password.message}</span>}
            </div>

            {error && (
              <div className="note" role="alert">
                <b>Could not sign in</b>
                <p>{error}</p>
              </div>
            )}

            <Button type="submit" variant="gold" wide disabled={isSubmitting} className="btn--busy">
              {isSubmitting && <Spinner size="sm" label="" />}
              {isSubmitting ? 'Signing in' : 'Sign in'}
            </Button>

            {env.googleClientId && (
              <Button variant="ghost" wide onClick={() => { window.location.href = `${env.apiBaseUrl}${'/auth/google'}`; }}>
                Continue with Google
              </Button>
            )}
          </form>
        </Wrap>
      </Section>
    </>
  );
}
