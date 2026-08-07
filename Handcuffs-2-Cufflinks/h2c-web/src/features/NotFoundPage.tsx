import { Seo } from '@/lib/seo/Seo';
import { Section, Wrap } from '@/components/ui/Section';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { ButtonLink, Row } from '@/components/ui/Button';
import { ROUTES } from '@/router/routes';

/** An empty screen is an invitation to act, so this one points somewhere useful. */
export function NotFoundPage() {
  return (
    <>
      <Seo title="Page not found" description="That page does not exist." noIndex />
      <Section surface="obsidian" style={{ paddingTop: 'calc(var(--top-h) + 60px)' }}>
        <Wrap narrow>
          <Eyebrow>404</Eyebrow>
          <h1 className="h-lg rise d1">That page is not here</h1>
          <p className="body rise d2">
            The link may be old, or the page may have moved. The stories are all still where you left
            them.
          </p>
          <Row className="rise d3">
            <ButtonLink to={ROUTES.home} variant="gold" icon="arrow">
              Back to the homepage
            </ButtonLink>
            <ButtonLink to={ROUTES.docuseries} variant="ghost">
              Watch the stories
            </ButtonLink>
          </Row>
        </Wrap>
      </Section>
    </>
  );
}
