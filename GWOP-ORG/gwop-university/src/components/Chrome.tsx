import Image from 'next/image'
import Link from 'next/link'
import { site, legal } from '@/content/site'
import { PATHWAY } from '@/content/pathway'
import { EVENT_PATH } from '@/config/integrations'
import { BackToTop } from '@/components/BackToTop'

/** Marks copy that is still awaiting approval. Renders plainly — the marker
 *  exists so a search for `Tbc` finds every unapproved string in the source. */
export function Tbc({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

/** The MARK — clean shield. Brand sheet: nav, footer, favicons, small use.
 *  Deliberately not the ornate Blueprint artwork: at 34px that reads as a
 *  green smudge, while this shield stays legible. */
export function Crest({ size = 38 }: { size?: number }) {
  return (
    <Image
      className="crest"
      src="/mark-128.png"
      alt=""
      width={size}
      height={size}
      priority
      style={{ width: size, height: size, objectFit: 'contain' }}
    />
  )
}

export function Logo() {
  return (
    <Link className="logo" href="/">
      <Crest />
      <b>
        {site.brand}
        <small>{site.motto}</small>
      </b>
    </Link>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   BRAND BAR — the same header on every page.

   Package p.1 team rule: "every screen, workbook, event piece and social asset
   should feel like it belongs to the same university." `/830` already used this
   bar; `/` and `/app` had a separate header with a nav menu and a mobile drawer.

   That menu earned its removal on its own terms: it held two items, one of which
   ("Students") duplicated the four course cards, and the other duplicated the
   hero CTA. p.4 does not show a nav bar. Everywhere to go is already on the page
   — the cards go into the levels, the footer holds the legal routes.

   `linked` is false on `/830` only, where invariant 10 applies: nothing on the
   event page may click away from the form.
   ═══════════════════════════════════════════════════════════════════════════ */
export function BrandBar({ linked = true }: { linked?: boolean }) {
  const inner = (
    <>
      <Crest size={34} />
      <b>
        {site.brand}
        <small>{site.motto}</small>
      </b>
    </>
  )
  return linked
    ? <Link className="evbar" href="/">{inner}</Link>
    : <div className="evbar">{inner}</div>
}

export function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="fg">
          <div>
            <Logo />
            <p className="blurb">{site.tagline}</p>

            {/* Felicia §12 — official accounts. Empty URLs render a plain
                label, so the slot is visibly reserved without a dead link. */}
            <ul className="socials">
              {site.social.map(s => (
                <li key={s.name}>
                  {s.url
                    ? <a href={s.url} rel="me noopener" target="_blank">{s.name}</a>
                    : <span className="soon">{s.name}</span>}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Pathway</h4>
            <ul>
              {PATHWAY.map(l => (
                <li key={l.slug}><Link href={`/app/${l.slug}`}>{l.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4>University</h4>
            <ul>
              <li><Link href="/app">Student area</Link></li>
              {/* Plain <a> for the same reason as the hero CTA in Pathway.tsx:
                  a client-side navigation carries injected third-party DOM onto
                  /830, where no third-party script may run. */}
              <li><a href={EVENT_PATH}>Get started</a></li>
            </ul>
          </div>
          <div>
            <h4>Legal</h4>
            {/* Felicia §13 — all four required routes, linked. */}
            <ul>
              <li><Link href="/privacy">Privacy Policy</Link></li>
              <li><Link href="/terms">Terms &amp; Conditions</Link></li>
              <li><Link href="/sms-terms">SMS Terms &amp; Consent</Link></li>
              <li><Link href="/refunds">Refund &amp; Cancellation</Link></li>
              <li><Link href="/disclosures">Disclosures</Link></li>
            </ul>
          </div>
        </div>

        {/* ⚠️ Attorney-supplied only — edit src/content/site.ts */}
        <div className="legal">
          <p><strong><Tbc>{legal.entity.text}</Tbc></strong> · <Tbc>{legal.address.text}</Tbc></p>
          <p><Tbc>{legal.disclosure.text}</Tbc></p>
          <p>© {new Date().getFullYear()} <Tbc>{legal.entity.text}</Tbc>. All rights reserved.</p>
        </div>
      </div>

      {/* Mounted here on purpose. <Footer> is not used on /830 — the event page
          renders its own `.evfoot` — so the control cannot appear over the
          signup form, per CLAUDE.md invariant 7. Keeping it inside the footer
          means that stays true for any future page too: whatever gets the shared
          footer gets this, and the event page never will. */}
      <BackToTop />
    </footer>
  )
}

