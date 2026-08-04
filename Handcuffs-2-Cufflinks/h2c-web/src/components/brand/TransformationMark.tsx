import { cn } from '@/lib/cn';

/**
 * The signature of the whole site: an iron shackle on the left that resolves,
 * through a linking chain, into a gold cufflink on the right.
 * Left = the past (cold iron). Right = the achieved self (burnished gold).
 *
 * `variant="thread"` draws a taller vertical version used as a page spine.
 */
export function TransformationMark({
  className,
  animate = true,
}: {
  className?: string;
  animate?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 420 120"
      role="img"
      aria-label="A handcuff transforming into a cufflink"
      className={cn('overflow-visible', className)}
    >
      <defs>
        <linearGradient id="tm-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgb(var(--c-gold-deep))" />
          <stop offset="55%" stopColor="rgb(var(--c-gold-bright))" />
          <stop offset="100%" stopColor="rgb(var(--c-gold))" />
        </linearGradient>
        <linearGradient id="tm-iron" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgb(var(--c-faint))" />
          <stop offset="100%" stopColor="rgb(var(--c-muted))" />
        </linearGradient>
        <linearGradient id="tm-bridge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgb(var(--c-muted))" />
          <stop offset="55%" stopColor="rgb(var(--c-green-bright))" />
          <stop offset="100%" stopColor="rgb(var(--c-gold-bright))" />
        </linearGradient>
      </defs>

      {/* Iron shackle (the past) */}
      <g fill="none" stroke="url(#tm-iron)" strokeWidth="7" strokeLinecap="round">
        <circle cx="66" cy="60" r="40" />
        <circle cx="66" cy="60" r="24" strokeWidth="4" opacity="0.6" />
        <path d="M96 34 L118 34" strokeWidth="8" />
      </g>

      {/* Connecting chain — the transition, tinged green (growth) into gold */}
      <g
        fill="none"
        stroke="url(#tm-bridge)"
        strokeWidth="6"
        strokeLinecap="round"
        className={animate ? 'tm-draw' : undefined}
      >
        <path d="M118 44 C 150 20, 190 20, 214 46" />
        <path d="M118 76 C 150 100, 190 100, 214 74" />
      </g>

      {/* Gold cufflink (the achieved self) */}
      <g>
        <circle cx="300" cy="60" r="42" fill="none" stroke="url(#tm-gold)" strokeWidth="7" />
        <circle cx="300" cy="60" r="19" fill="url(#tm-gold)" />
        <circle cx="300" cy="60" r="6" fill="rgb(var(--c-ink))" opacity="0.55" />
        {/* cufflink bar */}
        <path d="M300 18 L300 4" stroke="url(#tm-gold)" strokeWidth="7" strokeLinecap="round" />
        <path d="M300 102 L300 116" stroke="url(#tm-gold)" strokeWidth="7" strokeLinecap="round" />
        {/* facet glints */}
        <path d="M288 48 L296 52" stroke="rgb(var(--c-bone))" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
      </g>
    </svg>
  );
}
