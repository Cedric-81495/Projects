import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Seo } from '@/lib/seo/Seo';
import { PageHero } from '@/components/layout/PageHero';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { Section, Wrap } from '@/components/ui/Section';
import { PasswordField } from '@/components/ui/PasswordField';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { useMember } from '@/providers/context/member';
import { ApiError } from '@/lib/api/client';
import { ROUTES } from '@/router/routes';
import { Spinner } from '@/components/ui/Spinner';

interface Fields {
  firstName: string;
  lastName?: string;
  email: string;
  password: string;
  location?: string;
  subscribeToMovement: boolean;
  acceptTerms: boolean;
}

/**
 * Community registration.
 *
 * An account is optional throughout the site — everything that works without
 * one keeps working. What it adds is continuity: reactions, saved pieces, and
 * submissions follow the person between devices instead of living in one
 * browser. The copy says that plainly rather than implying a gate.
 */
export function RegisterPage() {
  const { register: createAccount } = useMember();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Fields>({ defaultValues: { subscribeToMovement: true, acceptTerms: false } });

  async function onSubmit(values: Fields): Promise<void> {
    setError(null);
    try {
      await createAccount({ ...values, acceptTerms: true });
      navigate(ROUTES.account, { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'That did not go through. Try again in a moment.'
      );
    }
  }

  return (
    <>
      <Seo
        title="Create an Account"
        description="Keep your saved pieces, votes, and story with you across devices."
        canonicalPath={ROUTES.register}
      />
      <Breadcrumb trail={[{ label: 'Home', to: ROUTES.home }, { label: 'Create an account' }]} />
      <PageHero
        eyebrow="Community account"
        title={
          <>
            Keep your place
            <br />
            in the movement.
          </>
        }
        lede="Optional, free, and takes a minute. Everything on this site works without an account — this just means it remembers you."
      />

      <Section surface="charcoal" tight>
        <Wrap narrow>
          <div className="split split--top">
            <div>
              <p className="h-xs">What an account gives you</p>
              <ul className="bens">
                <li>
                  <Icon name="check" />
                  <span>Your likes, saves, and votes follow you to any device</span>
                </li>
                <li>
                  <Icon name="check" />
                  <span>One place to see everything you have voted for</span>
                </li>
                <li>
                  <Icon name="check" />
                  <span>Your story submissions stay linked to you</span>
                </li>
              </ul>
              <p className="body body--quiet" style={{ marginTop: '1.4em' }}>
                Already have one? <Link to={ROUTES.signInMember} style={{ borderBottom: '1px solid currentColor' }}>Sign in</Link>.
              </p>
            </div>

            <form className="form" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="g2f">
                <div className="field">
                  <label htmlFor="r-first">First name</label>
                  <input id="r-first" type="text" autoComplete="given-name"
                    {...register('firstName', { required: 'Add your first name.' })} />
                  {errors.firstName && <span className="field-hint">{errors.firstName.message}</span>}
                </div>
                <div className="field">
                  <label htmlFor="r-last">Last name (optional)</label>
                  <input id="r-last" type="text" autoComplete="family-name" {...register('lastName')} />
                </div>
              </div>

              <div className="field">
                <label htmlFor="r-email">Email</label>
                <input id="r-email" type="email" autoComplete="email"
                  {...register('email', {
                    required: 'Add an email so we can reach you.',
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Check the email address.' },
                  })} />
                {errors.email && <span className="field-hint">{errors.email.message}</span>}
              </div>

              <div className="field">
                <label htmlFor="r-password">Password</label>
                <PasswordField id="r-password" autoComplete="new-password"
                  {...register('password', {
                    required: 'Choose a password.',
                    minLength: { value: 12, message: 'Use at least 12 characters — a short phrase works well.' },
                  })} />
                {errors.password ? (
                  <span className="field-hint">{errors.password.message}</span>
                ) : (
                  <span className="field-hint">At least 12 characters. A short phrase is easier to remember and harder to guess.</span>
                )}
              </div>

              <div className="field">
                <label htmlFor="r-location">Where you are (optional)</label>
                <input id="r-location" type="text" placeholder="City, State or Country" {...register('location')} />
              </div>

              <label className="check">
                <input type="checkbox" {...register('subscribeToMovement')} />
                <span>Also add me to the movement mailing list. I can unsubscribe any time.</span>
              </label>

              <label className="check">
                <input type="checkbox" {...register('acceptTerms', { required: 'Please accept the Terms of Use to continue.' })} />
                <span>
                  I accept the{' '}
                  <Link to={`${ROUTES.legal}/terms`} style={{ borderBottom: '1px solid currentColor' }}>Terms of Use</Link>{' '}
                  and{' '}
                  <Link to={`${ROUTES.legal}/privacy`} style={{ borderBottom: '1px solid currentColor' }}>Privacy Policy</Link>.
                </span>
              </label>
              {errors.acceptTerms && <span className="field-hint">{errors.acceptTerms.message}</span>}

              {error && (
                <div className="note" role="alert">
                  <b>Could not create your account</b>
                  <p>{error}</p>
                </div>
              )}

              <Button
                type="submit"
                variant="gold"
                wide
                icon={isSubmitting ? undefined : 'arrow'}
                disabled={isSubmitting}
                className="btn--busy"
              >
                {isSubmitting && <Spinner size="sm" label="" />}
                {isSubmitting ? 'Creating your account' : 'Create my account'}
              </Button>
            </form>
          </div>
        </Wrap>
      </Section>
    </>
  );
}
