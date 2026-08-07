import { Seo } from '@/lib/seo/Seo';
import { PageHero } from '@/components/layout/PageHero';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { Section, Wrap, Band } from '@/components/ui/Section';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { AssetSlot } from '@/components/ui/AssetSlot';
import { ButtonLink, Row } from '@/components/ui/Button';
import { Rule } from '@/components/ui/Rule';
import { SYMBOLISM, BRAND } from '@/config/site';
import { ROUTES } from '@/router/routes';

export function MovementPage() {
  return (
    <>
      <Seo
        title="The Movement"
        description="What Handcuffs 2 Cufflinks means, why it exists, and how to become part of it."
        canonicalPath={ROUTES.movement}
      />
      <Breadcrumb trail={[{ label: 'Home', to: ROUTES.home }, { label: 'The Movement' }]} />
      <PageHero
        eyebrow="The movement"
        title={
          <>
            From struggle
            <br />
            to success.
          </>
        }
        lede="Handcuffs 2 Cufflinks is not a clothing brand with a story attached. It is a movement that happens to make clothes."
      />

      <Section surface="charcoal" tight>
        <Wrap narrow>
          <Eyebrow>The mission</Eyebrow>
          <h2 className="h-lg rise d1">Why this exists</h2>
          <p className="body rise d2">
            Every person in this movement has a before and an after, and a distance between the two
            that nobody handed them. The work is to make that distance visible — in stories, on
            film, in music, and on clothing people actually wear.
          </p>
          <p className="body rise d2">
            The apparel is not the product. The movement is. The apparel is how the message walks
            around a city.
          </p>

          <Rule label="The vision" />

          <p className="lede rise">
            A global movement where nobody is defined by the room they started in.
          </p>
          <p className="body rise">
            Recognised across generations, respected as a lifestyle brand, and trusted as a place
            where transformation is documented honestly rather than sold as a slogan.
          </p>
        </Wrap>
      </Section>

      <Section surface="charcoal-hi">
        <Wrap>
          <Eyebrow>The two words</Eyebrow>
          <h2 className="h-lg rise d1">What each one means</h2>

          <div className="g2 rise d2" style={{ marginTop: 'clamp(26px,3vw,44px)' }}>
            <div>
              <h3 className="h-md chrome-t" style={{ marginTop: '10px' }}>
                {SYMBOLISM.handcuffs.term}
              </h3>
              <p className="body">{SYMBOLISM.handcuffs.meaning}</p>
              <ul className="term-list">
                {SYMBOLISM.handcuffs.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="h-md gold" style={{ marginTop: '10px' }}>
                {SYMBOLISM.cufflinks.term}
              </h3>
              <p className="body">{SYMBOLISM.cufflinks.meaning}</p>
              <ul className="term-list">
                {SYMBOLISM.cufflinks.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="split rise d3" style={{ marginTop: 'clamp(34px,4vw,58px)' }}>
            <AssetSlot ratio="4x3" tone="warm" label="PHOTO" spec="H2C_Movement_Founder_Boston_4x3.jpg" />
            <div>
              <p className="pull">Your past is part of your story — not the end of it.</p>
              <p className="micro">
                {BRAND.creed} {BRAND.legacyLine}. {BRAND.location}.
              </p>
            </div>
          </div>
        </Wrap>
      </Section>

      <Band direction="to-emerald" />

      <Section surface="emerald">
        <Wrap narrow>
          <Eyebrow>The invitation</Eyebrow>
          <h2 className="h-lg rise d1">There is room for your story</h2>
          <p className="body rise d2">
            Joining costs nothing. It means you hear about new episodes and releases first, and you
            get a vote on which apparel gets made.
          </p>
          <Row className="rise d3">
            <ButtonLink to={ROUTES.join} variant="gold" icon="arrow">
              Join the Movement
            </ButtonLink>
            <ButtonLink to={ROUTES.submitStory} variant="ghost">
              Share your story
            </ButtonLink>
          </Row>
        </Wrap>
      </Section>
    </>
  );
}
