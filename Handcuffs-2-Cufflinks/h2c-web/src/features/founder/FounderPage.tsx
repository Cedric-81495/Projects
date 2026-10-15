import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api/client';
import { Seo } from '@/lib/seo/Seo';
import { PageHero } from '@/components/layout/PageHero';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { Section, Wrap, Band } from '@/components/ui/Section';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { AssetSlot } from '@/components/ui/AssetSlot';
import { ButtonLink, Row } from '@/components/ui/Button';
import { Rule } from '@/components/ui/Rule';
import { BRAND, ECOSYSTEM } from '@/config/site';
import { ROUTES } from '@/router/routes';

/** Not a corporate biography. First person, specific, and unflattering where it needs to be. */
/** The founder profile, as the CMS stores it. Every field is optional. */
export interface FounderProfile {
  name?: string;
  role?: string;
  portrait?: { url?: string; alt?: string };
  message?: string;
  story?: string;
  whyThisExists?: string;
  lessonsLearned?: string[];
  gwopConnection?: string;
  kitchenMuzikConnection?: string;
  globalVision?: string;
  speakingTopics?: string[];
  speakingBlurb?: string;
  press?: PressItem[];
}

/**
 * Reads the founder profile.
 *
 * A singleton rather than a list, so `useContent` (which maps an items array)
 * does not fit. Returns an empty object on failure: every field below falls
 * back to the written copy, so a cold start or a network blip shows the page
 * as it was rather than a set of gaps.
 */
function useFounder(): FounderProfile {
  const [profile, setProfile] = useState<FounderProfile>({});

  useEffect(() => {
    const abort = new AbortController();
    apiGet<FounderProfile>('/site/founder', undefined, abort.signal)
      .then((data) => setProfile(data ?? {}))
      .catch(() => {
        /* Written copy stands in. Nothing here is load-bearing enough to error on. */
      });
    return () => abort.abort();
  }, []);

  return profile;
}

/**
 * Splits a CMS text field into paragraphs on blank lines.
 *
 * Operators type into a textarea, not a rich editor, so a blank line is the
 * only paragraph break they have. Without this the whole story renders as one
 * unbroken block.
 */
function paragraphs(text: string): string[] {
  return text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}

