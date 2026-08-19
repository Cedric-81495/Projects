import type { Metadata } from 'next'
import { PathwayTarget } from '@/components/Pathway'

export const metadata: Metadata = { title: 'Student Area — GWOP University' }

/* p.4 is one visual target for the website AND the app, so this page renders
   the identical component to `/`. Only the document title differs — that is
   metadata, not layout.

   UI only. Auth and real content are Phase 2 (CLAUDE.md §3). */
export default function StudentHome() {
  return (
    <>
      <PathwayTarget surface="app" />
    </>
  )
}
