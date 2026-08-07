import { Section, Wrap } from '@/components/ui/Section';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { ApparelCard } from '@/features/collections/components/ApparelCard';
import { ArrowLink } from '@/components/ui/Button';
import { APPAREL } from '@/data/apparel';
import { ROUTES } from '@/router/routes';

/**
 * Homepage section 3 — featured apparel.
 *
 * Four pieces, not a catalogue page. The note under the heading states plainly
 * that nothing is for sale: setting that expectation up front is what lets the
 * engagement controls read as participation rather than a broken checkout.
 */
export function FeaturedApparel() {
  const featured = APPAREL.slice(0, 4);

  return (
    <Section surface="charcoal">
      <Wrap>
        <Eyebrow>Featured apparel</Eyebrow>
        <h2 className="h-lg rise d1" style={{ marginBottom: '.2em' }}>
          Wear the transformation
        </h2>
        <p className="body rise d2">
          Nothing here is on sale yet. Every piece carries a story, and the pieces you like, save
          and vote for are the ones we make first.
        </p>

        <div className="g4 rise d3" style={{ marginTop: 'clamp(30px,3.4vw,52px)' }}>
          {featured.map((item) => (
            <ApparelCard key={item.id} item={item} compact />
          ))}
        </div>

        <div style={{ marginTop: 'clamp(30px,3.4vw,48px)' }}>
          <ArrowLink to={ROUTES.collections}>See all collections</ArrowLink>
        </div>
      </Wrap>
    </Section>
  );
}
