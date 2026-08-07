import { Section, Wrap } from '@/components/ui/Section';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { VideoFrame } from '@/components/media/VideoFrame';
import { ButtonLink, Row } from '@/components/ui/Button';
import { ROUTES } from '@/router/routes';

/** Homepage section 2 — the cinematic trailer. */
export function MovementTrailer() {
  return (
    <Section surface="obsidian2">
      <Wrap>
        <Eyebrow>The movement trailer · 90 seconds</Eyebrow>
        <h2 className="h-lg rise d1">
          Before the suit,
          <br />
          there was the sentence.
        </h2>

        <div className="split split--top rise d2" style={{ marginTop: '1.4em' }}>
          <VideoFrame
            title="The Handcuffs 2 Cufflinks movement trailer"
            ratio="16x9"
            tone="warm"
            spec="H2C_Trailer_Movement_90sec_16x9.mp4 — poster H2C_Trailer_Poster_16x9.jpg"
            playLabel="Play the trailer"
          />
          <div>
            <p className="body">
              The photoshoot, the docuseries, the studio, the mentorship rooms, the family. Cut
              together the way it actually happened.
            </p>
            <p className="body body--quiet">
              Original scoring from Kitchen Muzik Management. The soundtrack is not licensed filler
              — it is part of the story.
            </p>
            <Row>
              <ButtonLink to={ROUTES.movement} variant="ghost" size="sm" icon="arrow">
                Read the full story
              </ButtonLink>
            </Row>
          </div>
        </div>
      </Wrap>
    </Section>
  );
}
