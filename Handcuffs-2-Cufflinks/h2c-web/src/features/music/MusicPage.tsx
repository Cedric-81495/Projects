import { Seo } from '@/lib/seo/Seo';
import { PageHero } from '@/components/layout/PageHero';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { Section, Wrap, Band } from '@/components/ui/Section';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { AssetSlot } from '@/components/ui/AssetSlot';
import { ButtonAnchor, Row } from '@/components/ui/Button';
import { Note } from '@/components/ui/Note';
import { MUSIC as MUSIC_SEED } from '@/data/music';
import { ARTISTS as ARTISTS_SEED } from '@/data/artists';
import { ECOSYSTEM } from '@/config/site';
import { ROUTES } from '@/router/routes';
import { SectionLoad } from '@/components/ui/Spinner';
import { useContent } from '@/lib/api/useContent';
import { toArtist, toRelease } from '@/lib/content/adapters';
import type { ApiArtist, ApiRelease } from '@/lib/content/adapters';

/**
 * Music sits under Kitchen Muzik Management. The label is credited in the page
 * hero, on every release, and in the closing note — the ecosystem brands must
 * never blur into the parent.
 */
export function MusicPage() {
  const { items: MUSIC, loading: loadingMusic } = useContent<ApiRelease, (typeof MUSIC_SEED)[number]>(
    '/kmm/releases',
    toRelease,
    MUSIC_SEED
  );
  const { items: ARTISTS, loading: loadingArtists } = useContent<ApiArtist, (typeof ARTISTS_SEED)[number]>(
    '/kmm/artists',
    toArtist,
    ARTISTS_SEED
  );

  return (
    <>
      <Seo
        title="Music"
        description="Kitchen Muzik Management — the soundtrack of the movement. Singles, albums, mixtapes, and artist development."
        canonicalPath={ROUTES.music}
      />
      <Breadcrumb trail={[{ label: 'Home', to: ROUTES.home }, { label: 'Music' }]} />
      <PageHero
        eyebrow={`${ECOSYSTEM.kitchen.name} · the soundtrack of transformation`}
        surface="emerald-ink"
        title={
          <>
            Music that came
            <br />
            from the same place.
          </>
        }
        lede="Kitchen Muzik Management is the label inside the movement. The artists are not scoring somebody else's story."
      />

      <Section surface="emerald-ink" tight>
        <Wrap>
          <Eyebrow>Releases</Eyebrow>
          <h2 className="h-lg rise d1">Out now</h2>

          <div className="g3 rise d2" style={{ marginTop: 'clamp(26px,3vw,44px)' }}>
            {loadingMusic ? <SectionLoad label="Loading releases" /> : MUSIC.map((release, i) => (
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
                <Row>
                  <ButtonAnchor href="#" variant="ghost" size="sm" icon="spotify">
                    Listen
                  </ButtonAnchor>
                </Row>
              </article>
            ))}
          </div>
        </Wrap>
      </Section>

      <Section surface="emerald">
        <Wrap>
          <Eyebrow>The roster</Eyebrow>
          <h2 className="h-lg rise d1">Artists</h2>

          <div className="g3 rise d2" style={{ marginTop: 'clamp(26px,3vw,44px)' }}>
            {loadingArtists ? <SectionLoad label="Loading the roster" /> : ARTISTS.map((artist, i) => (
              <article key={artist.name}>
                <AssetSlot
                  ratio="4x5"
                  tone={i === 1 ? 'warm' : ''}
                  label="PHOTO"
                  spec={`KMM_${artist.name.replace(/[^A-Za-z0-9]/g, '')}_Portrait_4x5.jpg`}
                />
                <h3 className="h-sm" style={{ marginTop: '16px', marginBottom: '4px' }}>
                  {artist.name}
                </h3>
                <p className="micro">
                  {artist.city} · {artist.since}
                </p>
                <p className="body body--quiet" style={{ marginTop: '10px' }}>
                  {artist.note}
                </p>
              </article>
            ))}
          </div>
        </Wrap>
      </Section>

      <Band direction="to-black" />

      <Section surface="obsidian" tight>
        <Wrap narrow>
          <Note label={ECOSYSTEM.kitchen.attribution}>
            Kitchen Muzik Management operates within the Handcuffs 2 Cufflinks ecosystem as its own
            label, with its own roster and release schedule.
          </Note>
        </Wrap>
      </Section>
    </>
  );
}
