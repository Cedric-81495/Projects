import { cn } from '@/lib/cn';

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full border border-line bg-paper px-2 py-0.5 text-xs text-ink-muted',
      className,
    )}>
      {children}
    </span>
  );
}
