import { Seo } from '@/lib/seo/Seo';
import { PageHero } from '@/components/layout/PageHero';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { Section, Wrap } from '@/components/ui/Section';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { VideoFrame } from '@/components/media/VideoFrame';
import { AssetSlot } from '@/components/ui/AssetSlot';
import { ButtonAnchor, Row } from '@/components/ui/Button';
import { Carousel } from '@/components/ui/Carousel';
import { GuestNominationForm } from './GuestNominationForm';
import { CLIPS } from '@/data/podcast';
import { ROUTES } from '@/router/routes';

export function PodcastPage() {
  return (
    <>
      <Seo
        title="Podcast"
        description="Long conversations with people who made it out. New episode every week."
        canonicalPath={ROUTES.podcast}
      />
      <Breadcrumb trail={[{ label: 'Home', to: ROUTES.home }, { label: 'Podcast' }]} />
      <PageHero
        eyebrow="The Handcuffs 2 Cufflinks Podcast"
        title={
          <>
            Long conversations
            <br />
            with people who made it out.
          </>
        }
        lede="An hour at a time, no editing around the difficult parts. New episode every week."
      />

      <Section surface="charcoal" tight>
        <Wrap>
          <Eyebrow>Featured episode</Eyebrow>
          <div className="split split--top rise d1">
            <VideoFrame
              title="Episode 31 — The first ninety days"
              ratio="16x9"
              tone="warm"
              spec="H2C_Pod_Ep31_Poster_16x9.jpg"
              playLabel="Play episode 31"
            />
            <div>
              <div className="epmeta">
                <span>Episode 31</span>
                <i />
                <span>68 min</span>
              </div>
              <h2 className="h-md" style={{ marginTop: '14px' }}>
                The first ninety days
              </h2>
              <p className="body">
                A reentry counsellor, a former client, and the founder on what actually works in the
                first ninety days after release.
              </p>

              <p className="h-xs" style={{ marginTop: '1.4em' }}>
                Key takeaways
              </p>
              <ol className="lessons">
                <li>Housing before hustle. Nothing holds without an address.</li>
                <li>One consistent adult changes the odds more than any programme.</li>
                <li>The paperwork is the barrier. Someone has to sit with you and do it.</li>
              </ol>

              <p className="h-xs" style={{ marginTop: '1.6em' }}>
                Listen anywhere
              </p>
              <Row>
                <ButtonAnchor href="#" variant="ghost" size="sm" icon="spotify">
                  Spotify
                </ButtonAnchor>
                <ButtonAnchor href="#" variant="ghost" size="sm">
                  Apple Podcasts
                </ButtonAnchor>
                <ButtonAnchor href="#" variant="ghost" size="sm" icon="youtube">
                  YouTube
                </ButtonAnchor>
              </Row>
            </div>
          </div>
        </Wrap>
      </Section>

      <Section surface="charcoal-hi">
        <Wrap>
          <Eyebrow>Clips</Eyebrow>
          <h2 className="h-lg rise d1">The lines people repeat</h2>
          <Carousel className="carousel--spaced rise d2" label="Podcast clips">
            {CLIPS.map((clip) => (
              <figure className="clip" key={clip.q}>
                <AssetSlot ratio="1x1" label="CLIP" spec="9:16 vertical cut" />
                <figcaption>
                  <p>{clip.q}</p>
                  <span>{clip.who}</span>
                </figcaption>
              </figure>
            ))}
          </Carousel>
        </Wrap>
      </Section>

      <Section surface="emerald">
        <Wrap narrow>
          <Eyebrow>Guest nomination</Eyebrow>
          <h2 className="h-lg rise d1">Somebody you know should be on this</h2>
          <p className="body rise d2">
            We find most guests through the movement. If you know someone whose distance deserves an
            hour, tell us about them.
          </p>
          <div className="rise d3">
            <GuestNominationForm />
          </div>
        </Wrap>
      </Section>
    </>
  );
}
