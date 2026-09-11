import type { Metadata } from 'next'
import { Playfair_Display, Montserrat } from 'next/font/google'

import '@/styles/funnel.css'

import { site } from '@/content/site'
import { funnel } from '@/content/funnel'
import { InterestForm } from './InterestForm'
import { NoThirdPartyWidgets } from '@/components/integrations/NoThirdPartyWidgets'
import {
  FunnelHeader, Hero, HonestBar, Problem, Pathway, Bundle, Process,
  Difference, Founder, Trust, Testimonials, Faq, FunnelFooter,
} from '@/components/funnel/Sections'

/* ═══════════════════════════════════════════════════════════════════════════
   /830 — THE FUNNEL
   Exact port of gwopfunnel-recommended-sequence_2.html: same sections, same
   order, same copy, same palette, same type, same buttons, same crest.

   ── WHY THE ROUTE IS STILL CALLED 830 ─────────────────────────────────────
   The printed QR cards do not encode /830. They encode SITE_URL + /go/1,
   which hits app/go/[code]/route.ts and redirects to EVENT_PATH in
   config/integrations.ts. That indirection is the re-pointing mechanism and it
   is why the cards never need reprinting. Renaming the route buys nothing and
   risks the one asset that cannot be rebuilt: printed inventory already in
   Surpaul's hands. EVENT_KEY is also stamped on every assessment row Jake
   reports on, so the name is data now, not copy. /blueprint and /funnel
   redirect here — see next.config.ts.

   ── NOT AN EVENT PAGE ─────────────────────────────────────────────────────
   No copy may assume a date, a venue, that the reader is in a room with us, or
   that the offer expires. All four were live here and all were removed in the
   09-01 sweep. Nothing in the approved layout reintroduces them, which is one
   reason it ports cleanly.

   ── SECTION ORDER, AS APPROVED ────────────────────────────────────────────
     Header · Hero · Honest bar · Problem · Pathway · Bundle · Process ·
     Difference · Founder · Trust · Testimonials · FAQ · #choose · Footer

   ── WHERE THE MOCKUP'S POST-OPT-IN STRETCH WENT ═══════════════════════════
   The mockup's #blueprintStretch — Blueprint, IdentityIQ, booking, teaser — is
   not a section of this page. It is what <InterestForm /> already renders
   after a successful submit, and it already has the mockup's exact structure:
   "Where You Are" / "What's Holding You Back" / "Your Next 3 Moves", plus a
   "What NOT to Do Yet" block the mockup does not have.

   The difference is the data. The mockup used {{contact.standing_summary}},
   {{contact.move_1_title}} and so on because a static HTML file has no answers
   to read — GHL would have to fill them, and those tokens only resolve inside
   a GHL-hosted page, not here. This app has the visitor's real assessment in
   Postgres.

   So the approved SEQUENCE is honoured by reordering what already exists, not
   by rebuilding it. Three lines, two call sites — INSTALL.md §4.

   ── CSP ───────────────────────────────────────────────────────────────────
   This route is excluded from the middleware matcher, so it is served the CSP
   from next.config.ts, not the nonce CSP. An origin added only to
   middleware.ts has no effect here. The Bunny teaser needs
   iframe.mediadelivery.net in BOTH frame-src and media-src in next.config.ts —
   that file had no media-src at all, so the player fell back to default-src
   'self' and was blocked. Fixed in the shipped config.

   Every section is a server component with no inline <script>, so the page
   carries no JavaScript beyond what InterestForm already ships.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── THE MOCKUP'S TYPEFACES ────────────────────────────────────────────────
   Playfair Display and Montserrat, which is what the mockup specifies. The
   app's own faces are Cormorant Garamond and Poppins, loaded in
   app/layout.tsx — those stay for every other route; these are bound to the
   .fn wrapper below and reach nothing else.

   next/font, NOT an @import or a <link>. layout.tsx records that a
   fonts.googleapis.com <link> was removed because it painted the page twice:
   the browser could not start the request until the CSS had parsed, so the
   first paint used a fallback and the second reflowed. next/font self-hosts
   the files, serves them same-origin, and needs no CSP entry.

   display: 'swap' so text is readable during the font load rather than
   invisible — the crest animation already covers the first moment. */
const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],   // the hero sub is italic serif
  variable: '--fn-serif',
  display: 'swap',
})

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--fn-ui',
  display: 'swap',
})

