import { Container } from '@/components/ui/Container';
import { ButtonLink } from '@/components/ui/Button';

export function NotFoundPage() {
  return (
    <section className="grid min-h-[70vh] place-items-center bg-ink">
      <Container className="text-center">
        <p className="font-mono text-sm uppercase tracking-eyebrow text-gold">404</p>
        <h1 className="mt-6 font-display text-display-lg font-semibold text-bone">
          This chapter isn&rsquo;t written yet.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-muted">
          The page you&rsquo;re looking for moved or never existed. The movement is still right where
          you left it.
        </p>
        <ButtonLink to="/" variant="gold" className="mt-8" withArrow>
          Back to the movement
        </ButtonLink>
      </Container>
    </section>
  );
}
