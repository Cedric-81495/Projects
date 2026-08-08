import { Section, Wrap } from '@/components/ui/Section';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { AssetSlot } from '@/components/ui/AssetSlot';
import { ArrowLink } from '@/components/ui/Button';
import { MUSIC as MUSIC_SEED } from '@/data/music';
import { ECOSYSTEM } from '@/config/site';
import { ROUTES } from '@/router/routes';
import { SectionLoad } from '@/components/ui/Spinner';
import { useContent } from '@/lib/api/useContent';
import { toRelease } from '@/lib/content/adapters';
import type { ApiRelease } from '@/lib/content/adapters';

/**
 * Homepage section 8 — music spotlight.
 *
 * Attributed to Kitchen Muzik Management explicitly. The ecosystem brands must
 * read as distinct, so the label is named in the eyebrow and again in the tag
 * rather than being folded into the parent brand's voice.
 */
export function MusicSpotlight() {
  const { items: MUSIC, loading } = useContent<ApiRelease, (typeof MUSIC_SEED)[number]>(
    '/kmm/releases',
    toRelease,
    MUSIC_SEED,
    { params: { pageSize: 3 } }
  );

  return (
    <Section surface="emerald">
      <Wrap>
        <Eyebrow>{ECOSYSTEM.kitchen.name} · the soundtrack of transformation</Eyebrow>
        <h2 className="h-lg rise d1">
          Music that came
          <br />
          from the same place.
        </h2>
        <p className="body rise d2">
          {ECOSYSTEM.kitchen.name} is the label inside the movement. The artists are not scoring
          somebody else&rsquo;s story — they lived a version of it.
        </p>

        <div className="g3 rise d3" style={{ marginTop: 'clamp(28px,3.2vw,46px)' }}>
          {loading ? <SectionLoad label="Loading releases" /> : MUSIC.map((release, i) => (
            <article key={release.title}>
              <AssetSlot
                ratio="1x1"
                tone={i === 1 ? 'warm' : i === 2 ? 'em' : ''}
                label="COVER"
                spec={`KMM_${release.title.replace(/[^A-Za-z0-9]/g, '')}_Cover_1x1.jpg`}
              />
              <h3 className="h-sm" style={{ marginTop: '16px', marginBottom: '4px' }}>
                {release.title}
              </h3>
              <p className="micro">
                {release.artist} · {release.kind} · {release.year}
              </p>
              <p className="body body--quiet" style={{ marginTop: '10px' }}>
                {release.note}
              </p>
            </article>
          ))}
        </div>

        <div style={{ marginTop: 'clamp(28px,3.2vw,44px)' }}>
          <ArrowLink to={ROUTES.music}>{ECOSYSTEM.kitchen.attribution}</ArrowLink>
        </div>
      </Wrap>
    </Section>
  );
}
