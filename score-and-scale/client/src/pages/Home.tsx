import { CtaBand } from '../components/marketing/CtaBand'
import { Faq } from '../components/marketing/Faq'
import { Hero } from '../components/marketing/Hero'
import { Process } from '../components/marketing/Process'
import { Quote } from '../components/marketing/Quote'
import { Tiers } from '../components/marketing/Tiers'
import { TrustStrip } from '../components/marketing/TrustStrip'

/**
 * The funnel page.
 *
 * Section order is the conversion path: hook, credibility, method, proof,
 * price, objection handling, then the close. Each section is a self-contained
 * component so one can be reordered or A/B tested without touching the others.
 */
export function Home() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <Process />
      <Quote />
      <Tiers />
      <Faq />
      <CtaBand />
    </>
  )
}
