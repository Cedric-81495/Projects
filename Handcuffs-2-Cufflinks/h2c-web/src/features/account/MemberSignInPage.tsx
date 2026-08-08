import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Seo } from '@/lib/seo/Seo';
import { PageHero } from '@/components/layout/PageHero';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { Section, Wrap } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import { useMember } from '@/providers/context/member';
import { ROUTES } from '@/router/routes';

export function MemberSignInPage() {
  const { signIn } = useMember();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ email: string; password: string }>();

  async function onSubmit(values: { email: string; password: string }): Promise<void> {
    setError(null);
    try {
      await signIn(values.email, values.password);
      navigate(ROUTES.account, { replace: true });
    } catch {
      // Deliberately does not say whether the address exists — that difference
      // is how account lists get enumerated.
      setError('That email and password combination did not work.');
    }
  }

  return (
    <>
      <Seo title="Sign In" description="Sign in to your community account." canonicalPath={ROUTES.signInMember} />
      <Breadcrumb trail={[{ label: 'Home', to: ROUTES.home }, { label: 'Sign in' }]} />
      <PageHero eyebrow="Community account" title="Welcome back" lede="Your saved pieces and votes are where you left them." />

      <Section surface="charcoal" tight>
        <Wrap narrow style={{ maxWidth: 460 }}>
          <form className="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="field">
              <label htmlFor="mi-email">Email</label>
              <input id="mi-email" type="email" autoComplete="email"
                {...register('email', { required: 'Enter your email.' })} />
              {errors.email && <span className="field-hint">{errors.email.message}</span>}
            </div>

            <div className="field">
              <label htmlFor="mi-password">Password</label>
              <input id="mi-password" type="password" autoComplete="current-password"
                {...register('password', { required: 'Enter your password.' })} />
              {errors.password && <span className="field-hint">{errors.password.message}</span>}
            </div>

            {error && (
              <div className="note" role="alert">
                <b>Could not sign in</b>
                <p>{error}</p>
              </div>
            )}

            <Button type="submit" variant="gold" wide disabled={isSubmitting}>
              {isSubmitting ? 'Signing in' : 'Sign in'}
            </Button>

            <p className="body body--quiet" style={{ marginTop: '1.2em' }}>
              No account yet?{' '}
              <Link to={ROUTES.register} style={{ borderBottom: '1px solid currentColor' }}>Create one</Link>.
            </p>
          </form>
        </Wrap>
      </Section>
    </>
  );
}
