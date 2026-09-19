import { cn } from '@/lib/cn';

/**
 * Placeholder block. The pulse is disabled under prefers-reduced-motion by the
 * global rule in globals.css.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-line/70', className)} />;
}
