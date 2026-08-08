import { Seo } from '@/lib/seo/Seo';
import { PageHero } from '@/components/layout/PageHero';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { Section, Wrap } from '@/components/ui/Section';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { AssetSlot } from '@/components/ui/AssetSlot';
import { ButtonLink, Row } from '@/components/ui/Button';
import { STORIES as STORIES_SEED } from '@/data/stories';
import { ROUTES } from '@/router/routes';
import { SectionLoad } from '@/components/ui/Spinner';
import { useContent } from '@/lib/api/useContent';
import { toStory } from '@/lib/content/adapters';
import type { ApiCommunityStory } from '@/lib/content/adapters';

export function CommunityPage() {
  const { items: STORIES, loading } = useContent<ApiCommunityStory, (typeof STORIES_SEED)[number]>(
    '/community/stories',
    toStory,
    STORIES_SEED
  );

  return (
    <>
      <Seo
        title="Community"
        description="Stories from the movement. Share yours, volunteer, or find a mentor."
        canonicalPath={ROUTES.community}
      />
      <Breadcrumb trail={[{ label: 'Home', to: ROUTES.home }, { label: 'Community' }]} />
      <PageHero
        eyebrow="Community"
        surface="obsidian"
        title={
          <>
            Everybody has a story.
            <br />
            These are theirs.
          </>
        }
        lede="Submitted by the movement, published with permission. Some of these became docuseries episodes."
      />

      <Section surface="light" tight>
        <Wrap>
          <Eyebrow>Featured stories</Eyebrow>
          <div className="g3 rise d1" style={{ marginTop: 'clamp(24px,3vw,40px)' }}>
            {loading ? <SectionLoad label="Loading stories" /> : STORIES.map((story) => (
              <article className="story" key={story.name}>
                <div className="story-arc">
                  <i />
                  <span>{story.arc}</span>
                </div>
                <blockquote className="story-q">{story.q}</blockquote>
                <div className="story-who">
                  <AssetSlot ratio="1x1" label="IMG" />
                  <div>
                    <b>{story.name}</b>
                    <span>{story.where}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Wrap>
      </Section>

      <Section surface="light-2">
        <Wrap narrow>
          <Eyebrow>Get involved</Eyebrow>
          <h2 className="h-lg rise d1">Three ways in</h2>
          <div className="bens rise d2" style={{ marginTop: 'clamp(22px,2.6vw,36px)' }}>
            <li>
              <span>
                <b>Share your story</b>
                Tell us what held you and what you built. Nothing is published without your written
                permission.
              </span>
            </li>
            <li>
              <span>
                <b>Volunteer</b>
                Events, mentoring, filming, and the unglamorous administrative work that keeps
                programmes running.
              </span>
            </li>
            <li>
              <span>
                <b>Be mentored</b>
                Matched by trade through GWOP. Two hours a month with one consistent adult.
              </span>
            </li>
          </div>

          <Row className="rise d3" style={{ marginTop: 'clamp(26px,3vw,42px)' }}>
            <ButtonLink to={ROUTES.submitStory} variant="gold" icon="arrow">
              Share your story
            </ButtonLink>
            <ButtonLink to={ROUTES.join} variant="ghost">
              Join the Movement
            </ButtonLink>
          </Row>
        </Wrap>
      </Section>
    </>
  );
}
