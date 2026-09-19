import * as React from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'outline' | 'ghost';
type Size = 'sm' | 'md';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-moss text-white hover:bg-moss-deep',
  outline: 'border border-line bg-paper-raised text-ink hover:border-moss hover:text-moss-deep',
  ghost: 'text-ink-muted hover:text-ink hover:bg-moss-wash',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-card font-medium transition-colors',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss',
        'disabled:pointer-events-none disabled:opacity-50',
        VARIANTS[variant], SIZES[size], className,
      )}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
