import { Play } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { ButtonLink } from '@/components/ui/Button';

export function Hero() {
  return (
    <section className="relative min-h-[92svh] w-full overflow-hidden bg-ink">
      {/* Full-bleed hero image */}
      <img
        src="/brand/hero.jpg"
        alt="Handcuffs 2 Cufflinks — From struggle to success. Boston skyline at night."
        width={1610}
        height={977}
        className="absolute inset-0 h-full w-full object-cover object-center"
        loading="eager"
        decoding="async"
        fetchPriority="high"
      />

      {/* Legibility gradients: darken top (under navbar) and bottom (behind CTAs) */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink/70 via-transparent to-ink/85" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink to-transparent to-40%" aria-hidden />

      {/* Content pinned to the bottom so it doesn't collide with the baked-in title */}
      <Container className="relative flex min-h-[92svh] flex-col items-center justify-end pb-14 pt-28 text-center sm:pb-20">
        <h1 className="sr-only">
          Handcuffs 2 Cufflinks — from struggle to success. Faith. Family. Freedom. Legacy in motion.
        </h1>

        <div className="flex w-full flex-col items-center justify-center gap-4 sm:flex-row">
          <ButtonLink to="/join" size="lg" variant="gold" withArrow className="w-full sm:w-auto">
            Join the movement
          </ButtonLink>
          <ButtonLink to="/stories" size="lg" variant="outline" className="w-full sm:w-auto">
            <Play size={16} className="fill-current" />
            Watch the film
          </ButtonLink>
        </div>

        <p className="mt-8 font-mono text-[0.65rem] uppercase tracking-eyebrow text-muted sm:text-xs">
          Faith &middot; Family &middot; Freedom &middot; Legacy in motion
        </p>
      </Container>
    </section>
  );
}
