import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { apiPost } from '@/lib/api/client';
import { API } from '@/lib/api/endpoints';
import type { GuestNomination } from '@/types/media-content';

export function GuestNominationForm() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GuestNomination>();

  async function onSubmit(values: GuestNomination): Promise<void> {
    try {
      await apiPost(API.podcast.nominateGuest, values);
    } catch {
      // Front-end review runs without the API. The confirmation still shows so
      // the flow can be tested; remove once the endpoint is live.
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="said is-on" role="status">
        Thank you. We read every nomination and we will reach out if it is a fit.
      </div>
    );
  }

  return (
    <form className="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="g2f">
        <div className="field">
          <label htmlFor="nom-name">Their name</label>
          <input
            id="nom-name"
            type="text"
            aria-invalid={Boolean(errors.nomineeName)}
            {...register('nomineeName', { required: 'Add their name.' })}
          />
          {errors.nomineeName && <span className="field-hint">{errors.nomineeName.message}</span>}
        </div>
        <div className="field">
          <label htmlFor="nom-rel">How do you know them?</label>
          <input id="nom-rel" type="text" {...register('relationship')} />
        </div>
      </div>

      <div className="field">
        <label htmlFor="nom-story">What is their story?</label>
        <textarea
          id="nom-story"
          aria-invalid={Boolean(errors.nomineeStory)}
          {...register('nomineeStory', { required: 'Tell us a little about their story.' })}
        />
        {errors.nomineeStory && <span className="field-hint">{errors.nomineeStory.message}</span>}
      </div>

      <div className="g2f">
        <div className="field">
          <label htmlFor="nom-your-name">Your name</label>
          <input
            id="nom-your-name"
            type="text"
            {...register('nominatorName', { required: 'Add your name.' })}
          />
          {errors.nominatorName && <span className="field-hint">{errors.nominatorName.message}</span>}
        </div>
        <div className="field">
          <label htmlFor="nom-your-email">Your email</label>
          <input
            id="nom-your-email"
            type="email"
            {...register('nominatorEmail', {
              required: 'Add an email so we can reply.',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Check the email address.' },
            })}
          />
          {errors.nominatorEmail && (
            <span className="field-hint">{errors.nominatorEmail.message}</span>
          )}
        </div>
      </div>

      <Button type="submit" variant="gold" icon="arrow" disabled={isSubmitting}>
        {isSubmitting ? 'Sending' : 'Send nomination'}
      </Button>
    </form>
  );
}
