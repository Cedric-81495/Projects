import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';

/** Official H2C wordmark (platinum/gold on dark). Served from /public/brand. */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      aria-label="Handcuffs 2 Cufflinks — home"
      className={cn('inline-flex items-center', className)}
    >
      <img
        src="/brand/logo-mark.png"
        alt="Handcuffs 2 Cufflinks"
        width={1400}
        height={822}
        className="h-9 w-auto sm:h-11"
        loading="eager"
        decoding="async"
      />
    </Link>
  );
}
