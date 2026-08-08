import { Section, Wrap } from '@/components/ui/Section';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { VideoFrame } from '@/components/media/VideoFrame';
import { AssetSlot } from '@/components/ui/AssetSlot';
import { ArrowLink } from '@/components/ui/Button';
import { Carousel } from '@/components/ui/Carousel';
import { CLIPS } from '@/data/podcast';
import { ROUTES } from '@/router/routes';

/**
 * Homepage section 7 — podcast highlights.
 *
 * Vertical clips sit in a horizontal rail: they are cut for phones, so the
 * 9:16 shape is honest about where they came from and where they get shared.
 */
export function PodcastHighlights() {
  return (
    <Section surface="emerald-ink" tight>
      <Wrap>
        <Eyebrow>The Handcuffs 2 Cufflinks Podcast · new episode every week</Eyebrow>
        <h2 className="h-lg rise d1">
          Long conversations
          <br />
          with people who made it out.
        </h2>

        <div className="split split--top rise d2">
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
            <h3 className="h-md" style={{ marginTop: '14px' }}>
              The first ninety days
            </h3>
            <p className="body">
              A reentry counsellor, a former client, and the founder sit down for an hour on what
              actually works in the first ninety days after release — and how much of it comes down
              to one person picking up the phone.
            </p>
            <ArrowLink to={ROUTES.podcast}>All episodes and platforms</ArrowLink>
          </div>
        </div>

        <Carousel
          className="carousel--spaced rise"
          label="Podcast clips"
          heading={<p className="h-xs">Clips</p>}
        >
          {CLIPS.map((clip) => (
            <figure className="clip" key={clip.q}>
              <AssetSlot ratio="1x1" tone="" label="CLIP" spec="9:16 vertical cut" />
              <figcaption>
                <p>{clip.q}</p>
                <span>{clip.who}</span>
              </figcaption>
            </figure>
          ))}
        </Carousel>
      </Wrap>
    </Section>
  );
}
