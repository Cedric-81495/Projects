import { cn } from '@/lib/utils/cn';

/**
 * Surface themes. Each class re-declares --surface / --fg / --fg-quiet /
 * --rule / --accent, so any component dropped inside inherits the right
 * treatment without knowing where it sits. This is what lets the page move
 * from obsidian through steel to emerald and back without per-component
 * variants.
 *
 * There is deliberately no light surface. White and grey are not brand
 * colours, so every surface here is drawn from the obsidian / charcoal /
 * emerald families and the page never leaves them.
 */
export type Surface =
  | 'pitch'
  | 'obsidian'
  | 'obsidian2'
  | 'charcoal'
  | 'charcoal-hi'
  | 'drift'
  | 'forest'
  | 'emerald-ink'
  | 'emerald';

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  surface?: Surface;
  /** Reduces top padding when a section continues the one above it. */
  tight?: boolean;
  children: React.ReactNode;
}

export function Section({
  surface = 'obsidian',
  tight = false,
  className,
  children,
  ...rest
}: SectionProps) {
  return (
    <section className={cn('sec', `s-${surface}`, tight && 'sec--tight', className)} {...rest}>
      {children}
    </section>
  );
}

interface WrapProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Constrains to a comfortable reading measure for story copy. */
  narrow?: boolean;
  children: React.ReactNode;
}

export function Wrap({ narrow = false, className, children, ...rest }: WrapProps) {
  return (
    <div className={cn('wrap', narrow && 'wrap--narrow', className)} {...rest}>
      {children}
    </div>
  );
}

/**
 * Transition bands. The page's colour arc is deliberate: steel for the past,
 * emerald for the turn, and a return to steel where the movement's own voices
 * speak. These bands carry the eye between those states so the shift reads as
 * a journey rather than a theme change.
 */
export type BandDirection =
  | 'to-forest'
  | 'to-emerald'
  | 'to-steel'
  | 'to-emerald-deep'
  | 'to-black';

export function Band({ direction }: { direction: BandDirection }) {
  return <div className={cn('band', `band--${direction}`)} aria-hidden="true" />;
}

/** The gold meridian from the key art, reused as section furniture. */
export function Arc({ position }: { position: 'tr' | 'bl' }) {
  return (
    <div className={cn('arc', `arc--${position}`)} aria-hidden="true">
      <svg viewBox="0 0 400 400" preserveAspectRatio="none">
        <path d="M400 0A400 400 0 0 0 0 400" />
      </svg>
    </div>
  );
}
