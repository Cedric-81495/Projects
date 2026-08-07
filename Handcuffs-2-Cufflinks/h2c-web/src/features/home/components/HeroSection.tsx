import { ButtonLink, Row } from '@/components/ui/Button';
import { AssetSlot } from '@/components/ui/AssetSlot';
import { BRAND } from '@/config/site';
import { ROUTES } from '@/router/routes';

/**
 * Homepage hero.
 *
 * The key art carries the wordmark, tagline, and creed already, so the copy
 * beneath it restates the message rather than competing with it. The image is
 * anchored near the top: any crop comes off the base strip, which the text
 * below repeats anyway.
 *
 * The visible <h1> is hidden and the accessible one is the sr-only heading,
 * because the page's real title lives inside the artwork.
 */
export function HeroSection() {
  return (
    <section className="hero" id="top">
      <h1 className="sr">
        {BRAND.name} — {BRAND.tagline}
      </h1>

      <div className="hero-art">
        <img
          src="/media/hero.jpg"
          alt={`${BRAND.name}. ${BRAND.tagline}. ${BRAND.creed} ${BRAND.legacyLine}. ${BRAND.location}.`}
          width={1440}
          height={874}
          fetchPriority="high"
          decoding="async"
        />
        <div className="hero-scrim" />
      </div>

      <div className="hero-in">
        <div>
          <p className="hero-tag">{BRAND.tagline}</p>
          <p className="hero-support">
            Your past is part of your story — not the end of it.
          </p>
          <Row>
            <ButtonLink to={ROUTES.collections} variant="gold" icon="arrow">
              Shop the Movement
            </ButtonLink>
            <ButtonLink to={ROUTES.docuseries} variant="ghost" icon="play">
              Watch the Stories
            </ButtonLink>
          </Row>

          <div className="hero-strip">
            <span>{BRAND.creed}</span>
            <i />
            <span>{BRAND.legacyLine}</span>
            <i />
            <span>{BRAND.location}</span>
          </div>

          <div className="cue">
            <i />
            <span>Scroll</span>
          </div>
        </div>

        <div className="hero-figs">
          <AssetSlot ratio="2x3" tone="" label="PHOTO" spec="H2C_Hero_Look01_Portrait_2x3.jpg" />
          <AssetSlot ratio="2x3" tone="warm" label="PHOTO" spec="H2C_Hero_Look05_Portrait_2x3.jpg" />
          <AssetSlot ratio="2x3" tone="em" label="PHOTO" spec="H2C_Hero_Look08_Portrait_2x3.jpg" />
        </div>
      </div>
    </section>
  );
}
