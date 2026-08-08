import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Seo } from '@/lib/seo/Seo';
import { PageHero } from '@/components/layout/PageHero';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { Section, Wrap } from '@/components/ui/Section';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Button, ButtonLink, Row } from '@/components/ui/Button';
import { ApparelCard } from '@/features/collections/components/ApparelCard';
import { useMember } from '@/providers/context/member';
import { useEngagement } from '@/providers/context/engagement';
import { fetchMemberEngagement } from '@/providers/memberEngagement';
import { ROUTES } from '@/router/routes';
import { Spinner } from '@/components/ui/Spinner';

/**
 * The member's own page.
 *
 * Exists to make the account worth having: it shows what they have voted for
 * and saved, pulled from the server rather than this browser, which is the
 * whole difference an account makes.
 */
export function AccountPage() {
  const { member, status, signOut } = useMember();
  const { itemById } = useEngagement();
  /**
   * Not reset on success: signing out unmounts this page, and clearing the flag
   * first would flash the idle label back before the redirect.
   */
  const [signingOut, setSigningOut] = useState(false);
  const [engagement, setEngagement] = useState<Record<string, string[]> | null>(null);

  useEffect(() => {
    if (status !== 'signed-in') return;
    void fetchMemberEngagement().then(setEngagement);
  }, [status]);

  if (status === 'loading') {
    return (
      <Section surface="charcoal" style={{ paddingTop: 'calc(var(--top-h) + 60px)' }}>
        <Wrap narrow><p className="body">Loading your account…</p></Wrap>
      </Section>
    );
  }

  if (status === 'anonymous') return <Navigate to={ROUTES.signInMember} replace />;

  const saved = (engagement?.favorite ?? []).map(itemById).filter(Boolean);
  const voted = (engagement?.vote ?? []).map(itemById).filter(Boolean);

  return (
    <>
      <Seo title="Your Account" description="Your saved pieces and votes." noIndex />
      <Breadcrumb trail={[{ label: 'Home', to: ROUTES.home }, { label: 'Your account' }]} />
      <PageHero
        eyebrow="Your account"
        title={`Welcome back, ${member?.firstName ?? ''}`.trim()}
        lede="Everything here follows you to any device you sign in on."
      />

      <Section surface="charcoal" tight>
        <Wrap>
          <Eyebrow>What you voted for</Eyebrow>
          {voted.length === 0 ? (
            <div className="empty">
              <p>You have not voted for anything yet. What the movement votes for is what gets made first.</p>
              <ButtonLink to={ROUTES.collections} variant="ghost" size="sm">Browse the collections</ButtonLink>
            </div>
          ) : (
            <div className="g4">
              {voted.map((item) => item && <ApparelCard key={item.id} item={item} compact />)}
            </div>
          )}

          <Eyebrow>Saved pieces</Eyebrow>
          {saved.length === 0 ? (
            <div className="empty"><p>Nothing saved yet.</p></div>
          ) : (
            <div className="g4">
              {saved.map((item) => item && <ApparelCard key={item.id} item={item} compact />)}
            </div>
          )}
        </Wrap>
      </Section>

      <Section surface="charcoal-hi">
        <Wrap narrow>
          <Eyebrow>Your details</Eyebrow>
          <p className="body">
            {member?.email}
            {member?.location ? ` · ${member.location}` : ''}
          </p>
          <p className="body body--quiet">
            {member?.subscribedToMovement
              ? 'You are on the movement mailing list.'
              : 'You are not on the mailing list.'}{' '}
            <Link to={ROUTES.join} style={{ borderBottom: '1px solid currentColor' }}>Manage that here</Link>.
          </p>
          <Row>
            <Button
              variant="ghost"
              size="sm"
              className="btn--busy"
              disabled={signingOut}
              onClick={() => {
                setSigningOut(true);
                void signOut();
              }}
            >
              {signingOut && <Spinner size="sm" label="" />}
              {signingOut ? 'Signing out' : 'Sign out'}
            </Button>
          </Row>
        </Wrap>
      </Section>
    </>
  );
}
