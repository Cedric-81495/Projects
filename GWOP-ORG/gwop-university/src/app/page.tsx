import { BrandBar, Footer } from '@/components/Chrome'
import { PathwayTarget } from '@/components/Pathway'
import { ChatWidget } from '@/components/integrations/ChatWidget'

/* Visual Build Package p.4 — hero card + four course cards, and nothing else.
   The same component renders `/app`, so the two are identical by construction. */
/* async because <ChatWidget> reads the CSP nonce from headers(). That also makes
   this page dynamic rather than static — acceptable for the homepage, and the
   reason the widget is NOT on /830, which must stay prerendered. */
export default async function Home() {
  return (
    <>
      {/* Unlinked bar and legal-only footer until after 8/30. The student area
          is not open — the modules are locked for the event — so every route
          into it leads to a login wall or an empty shell. Restore both when the
          university actually opens. */}
      <BrandBar linked={false} />
      <PathwayTarget surface="website" />
      <Footer legalOnly />
      {/* Marketing pages only. Deliberately imported here rather than from a
          layout, so it can never reach /830 by inheritance — see ChatWidget.tsx
          and CLAUDE.md invariant 7. */}
      <ChatWidget />
    </>
  )
}
