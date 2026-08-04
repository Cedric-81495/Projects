import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Field, TextInput } from '@/components/ui/Field';
import { joinMovement } from '@/services/forms';
import { useSubmit } from '@/hooks/useSubmit';
import { cn } from '@/lib/cn';

const interests = ['Watch the stories', 'Share my own', 'Support the mission', 'Wear the movement'];

export function JoinPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const { submit, isSubmitting, isSuccess, error } = useSubmit(joinMovement);
  const done = isSuccess;

  function toggle(tag: string) {
    setPicked((p) => (p.includes(tag) ? p.filter((t) => t !== tag) : [...p, tag]));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    void submit({ name: name.trim(), email: email.trim(), interests: picked });
  }

  return (
    <>
      <PageHeader
        eyebrow="Join the Movement"
        title={<>Your chapter starts here.</>}
        intro="Joining is a decision, not a purchase. Tell us how you want to walk with the movement and we'll meet you there."
      />

      <section className="section-y bg-ink">
        <Container size="prose">
          {done ? (
            <div className="rounded-2xl border border-gold/40 bg-onyx p-10 text-center">
              <CheckCircle2 className="mx-auto text-gold" size={40} />
              <h2 className="mt-5 font-display text-3xl font-semibold text-bone">
                Welcome to the movement.
              </h2>
              <p className="mx-auto mt-3 max-w-md text-pretty text-muted">
                You&rsquo;re in, {name || 'friend'}. Watch your inbox — the next chapter is on its
                way.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-8" noValidate>
              <div className="grid gap-6 sm:grid-cols-2">
                <Field label="Your name" htmlFor="jname">
                  <TextInput id="jname" required value={name} onChange={(e) => setName(e.target.value)} placeholder="First and last" />
                </Field>
                <Field label="Email" htmlFor="jemail">
                  <TextInput id="jemail" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
                </Field>
              </div>

              <fieldset>
                <legend className="text-sm font-medium text-bone">
                  How do you want to take part?
                </legend>
                <div className="mt-4 flex flex-wrap gap-3">
                  {interests.map((tag) => {
                    const active = picked.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggle(tag)}
                        className={cn(
                          'rounded-full border px-5 py-2.5 text-sm transition-colors',
                          active
                            ? 'border-gold bg-gold/10 text-gold'
                            : 'border-faint/50 text-muted hover:border-gold/50 hover:text-bone',
                        )}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div className="space-y-4">
                <Button type="submit" variant="gold" size="lg" withArrow disabled={isSubmitting}>
                  {isSubmitting ? 'Joining\u2026' : 'Join the movement'}
                </Button>
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
    </>
  );
}
