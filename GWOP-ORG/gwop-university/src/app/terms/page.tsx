import type { Metadata } from 'next'
import { LegalDocument } from '@/components/legal/LegalDocument'
import { TERMS } from '@/content/legal-pages'

/* ⚠ FORCE-DYNAMIC IS LOAD-BEARING, NOT A PERFORMANCE MISTAKE.
   middleware.ts issues a per-request CSP nonce, and Next only stamps that
   nonce onto script tags when the page renders per request. Statically
   rendered under that middleware, every script on the page is blocked — the
   fault that silently removed the password toggle and the Turnstile widget
   from /signup until 2026-09-11.

   This page carries no client components today, so nothing visible would
   break. That is luck, not design, and it stops being true the moment one is
   added. Cheap insurance on a page served a few times a day. */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Terms of Service · GWOP University',
  description: 'The agreement between you and us when you use GWOP University.',
}

export default function Page() {
  return <LegalDocument doc={TERMS} />
}
