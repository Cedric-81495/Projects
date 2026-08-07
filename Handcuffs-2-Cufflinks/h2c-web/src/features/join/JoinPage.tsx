import { Seo } from '@/lib/seo/Seo';
import { PageHero } from '@/components/layout/PageHero';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { Section, Wrap, Arc } from '@/components/ui/Section';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { JoinForm } from './JoinForm';
import { MOVEMENT_BENEFITS } from '@/config/site';
import { Icon } from '@/components/ui/Icon';
import { ROUTES } from '@/router/routes';

export function JoinPage() {
  return (
    <>
      <Seo
        title="Join the Movement"
        description="One list. New episodes, new music, new drops, and a vote on what gets made next."
        canonicalPath={ROUTES.join}
      />
      <Breadcrumb
        trail={[{ label: 'Home', to: ROUTES.home }, { label: 'Join the Movement' }]}
        surface="emerald-ink"
      />
      <PageHero
        eyebrow="Join the movement"
        surface="emerald-ink"
        title={
          <>
            Your story is still
            <br />
            being written.
          </>
        }
        lede="This is the list that gets everything first. It is also how you get a say in what the movement makes next."
      />

      <Section surface="emerald" tight>
        <Arc position="bl" />
        <Wrap>
          <div className="split split--top">
            <div>
              <Eyebrow>What you get</Eyebrow>
              <ul className="bens rise d1">
                {MOVEMENT_BENEFITS.map((benefit) => (
                  <li key={benefit}>
                    <Icon name="check" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
              <p className="body body--quiet rise d2" style={{ marginTop: 'clamp(22px,2.6vw,34px)' }}>
                No noise, no selling your details, and one click to leave whenever you want.
              </p>
            </div>

            <div className="rise d2">
              <JoinForm />
            </div>
          </div>
        </Wrap>
      </Section>
    </>
  );
}
