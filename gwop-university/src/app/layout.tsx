import type { Metadata, Viewport } from 'next'
import './globals.css'
import { site } from '@/content/site'

export const metadata: Metadata = {
  title: 'GWOP University — Knowledge Pays',
  description: site.hero.sub,
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
      <body>{children}</body>
    </html>
  )
}
