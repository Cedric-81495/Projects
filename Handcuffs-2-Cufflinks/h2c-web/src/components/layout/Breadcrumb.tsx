import { Link } from 'react-router-dom';
import type { Surface } from '@/components/ui/Section';
import { cn } from '@/lib/utils/cn';

export interface Crumb {
  label: string;
  to?: string;
}

export function Breadcrumb({
  trail,
  surface = 'obsidian',
}: {
  trail: Crumb[];
  surface?: Surface;
}) {
  return (
    <nav className={cn('crumb', `s-${surface}`)} aria-label="Breadcrumb">
      <ol>
        {trail.map((crumb, i) => (
          <li key={`${crumb.label}-${i}`}>
            {crumb.to && i < trail.length - 1 ? (
              <Link to={crumb.to}>{crumb.label}</Link>
            ) : (
              <span aria-current={i === trail.length - 1 ? 'page' : undefined}>{crumb.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
