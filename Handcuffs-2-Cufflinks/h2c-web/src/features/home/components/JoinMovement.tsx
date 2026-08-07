import { Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { Section, Wrap, Arc } from '@/components/ui/Section';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { ROUTES } from '@/router/routes';

/**
 * Homepage section 12 — Join the Movement.
 *
 * The page's most important action, so it gets a full emerald section rather
 * than a footer strip.
 *
 * The form itself is split out: it is the only thing on the homepage that needs
 * react-hook-form, and it sits far below the fold, so loading it with the hero
 * would cost every visitor for something most of them reach seconds later.
 */
const JoinForm = lazy(() =>
  import('@/features/join/JoinForm').then((m) => ({ default: m.JoinForm }))
);

export function JoinMovement() {
  return (
    <Section surface="emerald" id="join">
      <Arc position="tr" />
      <Wrap>
        <div className="split split--top">
          <div>
            <Eyebrow>Join the movement</Eyebrow>
            <h2 className="h-lg rise d1">
              Your story is still
              <br />
              being written.
            </h2>
            <p className="lede rise d2">
              One list. New episodes, new music, new drops, and the chance to vote on what gets made
              next.
            </p>
            <p className="body body--quiet rise d2">
              We send what matters and nothing else. Read the{' '}
              <Link to={`${ROUTES.legal}/privacy`} style={{ borderBottom: '1px solid currentColor' }}>
                Privacy Policy
              </Link>
              .
            </p>
          </div>

          <div className="rise d3">
            {/* Reserves the form's height so the section does not jump on load. */}
            <Suspense fallback={<div style={{ minHeight: 520 }} aria-busy="true" />}>
              <JoinForm />
            </Suspense>
          </div>
        </div>
      </Wrap>
    </Section>
  );
}
