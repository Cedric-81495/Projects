import type { Metadata, Viewport } from 'next'
import './globals.css'
import { site } from '@/content/site'
import { DRAFT } from '@/config/integrations'

export const metadata: Metadata = {
  title: 'GWOP University — Knowledge Pays',
  description: site.hero.sub,
  /* While DRAFT is on, keep the whole site out of search engines — it carries
     placeholder pricing and unapproved legal copy. Public URL, un-findable.
     Flip DRAFT to false in src/config/integrations.ts to allow indexing. */
  robots: DRAFT ? { index: false, follow: false } : undefined,
}

export const viewport: Viewport = { themeColor: '#0F1210' }

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
      {/* globals.css styles `body.draft [data-tbc]`, but nothing was adding the
          class — so every placeholder highlight was silently inert and the
          "nothing unapproved can ship by accident" safeguard did nothing. */}
      <body className={DRAFT ? 'draft' : undefined}>{children}</body>
    </html>
  )
}
