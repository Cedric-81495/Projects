import { useReveal } from '@/lib/useReveal';
import { Eyebrow, Reveal } from '@/shared/ui';
import { JoinForm } from './JoinForm';

export function JoinPage() {
  useReveal('join');
  return (
    <section className="sec t-5" style={{ minHeight: '70vh' }}>
      <div className="wrap" style={{ textAlign: 'center' }}>
        <Eyebrow>Engagement · become part of it</Eyebrow>
        <Reveal as="h2" delay={1} className="h2">Join the movement</Reveal>
        <Reveal delay={1} className="lede" as="p" style={{ margin: '0 auto 2em' }}>
          The first drop, the next episode, the new record — the list hears about all of it a
          day before anyone else.
        </Reveal>
        <Reveal delay={2}><JoinForm /></Reveal>
      </div>
    </section>
  );
}
