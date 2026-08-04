import type { ReactNode } from 'react';
import { Eyebrow } from './Eyebrow';
import { cn } from '@/lib/cn';

/**
 * Section header used across the site.
 * `index` renders a mono chapter numeral — only pass it where content is a
 * real sequence (the transformation journey), never as decoration.
 */
export function SectionHeading({
  eyebrow,
  title,
  intro,
  index,
  align = 'left',
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  index?: string;
  align?: 'left' | 'center';
  className?: string;
}) {
  return (
    <header
      className={cn(
        'flex flex-col gap-5',
        align === 'center' && 'items-center text-center',
        className,
      )}
    >
      <div className="flex items-center gap-4">
        {index && (
          <span className="font-mono text-xs text-gold/70" aria-hidden>
            {index}
          </span>
        )}
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      </div>
      <h2 className="max-w-3xl text-balance font-display text-display-md font-semibold text-bone">
        {title}
      </h2>
      {intro && (
        <p className="max-w-prose text-pretty text-base leading-relaxed text-muted sm:text-lg">
          {intro}
        </p>
      )}
    </header>
  );
}
