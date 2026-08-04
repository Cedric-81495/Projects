import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('eyebrow', className)}>
      <span aria-hidden className="h-px w-6 bg-gold/70" />
      {children}
    </span>
  );
}
