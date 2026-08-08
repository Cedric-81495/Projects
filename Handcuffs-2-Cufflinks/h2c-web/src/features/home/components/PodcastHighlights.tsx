import { Section, Wrap } from '@/components/ui/Section';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { VideoFrame } from '@/components/media/VideoFrame';
import { AssetSlot } from '@/components/ui/AssetSlot';
import { ArrowLink } from '@/components/ui/Button';
import { Carousel } from '@/components/ui/Carousel';
import { CLIPS as CLIPS_SEED } from '@/data/podcast';
import { ROUTES } from '@/router/routes';
import { SectionLoad } from '@/components/ui/Spinner';
import { useContent, useFeatured } from '@/lib/api/useContent';
import { toClip, toPodcastEpisode } from '@/lib/content/adapters';
import type { ApiPodcastClip, ApiPodcastEpisode, PodcastEpisodeView } from '@/lib/content/adapters';

/** Mirrors the copy this section shipped with, used when the API cannot answer. */
const SEED_EPISODE: PodcastEpisodeView = {
  n: '31',
  title: 'The first ninety days',
  guest: '',
  len: '68 min',
  line: 'A reentry counsellor, a former client, and the founder sit down for an hour on what actually works in the first ninety days after release — and how much of it comes down to one person picking up the phone.',
  slug: '',
  youtubeVideoId: '',
  poster: '',
  takeaways: [],
};

/**
 * Homepage section 7 — podcast highlights.
 *
 * Vertical clips sit in a horizontal rail: they are cut for phones, so the
 * 9:16 shape is honest about where they came from and where they get shared.
 */
export function PodcastHighlights() {
  /**
   * The seed episode below is the fallback, so the section still reads as the
   * podcast during a cold start rather than as an empty frame with a heading.
   */
  const { item: episode } = useFeatured<ApiPodcastEpisode, PodcastEpisodeView>(
    '/podcast/episodes',
    toPodcastEpisode,
    SEED_EPISODE,
    { featured: 'true' }
  );

  // Clips are placed by the CMS, so the homepage asks only for the ones marked
  // for it rather than showing whatever happens to be newest.
  const { items: CLIPS, loading: loadingClips } = useContent<ApiPodcastClip, (typeof CLIPS_SEED)[number]>(
    '/podcast/clips',
    toClip,
    CLIPS_SEED,
    { params: { pageSize: 12 } }
  );

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
            <h3 className="h-md" style={{ marginTop: '14px' }}>
              {episode.title}
            </h3>
            <p className="body">{episode.line}</p>
            <ArrowLink to={ROUTES.podcast}>All episodes and platforms</ArrowLink>
          </div>
        </div>

        <Carousel
          className="carousel--spaced rise"
          label="Podcast clips"
          heading={<p className="h-xs">Clips</p>}
        >
          {loadingClips ? (
            <SectionLoad label="Loading clips" rows={5} />
          ) : (
            CLIPS.map((clip) => (
              <figure className="clip" key={clip.q}>
                <AssetSlot ratio="1x1" tone="" label="CLIP" spec="9:16 vertical cut" />
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
  );
}
