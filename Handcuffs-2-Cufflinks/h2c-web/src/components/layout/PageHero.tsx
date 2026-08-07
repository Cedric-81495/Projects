import { Eyebrow } from '@/components/ui/Eyebrow';
import { Arc } from '@/components/ui/Section';
import type { Surface } from '@/components/ui/Section';
import { cn } from '@/lib/utils/cn';

interface PageHeroProps {
  eyebrow: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  surface?: Surface;
  children?: React.ReactNode;
}

/** Interior page header. Every page below the homepage opens with one. */
export function PageHero({
  eyebrow,
  title,
  lede,
  surface = 'obsidian',
  children,
}: PageHeroProps) {
  return (
    <section className={cn('phero', `s-${surface}`)}>
      <Arc position="tr" />
      <div className="wrap">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="h-xl rise d1">{title}</h1>
        {lede && <p className="lede rise d2" style={{ marginTop: '0.6em' }}>{lede}</p>}
        {children}
      </div>
    </section>
  );
}
