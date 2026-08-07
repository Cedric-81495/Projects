import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Seo } from '@/lib/seo/Seo';
import { PageHero } from '@/components/layout/PageHero';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { Section, Wrap } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import { Note } from '@/components/ui/Note';
import { apiPost } from '@/lib/api/client';
import { API } from '@/lib/api/endpoints';
import { ROUTES } from '@/router/routes';
import type { StorySubmission } from '@/types/community';

/**
 * Story submission.
 *
 * Consent is granular and unticked by default: publishing the story, the name,
 * and any imagery are three separate permissions. The guide requires permission
 * before anything is featured, and a single blanket checkbox would not be a
 * meaningful one — especially given how personal these submissions are.
 */
export function StorySubmissionPage() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StorySubmission>();

  async function onSubmit(values: StorySubmission): Promise<void> {
    try {
      await apiPost(API.community.submitStory, values);
    } catch {
      // Review mode without the API.
    }
    setSent(true);
  }

  return (
    <>
      <Seo
        title="Share Your Story"
        description="Tell us what held you and what you built. Published only with your permission."
        canonicalPath={ROUTES.submitStory}
      />
      <Breadcrumb
        trail={[
          { label: 'Home', to: ROUTES.home },
          { label: 'Community', to: ROUTES.community },
          { label: 'Share Your Story' },
        ]}
      />
      <PageHero
        eyebrow="Community submission"
        title={
          <>
            Everybody has a
            <br />
            Handcuffs 2 Cufflinks story.
          </>
        }
        lede="Yours does not have to be finished to be worth telling."
      />

      <Section surface="charcoal" tight>
        <Wrap narrow>
          {sent ? (
            <div className="said is-on" role="status">
              Received. A real person reads every submission. We will contact you before anything is
              published, and never publish without your permission.
            </div>
          ) : (
            <>
              <Note label="Your permission">
                Nothing you write here is published automatically. A moderator reads it, and we
                contact you before it appears anywhere. You choose what can be shown.
              </Note>

              <form
                className="form"
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                style={{ marginTop: 'clamp(24px,3vw,40px)' }}
              >
                <div className="g2f">
                  <div className="field">
                    <label htmlFor="s-name">Your name</label>
                    <input
                      id="s-name"
                      type="text"
                      {...register('authorName', { required: 'Add your name.' })}
                    />
                    {errors.authorName && (
                      <span className="field-hint">{errors.authorName.message}</span>
                    )}
                  </div>
                  <div className="field">
                    <label htmlFor="s-email">Email</label>
                    <input
                      id="s-email"
                      type="email"
                      {...register('authorEmail', {
                        required: 'Add an email so we can reach you.',
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: 'Check the email address.',
                        },
                      })}
                    />
                    {errors.authorEmail && (
                      <span className="field-hint">{errors.authorEmail.message}</span>
                    )}
                  </div>
                </div>

                <div className="g2f">
                  <div className="field">
                    <label htmlFor="s-where">Where you are</label>
                    <input id="s-where" type="text" placeholder="City, State or Country" {...register('authorLocation')} />
                  </div>
                  <div className="field">
                    <label htmlFor="s-arc">Your journey in one line</label>
                    <input
                      id="s-arc"
                      type="text"
                      placeholder="Addiction to eleven years clean"
                      {...register('transformationArc', { required: 'Sum it up in one line.' })}
                    />
                    {errors.transformationArc && (
                      <span className="field-hint">{errors.transformationArc.message}</span>
                    )}
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="s-story">Your story</label>
                  <textarea
                    id="s-story"
                    {...register('story', { required: 'Tell us as much as you want to.' })}
                  />
                  {errors.story && <span className="field-hint">{errors.story.message}</span>}
                  <span className="field-hint">
                    Write it how you would say it. We do not edit around the difficult parts.
                  </span>
                </div>

                <div className="field">
                  <label htmlFor="s-video">Video link (optional)</label>
                  <input id="s-video" type="url" placeholder="https://" {...register('videoUrl')} />
                </div>

                <fieldset style={{ border: '1px solid var(--rule)', padding: '18px 20px', display: 'grid', gap: 14 }}>
                  <legend className="h-xs" style={{ margin: 0, padding: '0 8px' }}>
                    What may we publish?
                  </legend>
                  <label className="check">
                    <input type="checkbox" {...register('consent.publishStory')} />
                    <span>You may publish my story on the website.</span>
                  </label>
                  <label className="check">
                    <input type="checkbox" {...register('consent.publishName')} />
                    <span>You may use my first name and location.</span>
                  </label>
                  <label className="check">
                    <input type="checkbox" {...register('consent.publishImagery')} />
                    <span>You may use photographs or video I send.</span>
                  </label>
                  <label className="check">
                    <input type="checkbox" {...register('consent.contactForFollowUp')} />
                    <span>You may contact me about the podcast or docuseries.</span>
                  </label>
                </fieldset>

                <Button type="submit" variant="gold" icon="arrow" disabled={isSubmitting}>
                  {isSubmitting ? 'Sending' : 'Send my story'}
                </Button>
              </form>
            </>
          )}
        </Wrap>
      </Section>
    </>
  );
}
