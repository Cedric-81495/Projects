import { Cuff } from './Cuff';
import { cn } from '@/lib/utils/cn';

interface EyebrowProps {
  children: React.ReactNode;
  className?: string;
  /** Reveal on scroll along with the heading below it. */
  reveal?: boolean;
}

/**
 * Section label. Always paired with the cuff mark, always above the heading.
 * Renders as a <p> so it is read before the heading rather than competing
 * with it in the document outline.
 */
export function Eyebrow({ children, className, reveal = true }: EyebrowProps) {
  return (
    <p className={cn('eyebrow', reveal && 'rise', className)}>
      <Cuff />
      {children}
    </p>
  );
}
