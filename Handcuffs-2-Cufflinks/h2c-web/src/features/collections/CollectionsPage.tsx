import { useState } from 'react';
import { Seo } from '@/lib/seo/Seo';
import { PageHero } from '@/components/layout/PageHero';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { Section, Wrap } from '@/components/ui/Section';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Note } from '@/components/ui/Note';
import { ApparelCard } from './components/ApparelCard';
import { VoteMeter } from './components/VoteMeter';
import { APPAREL as APPAREL_SEED } from '@/data/apparel';
import { COLLECTIONS as COLLECTIONS_SEED } from '@/data/collections';
import { ROUTES } from '@/router/routes';
import { cn } from '@/lib/utils/cn';
import { SectionLoad } from '@/components/ui/Spinner';
import { useContent } from '@/lib/api/useContent';
import { toApparel, toCollection } from '@/lib/content/adapters';
import type { ApiApparelItem, ApiCollection } from '@/lib/content/adapters';

/**
 * Collections — showcase only.
 *
 * There is no price, no cart, and no checkout anywhere on this page, and that
 * is a requirement rather than an omission. The note near the top says so
 * plainly so a visitor never hunts for a buy button that does not exist.
 */
export function CollectionsPage() {
  const { items: COLLECTIONS } = useContent<ApiCollection, (typeof COLLECTIONS_SEED)[number]>(
    '/collections',
    toCollection,
    COLLECTIONS_SEED
  );

  /**
   * Apparel carries a collection id, not a slug, so the filter buttons need the
   * collections in hand before the mapping means anything. Building the lookup
   * from whatever has arrived keeps the grid usable during the moment when
   * apparel has loaded and collections have not.
   */
  const slugById = Object.fromEntries(
    COLLECTIONS.map((collection) => {
      const withId = collection as { id?: string; slug: string };
      return [withId.id ?? withId.slug, withId.slug];
    })
  );

  const { items: APPAREL, loading } = useContent<ApiApparelItem, (typeof APPAREL_SEED)[number]>(
    '/apparel',
    (item) => toApparel(item, 0, slugById),
    APPAREL_SEED,
    { params: { pageSize: 100 } }
  );

  const [filter, setFilter] = useState<string>('all');

  const items = filter === 'all' ? APPAREL : APPAREL.filter((a) => a.coll === filter);

  return (
    <>
      <Seo
        title="Collections"
        description="Apparel that carries the message of transformation. Like, save, and vote for the pieces you want made."
        canonicalPath={ROUTES.collections}
      />
      <Breadcrumb trail={[{ label: 'Home', to: ROUTES.home }, { label: 'Collections' }]} />
      <PageHero
        eyebrow="Collections"
        title="Wear the transformation"
        lede="Every piece carries a meaning. None of it is for sale yet — what the movement likes, saves and votes for is what gets made first."
      />

      <Section surface="charcoal" tight>
        <Wrap>
          <Note label="Showcase">
            This is a showcase, not a store. Nothing here can be purchased yet. Use the controls on
            each piece to tell us what to produce, and join the movement to hear when it drops.
          </Note>

          <div className="tabs" role="tablist" aria-label="Filter collections" style={{ marginTop: 'clamp(26px,3vw,40px)' }}>
            <button
              type="button"
              role="tab"
              aria-selected={filter === 'all'}
              className={cn('tab', filter === 'all' && 'is-on')}
              onClick={() => setFilter('all')}
            >
              All pieces
            </button>
            {COLLECTIONS.map((collection) => (
              <button
                key={collection.slug}
                type="button"
                role="tab"
                aria-selected={filter === collection.slug}
                className={cn('tab', filter === collection.slug && 'is-on')}
                onClick={() => setFilter(collection.slug)}
              >
                {collection.name}
              </button>
            ))}
          </div>

          <p className="micro" aria-live="polite">
            {items.length} {items.length === 1 ? 'piece' : 'pieces'}
          </p>

          <div className="g4" style={{ marginTop: 'clamp(22px,2.6vw,34px)' }}>
            {loading ? <SectionLoad label="Loading the collection" rows={5} /> : items.map((item) => (
              <ApparelCard key={item.id} item={item} />
            ))}
          </div>
        </Wrap>
      </Section>

      <Section surface="emerald">
        <Wrap narrow>
          <Eyebrow>What the movement is asking for</Eyebrow>
          <h2 className="h-lg rise d1">You decide what gets made</h2>
          <p className="body rise d2">
            Live totals across every collection. Your votes are counted the moment you cast them.
          </p>
          <VoteMeter />
        </Wrap>
      </Section>
    </>
  );
}
