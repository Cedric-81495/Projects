import { Section, Wrap } from '@/components/ui/Section';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { VideoFrame } from '@/components/media/VideoFrame';
import { ApparelCard } from '@/features/collections/components/ApparelCard';
import { ArrowLink } from '@/components/ui/Button';
import { APPAREL } from '@/data/apparel';
import { ROUTES } from '@/router/routes';

/**
 * Homepage section 6 — featured docuseries episode.
 *
 * Structure follows the episode template from the guide: teaser, guest, the
 * defining struggle, the transformation, three lessons, then the related
 * apparel. The video plays in place rather than sending anyone to YouTube.
 */
export function FeaturedEpisode() {
  const related = APPAREL.filter((a) => ['a4', 'a3'].includes(a.id));

  return (
    <Section surface="emerald-ink">
      <Wrap>
        <Eyebrow>The docuseries · featured episode</Eyebrow>
        <h2 className="h-lg rise d1">See the transformation</h2>

        <div className="split split--top rise d2">
          <div>
            <VideoFrame
              title="Episode 04 — The room you leave behind"
              ratio="16x9"
              tone="em"
              spec="H2C_Docu_Ep04_Poster_16x9.jpg"
              playLabel="Watch episode 04"
            />
            <div className="epmeta" style={{ marginTop: '18px' }}>
              <span>Episode 04</span>
              <i />
              <span>24 min</span>
              <i />
              <span>Marcus B. · Dorchester</span>
            </div>
          </div>

          <div>
            <h3 className="h-md">The room you leave behind</h3>
            <p className="body">
              Marcus Bell, 34, Dorchester. Line cook at nineteen, incarcerated at twenty-two,
              licensed electrician at thirty-one, now runs a four-person crew and takes on two
              apprentices a year from the same neighbourhood.
            </p>

            <p className="h-xs" style={{ marginTop: '1.4em' }}>
              The handcuffs
            </p>
            <p className="body body--quiet">
              Eight years of being told that a record was the last line of his résumé — and
              eventually believing it himself.
            </p>

            <p className="h-xs" style={{ marginTop: '1.4em' }}>
              What he would tell you
            </p>
            <ol className="lessons">
              <li>Get the licence. Nobody can argue with a licence.</li>
              <li>Tell them before they find out. It changes who is in control of the story.</li>
              <li>Hire the version of you that nobody else would hire.</li>
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
          {related.map((item) => (
            <ApparelCard key={item.id} item={item} compact />
          ))}
        </div>
      </Wrap>
    </Section>
  );
}
