import { Seo } from '@/lib/seo/Seo';
import { PageHero } from '@/components/layout/PageHero';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { Section, Wrap } from '@/components/ui/Section';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { VideoFrame } from '@/components/media/VideoFrame';
import { AssetSlot } from '@/components/ui/AssetSlot';
import { ArrowLink } from '@/components/ui/Button';
import { EPISODES } from '@/data/docuseries';
import { ROUTES } from '@/router/routes';
import { videoGraph } from '@/lib/seo/jsonLd';

export function DocuseriesPage() {
  const [featured, ...rest] = EPISODES;

  return (
    <>
      <Seo
        title="Docuseries"
        description="Transformation stories on film. Real people, real distance covered, told in their own words."
        canonicalPath={ROUTES.docuseries}
        jsonLd={EPISODES.map((episode) =>
          videoGraph({
            name: `Episode ${episode.n} — ${episode.title}`,
            description: episode.line,
            durationMinutes: Number.parseInt(episode.len, 10) || undefined,
          })
        )}
      />
      <Breadcrumb trail={[{ label: 'Home', to: ROUTES.home }, { label: 'Docuseries' }]} />
      <PageHero
        eyebrow="The docuseries"
        title="See the transformation"
        lede="Season one. Six people, six distances covered. Every episode plays here — you do not have to leave the site to watch."
      />

      <Section surface="emerald-ink" tight>
        <Wrap>
          <Eyebrow>Featured episode</Eyebrow>
          <div className="split split--top rise d1">
            <VideoFrame
              title={`Episode ${featured.n} — ${featured.title}`}
              ratio="16x9"
              tone="em"
              spec={featured.asset}
              playLabel={`Watch episode ${featured.n}`}
            />
            <div>
              <div className="epmeta">
                <span>Episode {featured.n}</span>
                <i />
                <span>{featured.len}</span>
                <i />
                <span>{featured.guest}</span>
              </div>
              <h2 className="h-md" style={{ marginTop: '14px' }}>
                {featured.title}
              </h2>
              <p className="body">{featured.line}</p>
            </div>
          </div>
        </Wrap>
      </Section>

      <Section surface="charcoal">
        <Wrap>
          <Eyebrow>Season one · all episodes</Eyebrow>
          <h2 className="h-lg rise d1">Every story in the season</h2>

          <div className="g3 rise d2" style={{ marginTop: 'clamp(28px,3.2vw,46px)' }}>
            {rest.map((episode, i) => (
              <article className="epcard" key={episode.n}>
                <AssetSlot
                  ratio="16x9"
                  tone={i % 3 === 1 ? 'warm' : i % 3 === 2 ? 'em' : ''}
                  label="POSTER"
                  spec={episode.asset}
                />
                <div className="epmeta">
                  <span>Ep {episode.n}</span>
                  <i />
                  <span>{episode.len}</span>
                </div>
                <h3 className="h-sm">{episode.title}</h3>
                <p className="body body--quiet" style={{ margin: 0 }}>
                  {episode.line}
                </p>
                <p className="micro">{episode.guest}</p>
              </article>
            ))}
          </div>

          <div style={{ marginTop: 'clamp(28px,3.2vw,44px)' }}>
            <ArrowLink to={ROUTES.submitStory}>Nominate someone for season two</ArrowLink>
          </div>
        </Wrap>
      </Section>
    </>
  );
}
