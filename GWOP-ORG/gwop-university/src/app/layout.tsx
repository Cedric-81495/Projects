import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Poppins } from 'next/font/google'
import './globals.css'
import { site } from '@/content/site'

/* ═══════════════════════════════════════════════════════════════════════════
   FONTS — self-hosted at build time. Closes CLAUDE.md invariant 17.

   This replaced a <link> to fonts.googleapis.com. That version painted the page
   in Georgia and system-ui, then visibly reflowed every heading and label once
   the third-party stylesheet arrived. On congested venue cellular that swap
   landed a second or more after paint — an attendee watched the form restyle
   itself while reading it.

   next/font fixes the cause rather than masking it:
     · the font files are downloaded at build time and served from our own
       origin, so there is no third-party request at the booth at all
     · Next generates a size-adjusted local fallback from the real font's
       metrics, so the pre-swap and post-swap text occupy nearly the same space
       and the reflow is close to invisible
     · the render-blocking external stylesheet is gone

   `weight` lists only the weights globals.css actually uses. Adding one here
   costs every visitor another file, so check the stylesheet before extending it.
   ═══════════════════════════════════════════════════════════════════════════ */
const display = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['600', '700'],
  display: 'swap',
  variable: '--font-display',
  /* Georgia is the closest widely-installed serif by metrics, so it is the
     fallback Next adjusts against. Left explicit rather than relying on the
     default so the choice is visible. */
  fallback: ['Georgia', 'Times New Roman', 'serif'],
})

const body = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-body',
  fallback: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
})

export const metadata: Metadata = {
  title: 'GWOP University — Knowledge Pays',
  description: site.hero.sub,
  /* Keep the site out of search engines until pricing and the attorney's legal
     copy are approved. Remove this line to allow indexing. */
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  themeColor: '#0F1210',
  /* Required for the env(safe-area-inset-*) values the drawer relies on.
     Without viewport-fit they resolve to 0 and the menu sits under the
     notch and the home indicator on iPhone. */
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    /* The variables go on <html>, not <body>: globals.css reads them in :root. */
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  )
}