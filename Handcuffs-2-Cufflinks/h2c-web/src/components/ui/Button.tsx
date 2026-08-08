import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils/cn';
import { Icon } from './Icon';
import type { IconName } from './Icon';

type Variant = 'gold' | 'ghost' | 'emerald';
type Size = 'default' | 'sm';

interface CommonProps {
  variant?: Variant;
  size?: Size;
  wide?: boolean;
  icon?: IconName;
  children: React.ReactNode;
  className?: string;
}

/**
 * Gold is the primary action and belongs to "Join the Movement" wherever both
 * appear — the North Star CTA should never be the quieter of two buttons on a
 * screen.
 */
function classes({ variant = 'gold', size = 'default', wide, className }: CommonProps): string {
  return cn(
    'btn',
    `btn--${variant}`,
    size === 'sm' && 'btn--sm',
    wide && 'btn--wide',
    className
  );
}

type ButtonProps = CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * `forwardRef` so a dialog can move focus onto its safe action. Without it the
 * session prompt would open with focus left behind on the page underneath,
 * which for a keyboard user means the countdown runs while they hunt for the
 * button.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, wide, icon, children, className, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={rest.type ?? 'button'}
      className={classes({ variant, size, wide, className, children })}
      {...rest}
    >
      {children}
      {icon && <Icon name={icon} />}
    </button>
  );
});

type ButtonLinkProps = CommonProps & {
  to: string;
} & Omit<React.ComponentProps<typeof Link>, 'to' | 'className'>;

export function ButtonLink({ to, variant, size, wide, icon, children, className, ...rest }: ButtonLinkProps) {
  return (
    <Link to={to} className={classes({ variant, size, wide, className, children })} {...rest}>
      {children}
      {icon && <Icon name={icon} />}
    </Link>
  );
}

type ButtonAnchorProps = CommonProps & React.AnchorHTMLAttributes<HTMLAnchorElement>;

/** For genuinely external destinations only — YouTube, streaming platforms. */
export function ButtonAnchor({ variant, size, wide, icon, children, className, ...rest }: ButtonAnchorProps) {
  return (
    <a
      className={classes({ variant, size, wide, className, children })}
      target="_blank"
      rel="noreferrer noopener"
      {...rest}
    >
      {children}
      {icon && <Icon name={icon} />}
    </a>
  );
}

/** The understated inline link. Gains its underline and widens on hover. */
export function ArrowLink({
  to,
  children,
  className,
}: {
  to: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link to={to} className={cn('link', className)}>
      {children}
      <Icon name="arrow" />
    </Link>
  );
}

interface RowProps extends React.HTMLAttributes<HTMLDivElement> {
  center?: boolean;
  children: React.ReactNode;
}

export function Row({ center = false, className, children, ...rest }: RowProps) {
  return (
    <div className={cn('row', center && 'row--c', className)} {...rest}>
      {children}
    </div>
  );
}
