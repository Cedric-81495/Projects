import { cn } from '@/lib/utils/cn';

/**
 * Single toast anchored bottom-centre. Announced politely so engagement
 * confirmations reach screen readers without interrupting them.
 */
export function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div className={cn('toast', visible && 'is-on')} role="status" aria-live="polite">
      {message}
    </div>
  );
}
