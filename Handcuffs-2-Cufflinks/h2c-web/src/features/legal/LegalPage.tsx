import { Link, useParams } from 'react-router-dom';
import { Seo } from '@/lib/seo/Seo';
import { PageHero } from '@/components/layout/PageHero';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { Section, Wrap } from '@/components/ui/Section';
import { Note } from '@/components/ui/Note';
import { ROUTES } from '@/router/routes';

/**
 * Legal documents.
 *
 * These are structured, routed placeholders. Final wording must be supplied or
 * approved by the client's counsel — it is not copy for a developer to invent,
 * and the consent document in particular has real consequences for the people
 * submitting stories.
 */
const DOCS: Record<string, { title: string; summary: string; sections: string[] }> = {
  privacy: {
    title: 'Privacy Policy',
    summary: 'What we collect, why, and how to have it removed.',
    sections: [
      'What we collect',
      'How we use it',
      'Who we share it with',
      'How long we keep it',
      'Your rights and how to exercise them',
      'Contact',
    ],
  },
  terms: {
    title: 'Terms of Use',
    summary: 'The rules for using this website and its content.',
    sections: [
      'Using this site',
      'Your submissions',
      'Intellectual property',
      'Third-party links',
      'Limitation of liability',
      'Governing law',
    ],
  },
  cookies: {
    title: 'Cookie Notice',
    summary: 'The cookies we set and how to control them.',
    sections: ['Essential cookies', 'Analytics cookies', 'Managing your choices'],
  },
  consent: {
    title: 'Story and Image Consent',
    summary: 'What you agree to when you submit a story, photograph, or video.',
    sections: [
      'What you are giving permission for',
      'Withdrawing permission',
      'How we handle minors',
      'How we handle sensitive details',
    ],
  },
};

export function LegalPage() {
  const { docSlug } = useParams<{ docSlug?: string }>();
  const doc = docSlug ? DOCS[docSlug] : undefined;

  if (!doc) {
    return (
      <>
        <Seo
          title="Legal"
          description="Privacy, terms, cookies, and consent."
          canonicalPath={ROUTES.legal}
        />
        <Breadcrumb trail={[{ label: 'Home', to: ROUTES.home }, { label: 'Legal' }]} />
        <PageHero eyebrow="Legal" title="Policies" lede="Privacy, terms, cookies, and consent." />
        <Section surface="charcoal" tight>
          <Wrap narrow>
            <ul className="bens">
              {Object.entries(DOCS).map(([slug, entry]) => (
                <li key={slug}>
                  <span>
                    <b>
                      <Link to={`${ROUTES.legal}/${slug}`}>{entry.title}</Link>
                    </b>
                    {entry.summary}
                  </span>
                </li>
              ))}
            </ul>
          </Wrap>
        </Section>
      </>
    );
  }

  return (
    <>
      <Seo
        title={doc.title}
        description={doc.summary}
        canonicalPath={`${ROUTES.legal}/${docSlug}`}
      />
      <Breadcrumb
        trail={[
          { label: 'Home', to: ROUTES.home },
          { label: 'Legal', to: ROUTES.legal },
          { label: doc.title },
        ]}
      />
      <PageHero eyebrow="Legal" title={doc.title} lede={doc.summary} />
      <Section surface="charcoal" tight>
        <Wrap narrow>
          <Note label="Awaiting approved wording">
            The structure below is in place and routed. Final wording must be supplied or approved by
            the client&rsquo;s legal counsel before launch.
          </Note>
          <div className="acc" style={{ marginTop: 'clamp(24px,3vw,40px)' }}>
            {doc.sections.map((section) => (
              <div className="acc-item" key={section}>
                <h2 className="acc-q">{section}</h2>
              </div>
            ))}
          </div>
        </Wrap>
      </Section>
    </>
  );
}
