import { BrandBar, Footer } from '@/components/Chrome'
import { PathwayTarget } from '@/components/Pathway'
import { ChatWidget } from '@/components/integrations/ChatWidget'

/* Visual Build Package p.4 — hero card + four course cards, and nothing else.
   The same component renders `/app`, so the two are identical by construction. */
export default function Home() {
  return (
    <>
      <BrandBar />
      <PathwayTarget surface="website" />
      <Footer />
      {/* Marketing pages only. Deliberately imported here rather than from a
          layout, so it can never reach /830 by inheritance — see ChatWidget.tsx
          and CLAUDE.md invariant 7. */}
      <ChatWidget />
    </>
  )
}
