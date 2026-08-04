import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Field, Textarea, TextInput } from '@/components/ui/Field';
import { submitCommunityStory } from '@/services/forms';
import { getApprovedStories, type CommunityStory } from '@/services/content';
import { useSubmit } from '@/hooks/useSubmit';

type FormState = { name: string; email: string; title: string; story: string };
const empty: FormState = { name: '', email: '', title: '', story: '' };

export function CommunityPage() {
  const [form, setForm] = useState<FormState>(empty);
  const { submit, reset, isSubmitting, isSuccess, error } = useSubmit(submitCommunityStory);
  const submitted = isSuccess;
  const [gallery, setGallery] = useState<CommunityStory[]>([]);

  useEffect(() => {
    let alive = true;
    getApprovedStories().then((s) => alive && setGallery(s));
    return () => {
      alive = false;
    };
  }, []);

  const set =
    (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    void submit({
      name: form.name.trim(),
      email: form.email.trim(),
      title: form.title.trim(),
      story: form.story.trim(),
    });
  }

  return (
    <>
      <PageHeader
        eyebrow="Community · Participate"
        title="Add your chapter."
        intro="Every story here was once someone deciding to speak. Submissions are read with care and reviewed before they're published."
      />

      <section className="section-y bg-ink">
        <Container size="prose">
          {submitted ? (
            <div className="rounded-2xl border border-green/40 bg-green-deep/20 p-8 text-center">
              <CheckCircle2 className="mx-auto text-green-bright" size={40} />
              <h2 className="mt-5 font-display text-2xl font-semibold text-bone">
                Thank you for trusting us with it.
              </h2>
              <p className="mx-auto mt-3 max-w-md text-pretty text-muted">
                Our team will read your story and reach out before anything is shared. Nothing gets
                published without your say.
              </p>
              <Button
                variant="outline"
                className="mt-8"
                onClick={() => {
                  setForm(empty);
                  reset();
                }}
              >
                Submit another
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-8" noValidate>
              <div className="grid gap-6 sm:grid-cols-2">
                <Field label="Your name" htmlFor="name">
                  <TextInput id="name" required value={form.name} onChange={set('name')} placeholder="First and last" />
                </Field>
                <Field label="Email" htmlFor="email">
                  <TextInput id="email" type="email" required value={form.email} onChange={set('email')} placeholder="you@email.com" />
                </Field>
              </div>
              <Field label="Give your story a title" htmlFor="title">
                <TextInput id="title" required value={form.title} onChange={set('title')} placeholder="The moment everything turned" />
              </Field>
              <Field
                label="Your story"
                htmlFor="story"
                hint="Start anywhere. There's no wrong way to tell it."
              >
                <Textarea id="story" required rows={8} value={form.story} onChange={set('story')} placeholder="Where did the distance begin, and where are you now?" />
              </Field>

              <div className="space-y-4">
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                  <Button type="submit" variant="green" size="lg" withArrow disabled={isSubmitting}>
                    {isSubmitting ? 'Sending\u2026' : 'Submit my story'}
                  </Button>
                  <p className="font-mono text-xs uppercase tracking-eyebrow text-faint">
                    Reviewed before publishing
                  </p>
                </div>
                {error && (
                  <p className="text-sm text-red-400" role="alert">
                    {error}
                  </p>
                )}
              </div>
            </form>
          )}
        </Container>
      </section>

      {gallery.length > 0 && (
        <section className="section-y border-t border-faint/25 bg-onyx">
          <Container>
            <h2 className="max-w-2xl text-balance font-display text-display-md font-semibold text-bone">
              Chapters from the community.
            </h2>
            <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {gallery.map((s) => (
                <li key={s.id} className="rounded-2xl border border-faint/30 bg-ink p-6">
                  <h3 className="font-display text-xl font-semibold text-bone">{s.title}</h3>
                  <p className="mt-3 line-clamp-6 text-pretty leading-relaxed text-muted">{s.story}</p>
                  <p className="mt-4 font-mono text-xs uppercase tracking-eyebrow text-gold">
                    &mdash; {s.name}
                  </p>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}
    </>
  );
}
