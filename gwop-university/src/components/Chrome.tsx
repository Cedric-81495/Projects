import Image from 'next/image'
import Link from 'next/link'
import { site, legal } from '@/content/site'
import { PATHWAY } from '@/content/pathway'
import { DRAFT, EVENT_PATH } from '@/config/integrations'
import { SiteNav } from './SiteNav'

/** Wraps unconfirmed copy so DRAFT mode can highlight it. */
export function Tbc({ children }: { children: React.ReactNode }) {
  return <span {...(DRAFT ? { 'data-tbc': '' } : {})}>{children}</span>
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

export function Nav() {
  return <SiteNav />
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
                    : <span data-tbc>{s.name}</span>}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Pathway</h4>
            <ul>
              {PATHWAY.map(l => (
                <li key={l.slug}><a href="/#pathway">{l.label}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4>University</h4>
            <ul>
              <li><Link href="/app">Student area</Link></li>
              <li><Link href={EVENT_PATH}>Get started</Link></li>
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
    </footer>
  )
}

export function DraftBar({ pending }: { pending: string }) {
  if (!DRAFT) return null
  return <div className="draftbar">⚠️ <b>DRAFT</b> — pending: {pending}</div>
}
