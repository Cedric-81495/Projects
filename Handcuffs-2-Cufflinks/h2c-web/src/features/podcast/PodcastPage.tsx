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
import { CLIPS as CLIPS_SEED } from '@/data/podcast';
import { ROUTES } from '@/router/routes';
import { SectionLoad } from '@/components/ui/Spinner';
import { useContent, useFeatured } from '@/lib/api/useContent';
import { toClip, toPodcastEpisode } from '@/lib/content/adapters';
import type { ApiPodcastClip, ApiPodcastEpisode, PodcastEpisodeView } from '@/lib/content/adapters';


/** The copy this page shipped with, used when the API cannot answer. */
const SEED_EPISODE: PodcastEpisodeView = {
  n: '31',
  title: 'The first ninety days',
  guest: '',
  len: '68 min',
  line: 'A reentry counsellor, a former client, and the founder on what actually works in the first ninety days after release.',
  slug: '',
  youtubeVideoId: '',
  poster: '',
  takeaways: [
    'Housing before hustle. Nothing holds without an address.',
    'One consistent adult changes the odds more than any programme.',
    'The paperwork is the barrier. Someone has to sit with you and do it.',
  ],
};

export function PodcastPage() {
  const { item: episode } = useFeatured<ApiPodcastEpisode, PodcastEpisodeView>(
    '/podcast/episodes',
    toPodcastEpisode,
    SEED_EPISODE,
    { featured: 'true' }
  );

  const { items: CLIPS, loading: loadingClips } = useContent<ApiPodcastClip, (typeof CLIPS_SEED)[number]>(
    '/podcast/clips',
    toClip,
    CLIPS_SEED,
    { params: { pageSize: 24 } }
  );

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
              title={`Episode ${episode.n} — ${episode.title}`}
              ratio="16x9"
              tone="warm"
              spec={`H2C_Pod_Ep${episode.n}_Poster_16x9.jpg`}
              posterSrc={episode.poster || undefined}
              youtubeVideoId={episode.youtubeVideoId || undefined}
              playLabel={`Play episode ${episode.n}`}
            />
            <div>
              <div className="epmeta">
                <span>Episode {episode.n}</span>
                {episode.len && (
                  <>
                    <i />
                    <span>{episode.len}</span>
                  </>
                )}
                {episode.guest && (
                  <>
                    <i />
                    <span>{episode.guest}</span>
                  </>
                )}
              </div>
              <h2 className="h-md" style={{ marginTop: '14px' }}>
                {episode.title}
              </h2>
              <p className="body">{episode.line}</p>

              <p className="h-xs" style={{ marginTop: '1.4em' }}>
                Key takeaways
              </p>
              <ol className="lessons">
                {episode.takeaways.map((takeaway) => (
                  <li key={takeaway}>{takeaway}</li>
                ))}
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
            {loadingClips ? (
              <SectionLoad label="Loading clips" rows={5} />
            ) : (
              CLIPS.map((clip) => (
              <figure className="clip" key={clip.q}>
                <AssetSlot ratio="1x1" label="CLIP" spec="9:16 vertical cut" />
                <figcaption>
                  <p>{clip.q}</p>
                  <span>{clip.who}</span>
                </figcaption>
                </figure>
              ))
            )}
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
