import { Play } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { ButtonLink } from '@/components/ui/Button';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { TransformationMark } from '@/components/brand/TransformationMark';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-ink pt-28 sm:pt-36">
      {/* Ambient light: cold (left) resolving to gold (right) */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -left-32 top-24 h-[32rem] w-[32rem] rounded-full bg-green/10 blur-[120px]" />
        <div className="absolute -right-24 top-10 h-[36rem] w-[36rem] rounded-full bg-gold/15 blur-[120px]" />
        <div className="absolute inset-0 bg-grain opacity-[0.035] mix-blend-screen" />
      </div>

      <Container className="relative">
        <div className="mx-auto max-w-4xl text-center">
          <Eyebrow className="justify-center">A movement of transformation</Eyebrow>

          <h1 className="mt-8 text-balance font-display text-display-xl font-semibold leading-[0.94] text-bone">
            From <span className="italic text-muted">handcuffs</span>
            <br className="hidden sm:block" /> to <span className="gold-text">cufflinks.</span>
          </h1>

          <p className="mx-auto mt-8 max-w-xl text-pretty text-lg leading-relaxed text-muted">
            One is fastened to you. The other, you fasten yourself. This is the story of the
            distance between them &mdash; and everyone walking it.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <ButtonLink to="/join" size="lg" variant="gold" withArrow>
              Join the movement
            </ButtonLink>
            <ButtonLink to="/stories" size="lg" variant="outline">
              <Play size={16} className="fill-current" />
              Watch the film
            </ButtonLink>
          </div>
        </div>

        {/* Signature mark */}
        <div className="mx-auto mt-20 flex max-w-3xl justify-center px-4">
          <TransformationMark className="h-28 w-full sm:h-36" />
        </div>

        <p className="mx-auto mt-6 max-w-md text-center font-mono text-[0.7rem] uppercase tracking-eyebrow text-faint">
          Iron &rarr; chain &rarr; gold
        </p>
      </Container>
    </section>
  );
}
