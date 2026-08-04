import { PenLine, Users, Video } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ButtonLink } from '@/components/ui/Button';

const ways = [
  { icon: PenLine, title: 'Share your chapter', body: 'Submit the story only you can tell.' },
  { icon: Video, title: 'Upload your proof', body: 'Photos and video of the distance you\u2019ve crossed.' },
  { icon: Users, title: 'Nominate a guest', body: 'Point us to someone whose story needs telling.' },
];

export function CommunityCallout() {
  return (
    <section id="community" className="section-y relative overflow-hidden bg-ink">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gold/30" aria-hidden />
      <Container>
        <div className="rounded-3xl border border-faint/40 bg-onyx p-8 sm:p-14">
          <SectionHeading
            eyebrow="Community"
            title="The movement isn’t watched. It’s joined."
            intro="Every story here was once someone deciding to speak. Add yours, and become proof for the next person."
          />

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {ways.map((w, i) => (
              <Reveal key={w.title} delay={i * 80}>
                <div className="flex h-full flex-col gap-4 rounded-2xl border border-faint/30 bg-ink p-6">
                  <span className="grid h-11 w-11 place-items-center rounded-full border border-gold/40 text-gold">
                    <w.icon size={18} />
                  </span>
                  <h3 className="font-display text-lg font-semibold text-bone">{w.title}</h3>
                  <p className="text-sm leading-relaxed text-muted">{w.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <ButtonLink to="/community" variant="green" size="lg" withArrow>
              Share your story
            </ButtonLink>
            <p className="font-mono text-xs uppercase tracking-eyebrow text-faint">
              Reviewed with care before publishing
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
