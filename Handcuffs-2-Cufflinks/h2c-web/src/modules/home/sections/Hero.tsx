import { Play } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { ButtonLink } from '@/components/ui/Button';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-ink pt-24 sm:pt-28">
      {/* Ambient light: emerald (left) resolving to gold (right) */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -left-32 top-24 h-[32rem] w-[32rem] rounded-full bg-green/10 blur-[120px]" />
        <div className="absolute -right-24 top-10 h-[36rem] w-[36rem] rounded-full bg-gold/15 blur-[120px]" />
        <div className="absolute inset-0 bg-grain opacity-[0.035] mix-blend-screen" />
      </div>

      <Container className="relative">
        {/* Accessible headline for SEO/screen readers; the visual carries the brand. */}
        <h1 className="sr-only">
          Handcuffs 2 Cufflinks — from struggle to success. Faith. Family. Freedom. Legacy in motion.
        </h1>

        <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-faint/30 shadow-raise">
          <img
            src="/brand/hero.jpg"
            alt="Handcuffs 2 Cufflinks — From struggle to success. Boston skyline at night."
            width={1610}
            height={977}
            className="w-full"
            loading="eager"
            decoding="async"
          />
        </div>

        <p className="mx-auto mt-10 max-w-xl text-pretty text-center text-lg leading-relaxed text-muted">
          One is fastened to you. The other, you fasten yourself. This is the story of the
          distance between them &mdash; and everyone walking it.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <ButtonLink to="/join" size="lg" variant="gold" withArrow>
            Join the movement
          </ButtonLink>
          <ButtonLink to="/stories" size="lg" variant="outline">
            <Play size={16} className="fill-current" />
            Watch the film
          </ButtonLink>
        </div>

        <p className="mx-auto mt-10 max-w-md text-center font-mono text-[0.7rem] uppercase tracking-eyebrow text-faint">
          Faith &middot; Family &middot; Freedom &middot; Legacy in motion
        </p>
      </Container>
    </section>
  );
}
