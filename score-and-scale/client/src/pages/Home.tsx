import { Header } from '../components/marketing/Header';
import { Hero } from '../components/marketing/Hero';
import { TrustStrip } from '../components/marketing/TrustStrip';
import { Process } from '../components/marketing/Process';
import { Tiers } from '../components/marketing/Tiers';
import { Quote } from '../components/marketing/Quote';
import { Faq } from '../components/marketing/Faq';
import { Footer } from '../components/marketing/Footer';

export function Home() {
  return (
    <div className="overflow-x-hidden">
      <Header />
      <Hero />
      <TrustStrip />
      <Process />
      <Tiers />
      <Quote />
      <Faq />
      <Footer />
    </div>
  );
}