export function FounderPage() {
  const founder = useFounder();
  return (
    <>
      <Seo
        title="About the Founder"
        description="Why the movement exists, told by the person who started it."
        canonicalPath={ROUTES.founder}
      />
      <Breadcrumb trail={[{ label: 'Home', to: ROUTES.home }, { label: 'About the Founder' }]} />
      <PageHero
        eyebrow="About the founder"
        title="Why this exists"
        lede={
          founder.whyThisExists ||
          'I did not build this because it worked out. I built it because for a long time it did not.'
        }
      />

      <Section surface="charcoal" tight>
        <Wrap>
          <div className="split split--top">
            <AssetSlot
              ratio="4x5"
              tone="warm"
              label="PHOTO"
              spec="H2C_Founder_Portrait_Standing_4x5.jpg"
              src={founder.portrait?.url || undefined}
              alt={founder.portrait?.alt}
            />
            <div>
              <Eyebrow>The journey</Eyebrow>
              <h2 className="h-md rise d1">Boston does not hand you anything</h2>
              {founder.story ? (
                paragraphs(founder.story).map((para) => (
                  <p key={para.slice(0, 40)} className="body rise d2">
                    {para}
                  </p>
                ))
              ) : (
                <>
                  <p className="body rise d2">
                    It also does not let you forget where you came from — and for a long time I
                    thought that was a curse. Then I understood it was the whole point. You cannot
                    show anybody the distance you covered if you pretend you started somewhere else.
                  </p>
                  <p className="body rise d2">
                    Handcuffs 2 Cufflinks began as two words I could not stop repeating. Then it
                    became a shirt. Then a podcast, a docuseries, a label, and a set of programmes.
                    What it has always been is an argument: that whatever held you can become the
                    reason you move.
                  </p>
                </>
              )}
              <p className="pull rise d3">
                You cannot show anybody the distance you covered if you pretend you started
                somewhere else.
              </p>
            </div>
          </div>

          <Rule label="What I learned" />

          <div className="g3 rise">
            {(founder.lessonsLearned?.length
              ? founder.lessonsLearned
              : [
                  'Nobody is coming\nWaiting to be discovered is the most expensive thing you can do with a year.',
                  'Tell it first\nWhoever tells your story first controls what it means. Make that you.',
                  'Bring somebody\nIf the door closes behind you, you did not actually open it.',
                ]
            ).map((lesson, index) => {
              /* A lesson is a heading and an explanation. The CMS gives one text
                 field per lesson, so the first line is the heading and the rest
                 is the body — the same shape the written copy already had. */
              const [heading, ...rest] = lesson.split('\n');
              return (
                <div key={heading}>
                  <span className="num">{String(index + 1).padStart(2, '0')}</span>
                  <h3 className="h-sm" style={{ marginTop: 10 }}>
                    {heading}
                  </h3>
                  {rest.length > 0 && <p className="body body--quiet">{rest.join(' ')}</p>}
                </div>
              );
            })}
          </div>
        </Wrap>
      </Section>

      <Section surface="charcoal-hi">
        <Wrap>
          <Eyebrow>The ecosystem</Eyebrow>
          <h2 className="h-lg rise d1">Why there are three names</h2>
          <div className="g2 rise d2" style={{ marginTop: 'clamp(24px,3vw,40px)' }}>
            <div>
              <h3 className="h-sm">{ECOSYSTEM.gwop.name}</h3>
              <p className="body">
                {founder.gwopConnection ||
                  'Inspiration on its own does not teach anybody how to open a bank account after a record. GWOP exists to do the part that motivation cannot.'}
              </p>
            </div>
            <div>
              <h3 className="h-sm">{ECOSYSTEM.kitchen.name}</h3>
              <p className="body">
                {founder.kitchenMuzikConnection ||
                  'The music came before the brand did. Rather than license somebody else’s soundtrack, we built the label so the artists in this movement own theirs.'}
              </p>
            </div>
          </div>

          <p className="micro rise d3" style={{ marginTop: 'clamp(26px,3vw,40px)' }}>
            {BRAND.creed} {BRAND.legacyLine}. {BRAND.location}. {BRAND.purposeLine}
          </p>
        </Wrap>
      </Section>

      <PressSection press={founder.press ?? []} />

      <Band direction="to-emerald" />

      <Section surface="emerald">
        <Wrap narrow>
          <h2 className="h-lg rise d1">Your story is still being written</h2>
          <Row className="rise d2">
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

/**
 * Where the movement has been written about.
 *
 * A citation list, not a reprint. Each entry is an outlet, a headline, a date
 * and a link out — the article belongs to whoever published it, and a reader
 * who wants it should land on their page, which is also the only way the
 * coverage keeps earning the outlet anything.
 *
 * The optional pulled line is capped at a sentence in the CMS for the same
 * reason: enough to show what the piece is about, not enough to replace it.
 *
 * Renders nothing when there is no coverage yet. An empty "As featured in"
 * heading reads worse than silence.
 */
interface PressItem {
  outlet: string;
  title: string;
  url: string;
  publishedAt?: string | null;
  quote?: string;
}

function PressSection({ press }: { press: PressItem[] }) {
  if (press.length === 0) return null;

  return (
    <Section surface="charcoal-hi">
      <Wrap>
        <Eyebrow>In the press</Eyebrow>
        <h2 className="h-lg rise d1">Where the movement has been written about</h2>
        <ul className="press-list rise d2">
          {press.map((item) => (
            <li key={item.url} className="press-item">
              <a href={item.url} target="_blank" rel="noopener noreferrer">
                <span className="press-outlet">{item.outlet}</span>
                <span className="press-title">{item.title}</span>
              </a>
              {item.quote && <p className="press-quote">{item.quote}</p>}
              {item.publishedAt && (
                <p className="micro">
                  {new Date(item.publishedAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                  })}
                </p>
              )}
            </li>
          ))}
        </ul>
      </Wrap>
    </Section>
  );
}
