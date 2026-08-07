import { Section, Wrap } from '@/components/ui/Section';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { AssetSlot } from '@/components/ui/AssetSlot';
import { ArrowLink } from '@/components/ui/Button';
import { BRAND } from '@/config/site';
import { ROUTES } from '@/router/routes';

/** Homepage section 11 — founder message. */
export function FounderMessage() {
  return (
    <Section surface="light-2">
      <Wrap>
        <div className="split split--rev split--top">
          <div>
            <Eyebrow>A message from the founder</Eyebrow>
            <h2 className="h-lg rise d1">Why this exists</h2>
            <p className="body rise d2">
              Boston does not hand you anything. It also does not let you forget where you came from
              — and for a long time I thought that was a curse. Then I understood it was the whole
              point. You cannot show anybody the distance you covered if you pretend you started
              somewhere else.
            </p>
            <p className="body rise d2">
              Handcuffs 2 Cufflinks began as two words I could not stop repeating. Then it became a
              shirt. Then a podcast, a docuseries, a label, and a set of programmes. What it has
              always been is an argument: that whatever held you can become the reason you move.
            </p>
            <p className="pull rise d3">Everybody has a Handcuffs 2 Cufflinks story.</p>
            <p className="micro rise d3">
              {BRAND.creed} {BRAND.legacyLine}. {BRAND.location}.
            </p>
            <div style={{ marginTop: 'clamp(22px,2.6vw,34px)' }}>
              <ArrowLink to={ROUTES.founder}>About the founder</ArrowLink>
            </div>
          </div>

          <div className="rise d2">
            <AssetSlot
              ratio="4x5"
              label="PHOTO"
              spec="H2C_Founder_Portrait_Seated_4x5.jpg"
            />
          </div>
        </div>
      </Wrap>
    </Section>
  );
}