/* ⚠ INDEXABLE — A CHANGE FROM THE PREVIOUS VERSION.
   This route used to set robots { index: false }, correct when it was a booth
   page reached only by a scan. It is the funnel now, and a noindexed ad
   destination is a page you pay to send people to and then hide from everyone
   else.

   ⚠ THE OVERRIDE MATTERS MORE THAN THE FLIP. app/layout.tsx sets
   robots { index: false, follow: false } SITE-WIDE and every route inherits
   it. Setting index: true here overrides the root for this route alone — the
   student area, /admin, the legal stubs and the unapproved pricing all stay
   out of search. Do NOT fix this by removing the root noindex. */
/* ⚠ metadataBase IS SET HERE, NOT IN THE ROOT LAYOUT, AND IT MATTERS.
   app/layout.tsx does not set one. Without it, Next resolves the relative
   `canonical` and `openGraph.url` below against http://localhost:3000 — so
   every shared link, every Slack and iMessage preview, and the canonical tag
   search engines read would point at a developer's machine. It warns at build
   and is easy to scroll past.

   Read from NEXT_PUBLIC_SITE_URL rather than hardcoded, so preview deploys
   canonicalise to themselves instead of claiming to be production. Falls back
   to localhost only when the variable is unset, which is local dev.

   Set in the page rather than the root layout deliberately: the root layout is
   shared with the portal and admin, and changing metadata there means
   re-checking every route. This is the route that needs it. */
/* ⚠ new URL() THROWS ON A MALFORMED VALUE, AND THIS RUNS AT BUILD TIME.
   A typo in NEXT_PUBLIC_SITE_URL — a missing scheme, a stray space — would
   fail the production build with a stack trace pointing at metadata rather
   than at the env var. Falling back to localhost instead means link previews
   are wrong on that deploy, which is visible and fixable, rather than the
   deploy not happening at all. */
function siteUrl(): URL {
  const raw = process.env.NEXT_PUBLIC_SITE_URL
  try {
    return new URL(raw ?? 'http://localhost:3000')
  } catch {
    return new URL('http://localhost:3000')
  }
}

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: `${site.hero.h1} — ${site.brand}`,
  description: `${site.hero.sub} ${site.hero.subKicker}`,
  robots: { index: true, follow: true },
  alternates: { canonical: '/830' },
  openGraph: {
    title: site.hero.h1,
    description: site.hero.sub,
    url: '/830',
    type: 'website',
  },
}

export default function FunnelPage() {
  return (
    /* id="top" is the header brand's anchor target, as in the mockup. */
    <div className={`fn ${playfair.variable} ${montserrat.variable}`} id="top">
      {/* Sweeps third-party DOM that arrived via a client-side navigation.
          Nothing loads over the assessment — CLAUDE.md §8.7. */}
      <NoThirdPartyWidgets />

      <FunnelHeader />
      <Hero />
      <HonestBar />
      <Problem />
      <Pathway />
      <Bundle />
      <Process />
      <Difference />
      <Founder />
      <Trust />
      <Testimonials />
      <Faq />

      {/* ══ THE ONE DESTINATION ══ #choose, matching live, which every CTA on
          the page points at.

          <InterestForm /> owns everything from here: Q1 interest, Q2–Q7
          assessment, contact capture with Turnstile and consent, POST
          /api/lead, then the Blueprint, IdentityIQ, booking and the teaser.

          ⚠ THE MOCKUP'S OWN <form> IS NOT USED AND MUST NOT BE REVIVED. It
          posts to action="REPLACE_WITH_YOUR_GHL_FORM_ENDPOINT" with three raw
          fields: no consent capture, no consent_text_version, no consent_ip or
          consent_user_agent, no E.164 normalisation, no bot check. The three
          fields it collects are the same three InterestForm collects, so
          nothing is lost by dropping it — the mockup's .fn-form-card chrome is
          kept and the assessment renders inside it. */}
      {/* ⚠ THE ID IS #choose, NOT THE MOCKUP'S #start.

          Live is https://thegwopblueprint.com/830#choose, and that fragment is
          already out in the world — anything Jake has linked, anything typed
          into a caption, anyone's bookmark. Renaming the anchor would leave
          all of it landing at the top of a long page with no idea why, and a
          fragment that matches nothing fails silently: no 404, no console
          error, just a scroll that does not happen.

          The mockup's #start is kept as an alias on the span below, so links
          written against the design work too. Two fragments, one destination,
          nothing to reprint or re-send. */}
      <span id="start" aria-hidden="true" />
      <section className="fn-section fn-final-cta fn-wrap" id="choose">
        <p className="fn-eyebrow" style={{ marginBottom: 14 }}>{funnel.finalCta.tag}</p>
        <h2>{funnel.finalCta.h2}</h2>
        <p className="fn-lede">{funnel.finalCta.lede}</p>

        <div className="fn-form-card">
          <InterestForm />
        </div>
      </section>

      <FunnelFooter />
    </div>
  )
}
