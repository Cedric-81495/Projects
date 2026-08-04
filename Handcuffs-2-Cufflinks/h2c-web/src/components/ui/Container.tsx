import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Container({
  children,
  className,
  size = 'edge',
}: {
  children: ReactNode;
  className?: string;
  size?: 'edge' | 'prose';
}) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-5 sm:px-8',
        size === 'edge' ? 'max-w-edge' : 'max-w-prose',
        className,
      )}
    >
      {children}
    </div>
  );
}
