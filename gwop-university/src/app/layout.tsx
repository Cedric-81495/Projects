import type { Metadata, Viewport } from 'next'
import './globals.css'
import { site } from '@/content/site'

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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* PREVIEW ONLY. Production: self-host + subset (CLAUDE.md invariant 17). */}
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Poppins:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
