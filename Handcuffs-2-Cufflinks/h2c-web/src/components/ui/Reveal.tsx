import type { ElementType, ReactNode } from 'react';
import { useReveal } from '@/hooks/useReveal';
import { cn } from '@/lib/cn';

export function Reveal({
  children,
  as: Tag = 'div',
  delay = 0,
  className,
}: {
  children: ReactNode;
  as?: ElementType;
  delay?: number;
  className?: string;
}) {
  const { ref, visible } = useReveal();
  return (
    <Tag
      ref={ref}
      style={{ ['--reveal-delay' as string]: `${delay}ms` }}
      className={cn('reveal', visible && 'is-visible', className)}
    >
      {children}
    </Tag>
  );
}
