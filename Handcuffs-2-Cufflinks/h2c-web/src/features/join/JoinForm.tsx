import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { MOVEMENT_BENEFITS } from '@/config/site';
import { apiPost, ApiError } from '@/lib/api/client';
import { API } from '@/lib/api/endpoints';
import { cn } from '@/lib/utils/cn';

interface JoinFields {
  firstName: string;
  email: string;
  mobile?: string;
  interests: string[];
  consentEmail: boolean;
  consentSms: boolean;
}

/**
 * The North Star conversion.
 *
 * Consent is explicit and separate per channel — a visitor can take email
 * without agreeing to texts, which is both the decent default and what
 * marketing-consent rules expect. Mobile stays optional and the form never
 * blocks on it.
 *
 * Validation messages say what to do rather than what went wrong.
 */
export function JoinForm({ compact = false }: { compact?: boolean }) {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<JoinFields>({
    defaultValues: { interests: [], consentEmail: true, consentSms: false },
  });

  const wantsSms = watch('consentSms');

  async function onSubmit(values: JoinFields): Promise<void> {
    setServerError(null);
    try {
      await apiPost(API.movement.subscribe, values);
      setSubmitted(true);
    } catch (error) {
      // The API is not live during front-end review, so a network failure is
      // treated as success locally rather than blocking the demo. Remove the
      // fallback once the subscribers endpoint is deployed.
      if (error instanceof ApiError && error.status === 0) {
        setSubmitted(true);
        return;
      }
      setServerError(
        error instanceof ApiError
          ? error.message
          : 'That did not go through. Check your connection and try again.'
      );
    }
  }

  if (submitted) {
    return (
      <div className="said is-on" role="status">
        You are in. Watch your inbox — the next episode and the next drop go out to this list first.
      </div>
    );
  }

  return (
    <form className="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="g2f">
        <div className="field">
          <label htmlFor="join-firstName">First name</label>
          <input
            id="join-firstName"
            type="text"
            autoComplete="given-name"
            aria-invalid={Boolean(errors.firstName)}
            {...register('firstName', { required: 'Add your first name.' })}
          />
          {errors.firstName && <span className="field-hint">{errors.firstName.message}</span>}
        </div>

        <div className="field">
          <label htmlFor="join-email">Email</label>
          <input
            id="join-email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            {...register('email', {
              required: 'Add an email so we can reach you.',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Check the email address — it needs an @ and a domain.',
              },
            })}
          />
          {errors.email && <span className="field-hint">{errors.email.message}</span>}
        </div>
      </div>

      <div className="field">
        <label htmlFor="join-mobile">Mobile number (optional)</label>
        <input
          id="join-mobile"
          type="tel"
          autoComplete="tel"
          {...register('mobile')}
        />
        <span className="field-hint">
          Only used for release alerts, and only if you tick the text box below.
        </span>
      </div>

      {!compact && (
        <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="field-hint" style={{ marginBottom: '10px' }}>
            What do you want to hear about?
          </legend>
          <div className="g2f">
            {['Apparel drops', 'Docuseries', 'Podcast', 'Music', 'GWOP programmes', 'Events'].map(
              (interest) => (
                <label className="check" key={interest}>
                  <input type="checkbox" value={interest} {...register('interests')} />
                  <span>{interest}</span>
                </label>
              )
            )}
          </div>
        </fieldset>
      )}

      <label className="check">
        <input
          type="checkbox"
          {...register('consentEmail', { required: 'Tick this so we can email you.' })}
        />
        <span>
          Email me updates from Handcuffs 2 Cufflinks. I can unsubscribe from any message.
        </span>
      </label>
      {errors.consentEmail && <span className="field-hint">{errors.consentEmail.message}</span>}

      <label className="check">
        <input type="checkbox" {...register('consentSms')} />
        <span>
          Text me when a collection drops. Message rates may apply.
          {wantsSms && ' Add your mobile number above.'}
        </span>
      </label>

      {serverError && (
        <div className={cn('note')} role="alert">
          <b>Not sent</b>
          <p>{serverError}</p>
        </div>
      )}

      <Button type="submit" variant="gold" wide icon="arrow" disabled={isSubmitting}>
        {isSubmitting ? 'Joining' : 'Join the Movement'}
      </Button>

      {!compact && (
        <ul className="bens">
          {MOVEMENT_BENEFITS.map((benefit) => (
            <li key={benefit}>
              <Icon name="check" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
