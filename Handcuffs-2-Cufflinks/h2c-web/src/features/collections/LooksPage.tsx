import { Seo } from '@/lib/seo/Seo';
import { PageHero } from '@/components/layout/PageHero';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { Section, Wrap } from '@/components/ui/Section';
import { AssetSlot } from '@/components/ui/AssetSlot';
import { LOOKS as LOOKS_SEED } from '@/data/looks';
import { ROUTES } from '@/router/routes';
import { SectionLoad } from '@/components/ui/Spinner';
import { useContent } from '@/lib/api/useContent';
import { toLook } from '@/lib/content/adapters';
import type { ApiLook } from '@/lib/content/adapters';

/**
 * All eight looks in sequence. The numbering is the narrative, so this page
 * reads top to bottom rather than as a grid.
 */
export function LooksPage() {
  const { items: LOOKS, loading } = useContent<ApiLook, (typeof LOOKS_SEED)[number]>(
    '/looks',
    toLook,
    LOOKS_SEED
  );

  return (
    <>
      <Seo
        title="The Eight Looks"
        description="Eight looks, one journey. The photoshoot read as a sequence from where it started to where it went."
        canonicalPath={ROUTES.looks}
      />
      <Breadcrumb
        trail={[
          { label: 'Home', to: ROUTES.home },
          { label: 'Collections', to: ROUTES.collections },
          { label: 'The Eight Looks' },
        ]}
      />
      <PageHero
        eyebrow="The photoshoot · eight looks, one arc"
        title={
          <>
            Eight looks.
            <br />
            One journey.
          </>
        }
        lede="Look 01 is where it started. Look 08 is where it went. Read it in order."
      />

      {loading ? <SectionLoad label="Loading the looks" rows={6} /> : LOOKS.map((look, i) => (
        <Section
          key={look.n}
          surface={i % 2 === 0 ? 'charcoal' : 'charcoal-hi'}
          tight={i > 0}
        >
          <Wrap>
            <div className={`split split--top${i % 2 === 1 ? ' split--rev' : ''}`}>
              <AssetSlot
                ratio="3x4"
                tone={i % 3 === 2 ? 'em' : i % 3 === 1 ? 'warm' : ''}
                label="PHOTO"
                spec={`H2C_Looks_Look${look.n}_Full_3x4.jpg`}
              />
              <div>
                <span className="num">{look.n}</span>
                <h2 className="h-md rise d1" style={{ marginTop: '10px' }}>
                  {look.title}
                </h2>
                <p className="body rise d2">{look.note}</p>

                <p className="h-xs rise d2" style={{ marginTop: '1.6em' }}>
                  In this look
                </p>
                <div className="look-pieces rise d3">
                  {look.pieces.map((piece) => (
                    <div className="piece" key={piece}>
                      <AssetSlot ratio="1x1" label="IMG" />
                      <b>{piece}</b>
                      <span>Showcase only</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Wrap>
        </Section>
      ))}
    </>
  );
}
