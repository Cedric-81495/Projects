import { BrandBar, Footer } from '@/components/Chrome'
import { PathwayTarget } from '@/components/Pathway'

/* Visual Build Package p.4 — hero card + four course cards, and nothing else.
   The same component renders `/app`, so the two are identical by construction. */
export default function Home() {
  return (
    <>
      <BrandBar />
      <PathwayTarget surface="website" />
      <Footer />
    </>
  )
}
