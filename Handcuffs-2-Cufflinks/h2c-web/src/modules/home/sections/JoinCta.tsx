import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { ButtonLink } from '@/components/ui/Button';
import { TransformationMark } from '@/components/brand/TransformationMark';

export function JoinCta() {
  return (
    <section id="join" className="relative overflow-hidden bg-ink">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute left-1/2 top-1/2 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/10 blur-[130px]" />
      </div>
      <Container className="relative py-28 sm:py-40">
        <Reveal className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <TransformationMark className="h-20 w-64" animate={false} />
          <h2 className="mt-10 text-balance font-display text-display-lg font-semibold text-bone">
            Your chapter starts <span className="gold-text">here.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted">
            Join thousands turning a past they didn&rsquo;t choose into a self they did. It costs
            nothing but the decision.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <ButtonLink to="/join" size="lg" variant="gold" withArrow>
              Join the movement
            </ButtonLink>
            <ButtonLink to="/community" size="lg" variant="outline">
              Share your story
            </ButtonLink>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
