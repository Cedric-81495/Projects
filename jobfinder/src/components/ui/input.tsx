import * as React from 'react';
import { cn } from '@/lib/cn';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-10 w-full rounded-card border border-line bg-paper-raised px-3 text-sm text-ink',
        'placeholder:text-ink-muted/70',
        'focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/20',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'h-9 w-full rounded-card border border-line bg-paper-raised px-2 text-sm text-ink',
        'focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/20',
        className,
      )}
      {...props}
    />
  ),
);
Select.displayName = 'Select';
