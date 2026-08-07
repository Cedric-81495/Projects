import { Section, Wrap, Arc } from '@/components/ui/Section';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { ArrowLink } from '@/components/ui/Button';
import { ROUTES } from '@/router/routes';

/**
 * Homepage section 4 — the meaning behind the name.
 *
 * The two columns are the whole brand thesis: the left is set in chrome, the
 * right in gold. That is the only place the two metal treatments appear beside
 * each other, which is what makes the pairing carry weight.
 */
export function MeaningSection() {
  return (
    <Section surface="charcoal-hi">
      <Arc position="bl" />
      <Wrap>
        <Eyebrow>The meaning behind the name</Eyebrow>
        <h2 className="h-lg rise d1">
          Two words. One&nbsp;distance.
        </h2>
        <p className="lede rise d2">
          You did not have to go to prison to go from handcuffs to cufflinks. Handcuffs are whatever
          held you. Cufflinks are what you build next.
        </p>

        <div className="g2 rise d3" style={{ marginTop: 'clamp(30px,3.6vw,54px)' }}>
          <div>
            <h3 className="h-md chrome-t">Handcuffs</h3>
            <p className="body">
              Poverty. Addiction. Rejection. Fear. Homelessness. Violence. No opportunity. A
              decision you cannot take back. An environment that wanted you to stay put. Sometimes
              just your own doubt.
            </p>
          </div>
          <div>
            <h3 className="h-md gold">Cufflinks</h3>
            <p className="body">
              Freedom. Purpose. Growth. Ownership. Discipline. Leadership. Success. A version of you
              that the old room would not recognise.
            </p>
          </div>
        </div>

        <p className="pull rise d4" style={{ marginTop: 'clamp(30px,3.6vw,50px)' }}>
          What once held you back can become what pushes you forward.
        </p>

        <ArrowLink to={ROUTES.movement}>Read the whole story</ArrowLink>
      </Wrap>
    </Section>
  );
}
