import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';

/** Compact wordmark: H2C monogram cufflink + name. */
export function Logo({ className, showName = true }: { className?: string; showName?: boolean }) {
  return (
    <Link
      to="/"
      aria-label="Handcuffs 2 Cufflinks — home"
      className={cn('group inline-flex items-center gap-3', className)}
    >
      <span className="relative grid h-9 w-9 place-items-center rounded-full border border-gold/60">
        <span className="h-3.5 w-3.5 rounded-full bg-gold-sheen transition-transform duration-500 ease-ease group-hover:scale-110" />
        <span className="absolute inset-0 rounded-full ring-1 ring-inset ring-gold/20" />
      </span>
      {showName && (
        <span className="leading-none">
          <span className="block font-display text-[0.95rem] font-semibold tracking-tight text-bone">
            Handcuffs<span className="text-gold"> 2 </span>Cufflinks
          </span>
          <span className="mt-0.5 block font-mono text-[0.58rem] uppercase tracking-eyebrow text-muted">
            The Movement
          </span>
        </span>
      )}
    </Link>
  );
}
