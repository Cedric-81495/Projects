import type { ReactNode } from 'react';
import { Container } from './Container';
import { Eyebrow } from './Eyebrow';

/** Shared hero header for interior (non-home) pages. */
export function PageHeader({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="relative overflow-hidden border-b border-faint/30 bg-onyx">
      <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-gold/10 blur-3xl" />
      <Container className="relative py-24 sm:py-32">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="mt-6 max-w-4xl text-balance font-display text-display-lg font-semibold text-bone">
          {title}
        </h1>
        {intro && (
          <p className="mt-6 max-w-prose text-pretty text-lg leading-relaxed text-muted">
            {intro}
          </p>
        )}
        {children && <div className="mt-8">{children}</div>}
      </Container>
    </header>
  );
}
