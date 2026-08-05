import type { ReactNode, CSSProperties } from 'react';
import { cn } from '@/lib/cn';
import { SmartImage } from '@/shared/media';
import type { MediaRatio } from '@/types';

// Reveal-on-scroll wrapper. `delay` maps to the staggered d1/d2/d3 classes.
export function Reveal({
  children,
  as: Tag = 'div',
  delay,
  className,
  style,
}: {
  children: ReactNode;
  as?: keyof JSX.IntrinsicElements;
  delay?: 1 | 2 | 3;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <Tag className={cn('rise', delay && `d${delay}`, className)} style={style}>
      {children}
    </Tag>
  );
}

// Section eyebrow with the "cuff" marker (two hairlines closed by a link).
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="eyebrow rise">
      <span className="cuff" aria-hidden="true">
        <i />
        <b />
        <i />
      </span>
      {children}
    </p>
  );
}

// A section on the arc. `tone` sets the surface (t-0 … t-7, t-light, t-paper).
export function Section({
  tone = 't-0',
  id,
  children,
  className,
}: {
  tone?: string;
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn('sec', tone, className)}>
      <div className="wrap">{children}</div>
    </section>
  );
}

/**
 * Real photography well. Now a thin wrapper over SmartImage so every
 * caller inherits skeleton-while-loading and branded fallback safety.
 */
export function PhotoWell({
  src,
  alt,
  ratio = '4x5',
  warm = true,
  caption,
  className,
}: {
  src?: string;
  alt: string;
  ratio?: MediaRatio;
  warm?: boolean;
  caption?: string;
  className?: string;
}) {
  return (
    <SmartImage
      src={src}
      alt={alt}
      ratio={ratio}
      warm={warm}
      caption={caption}
      className={className}
    />
  );
}

export const PlayIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M8 5v14l11-7z" />
  </svg>
);
