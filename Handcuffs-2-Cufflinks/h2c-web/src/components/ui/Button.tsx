import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/cn';

type Variant = 'gold' | 'green' | 'ghost' | 'outline';
type Size = 'md' | 'lg';

const base =
  'group inline-flex items-center justify-center gap-2 font-medium tracking-tight ' +
  'transition-all duration-300 ease-ease disabled:opacity-50 disabled:pointer-events-none ' +
  'rounded-full whitespace-nowrap';

const sizes: Record<Size, string> = {
  md: 'h-11 px-6 text-sm',
  lg: 'h-14 px-8 text-base',
};

const variants: Record<Variant, string> = {
  gold: 'bg-gold-sheen text-ink hover:brightness-110 shadow-[0_10px_30px_-12px_rgb(var(--c-gold)/0.6)]',
  green:
    'bg-green text-bone hover:bg-green-bright shadow-[0_10px_30px_-12px_rgb(var(--c-green)/0.7)]',
  outline: 'border border-gold/50 text-bone hover:border-gold hover:bg-gold/5',
  ghost: 'text-bone/80 hover:text-bone',
};

type CommonProps = {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
  withArrow?: boolean;
};

export function Button({
  children,
  variant = 'gold',
  size = 'md',
  className,
  withArrow = false,
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn(base, sizes[size], variants[variant], className)} {...rest}>
      {children}
      {withArrow && <Arrow />}
    </button>
  );
}

export function ButtonLink({
  children,
  to,
  variant = 'gold',
  size = 'md',
  className,
  withArrow = false,
  external = false,
}: CommonProps & { to: string; external?: boolean }) {
  const cls = cn(base, sizes[size], variants[variant], className);
  const content = (
    <>
      {children}
      {withArrow && <Arrow />}
    </>
  );
  if (external) {
    return (
      <a href={to} target="_blank" rel="noreferrer" className={cls}>
        {content}
      </a>
    );
  }
  return (
    <Link to={to} className={cls}>
      {content}
    </Link>
  );
}

function Arrow() {
  return (
    <ArrowUpRight
      size={18}
      className="transition-transform duration-300 ease-ease group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
    />
  );
}
