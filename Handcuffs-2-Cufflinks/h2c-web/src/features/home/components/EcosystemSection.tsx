import { Section, Wrap } from '@/components/ui/Section';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { ArrowLink } from '@/components/ui/Button';
import { ECOSYSTEM } from '@/config/site';
import { ROUTES } from '@/router/routes';

/**
 * Homepage section 9 — how the three brands connect.
 *
 * The guide requires a visitor to understand this relationship within seconds,
 * so it is three columns of equal weight with one line each on what that brand
 * actually does. Each card ends with its own attribution label, which is how
 * the brands stay distinct while sharing a page.
 */
export function EcosystemSection() {
  const cards = [
    {
      ...ECOSYSTEM.h2c,
      crest: null,
      does: ['Storytelling and media', 'Apparel and collections', 'Community and events'],
    },
    {
      ...ECOSYSTEM.gwop,
      crest: '/media/crest-gwop-university.webp',
      does: ['Courses and workshops', 'Mentorship pairings', 'Youth and reentry programmes'],
    },
    {
      ...ECOSYSTEM.kitchen,
      crest: '/media/crest-kmm.webp',
      does: ['Artist development', 'Singles, albums, mixtapes', 'Scoring for the docuseries'],
    },
  ];

  return (
    <Section surface="emerald-ink">
      <Wrap>
        <Eyebrow>One ecosystem · three brands</Eyebrow>
        <h2 className="h-lg rise d1">How it all connects</h2>
        <p className="lede rise d2">
          Handcuffs 2 Cufflinks is the movement. GWOP teaches. Kitchen Muzik Management records.
          Same mission, three different jobs.
        </p>

        <div className="eco rise d3">
          {cards.map((card) => (
            <article className="eco-card" key={card.key}>
              {card.crest && (
                <img
                  className="eco-crest"
                  src={card.crest}
                  alt={`${card.name} crest`}
                  loading="lazy"
                />
              )}
              <p className="eco-role">{card.role}</p>
              <h3>{card.name}</h3>
              <p>{card.description}</p>
              <ul>
                {card.does.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <p className="eco-tag">{card.attribution}</p>
            </article>
          ))}
        </div>

        <div style={{ marginTop: 'clamp(26px,3vw,42px)' }}>
          <ArrowLink to={ROUTES.gwop}>How GWOP works</ArrowLink>
        </div>
      </Wrap>
    </Section>
  );
}
