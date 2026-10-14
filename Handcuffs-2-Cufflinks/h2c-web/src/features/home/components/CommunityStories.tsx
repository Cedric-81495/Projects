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

/**
 * Homepage section 10 — community stories.
 *
 * The page steps back from emerald to steel here: the movement's own voices
 * get their own ground rather than sharing the brand's. Everything shown here
 * has publication consent on record.
 */
export function CommunityStories() {
  // Featured stories only on the homepage: the moderator's pick is the point of
  // the flag, and three chosen stories carry more than the three most recent.
  const { items: STORIES, loading } = useContent<ApiCommunityStory, (typeof STORIES_SEED)[number]>(
    '/community/stories',
    toStory,
    STORIES_SEED,
    { params: { featured: 'true', pageSize: 3 } }
  );

  return (
    <Section surface="charcoal">
      <Wrap>
        <Eyebrow>Community stories · submitted by the movement</Eyebrow>
        <h2 className="h-lg rise d1" style={{ marginBottom: 0 }}>
          Everybody has a story.
          <br />
          These are theirs.
        </h2>

        <div className="g3 rise d2" style={{ marginTop: 'clamp(30px,3.6vw,52px)' }}>
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

        <Row className="rise d3" style={{ marginTop: 'clamp(30px,3.6vw,50px)' }}>
          <ButtonLink to={ROUTES.submitStory} variant="gold" icon="arrow">
            Share your story
          </ButtonLink>
          <ButtonLink to={ROUTES.community} variant="ghost">
            Read more stories
          </ButtonLink>
        </Row>
      </Wrap>
    </Section>
  );
}
