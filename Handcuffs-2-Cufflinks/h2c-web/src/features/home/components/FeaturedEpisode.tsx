import { Section, Wrap } from '@/components/ui/Section';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { VideoFrame } from '@/components/media/VideoFrame';
import { ApparelCard } from '@/features/collections/components/ApparelCard';
import { ArrowLink } from '@/components/ui/Button';
import { APPAREL as APPAREL_SEED } from '@/data/apparel';
import { ROUTES } from '@/router/routes';
import { SectionLoad } from '@/components/ui/Spinner';
import { useContent, useFeatured } from '@/lib/api/useContent';
import { toApparel, toEpisode } from '@/lib/content/adapters';
import type { ApiApparelItem, ApiDocuseriesEpisode, EpisodeView } from '@/lib/content/adapters';

/**
 * Homepage section 6 — featured docuseries episode.
 *
 * Structure follows the episode template from the guide: teaser, guest, the
 * defining struggle, the transformation, three lessons, then the related
 * apparel. The video plays in place rather than sending anyone to YouTube.
 */

/**
 * The episode this section shipped with. Shown when the API cannot answer, so a
 * cold start still presents a transformation story rather than an empty frame.
 */
const SEED_EPISODE: EpisodeView & {
  guestLine: string;
  struggle: string;
  lessons: string[];
} = {
  n: '04',
  title: 'The room you leave behind',
  guest: 'Marcus B. · Dorchester',
  len: '24 min',
  line: 'Marcus Bell, 34, Dorchester. Line cook at nineteen, incarcerated at twenty-two, licensed electrician at thirty-one, now runs a four-person crew and takes on two apprentices a year from the same neighbourhood.',
  asset: 'H2C_Docu_Ep04_Poster_16x9.jpg',
  slug: '',
  youtubeVideoId: '',
  poster: '',
  guestLine: 'Marcus B. · Dorchester',
  struggle:
    'Eight years of being told that a record was the last line of his résumé — and eventually believing it himself.',
  lessons: [
    'Get the licence. Nobody can argue with a licence.',
    'Tell them before they find out. It changes who is in control of the story.',
    'Hire the version of you that nobody else would hire.',
  ],
};

export function FeaturedEpisode() {
  const { item: episode } = useFeatured<
    ApiDocuseriesEpisode,
    EpisodeView & { struggle?: string; lessons?: string[] }
  >(
    '/docuseries/episodes',
    (item) => ({
      ...toEpisode(item),
      struggle: item.definingStruggle,
      lessons: (item.keyLessons ?? [])
        .map((lesson) => lesson.detail || lesson.heading || '')
        .filter(Boolean),
    }),
    SEED_EPISODE,
    { featured: 'true' }
  );

  /**
   * "Worn in this episode" needs pieces tied to the episode, which the content
   * model does not express yet. Until it does, the featured apparel stands in —
   * a considered selection rather than an empty row.
   */
  const { items: related, loading: loadingApparel } = useContent<
    ApiApparelItem,
    (typeof APPAREL_SEED)[number]
  >('/apparel', toApparel, APPAREL_SEED.filter((a) => ['a4', 'a3'].includes(a.id)), {
    params: { featured: 'true', pageSize: 2 },
  });

  return (
    <Section surface="emerald-ink">
      <Wrap>
        <Eyebrow>The docuseries · featured episode</Eyebrow>
        <h2 className="h-lg rise d1">See the transformation</h2>

        <div className="split split--top rise d2">
          <div>
            <VideoFrame
              title={`Episode ${episode.n} — ${episode.title}`}
              ratio="16x9"
              tone="em"
              spec={episode.asset}
              posterSrc={episode.poster || undefined}
              youtubeVideoId={episode.youtubeVideoId || undefined}
              playLabel={`Watch episode ${episode.n}`}
            />
            <div className="epmeta" style={{ marginTop: '18px' }}>
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
          </div>

          <div>
            <h3 className="h-md">{episode.title}</h3>
            <p className="body">{episode.line}</p>

            <p className="h-xs" style={{ marginTop: '1.4em' }}>
              The handcuffs
            </p>
            <p className="body body--quiet">{episode.struggle || SEED_EPISODE.struggle}</p>

            <p className="h-xs" style={{ marginTop: '1.4em' }}>
              What he would tell you
            </p>
            <ol className="lessons">
              {(episode.lessons?.length ? episode.lessons : SEED_EPISODE.lessons).map((lesson) => (
                <li key={lesson}>{lesson}</li>
              ))}
            </ol>

            <div style={{ marginTop: 'clamp(24px,2.8vw,36px)' }}>
              <ArrowLink to={ROUTES.docuseries}>All episodes</ArrowLink>
            </div>
          </div>
        </div>

        <p className="h-xs rise" style={{ marginTop: 'clamp(38px,4.4vw,64px)' }}>
          Worn in this episode
        </p>
        <div className="g4 rise">
          {loadingApparel ? (
            <SectionLoad label="Loading apparel" rows={3} />
          ) : (
            related.map((item) => (
              <ApparelCard key={item.id} item={item} compact />
            ))
          )}
        </div>
      </Wrap>
    </Section>
  );
}
