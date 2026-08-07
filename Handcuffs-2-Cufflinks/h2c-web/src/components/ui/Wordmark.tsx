import { cn } from '@/lib/utils/cn';

type WordmarkSize = 'sm' | 'md' | 'lg';

interface WordmarkProps {
  size?: WordmarkSize;
  className?: string;
}

/**
 * Typographic wordmark.
 *
 * Mirrors the logo lockup rather than restating the name in one colour: the two
 * words are struck metal and the "2" is gold, which is the brand's whole thesis
 * — steel is what held you, gold is what you build. Both treatments already
 * exist in the design system (.chrome-t and .gold), so this introduces no new
 * visual language.
 *
 * Rendered as text rather than an image so it stays sharp at any size, needs no
 * network request, and can be selected and read.
 */
export function Wordmark({ size = 'sm', className }: WordmarkProps) {
  return (
    <span className={cn('wordmark', `wordmark--${size}`, className)}>
      <span className="chrome-t">Handcuffs</span>
      <span className="wordmark-2 gold">2</span>
      <span className="chrome-t">Cufflinks</span>
    </span>
  );
}
