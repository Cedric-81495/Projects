import { Seo } from '@/lib/seo/Seo';
import { Band } from '@/components/ui/Section';
import { HeroSection } from './components/HeroSection';
import { MovementTrailer } from './components/MovementTrailer';
import { FeaturedApparel } from './components/FeaturedApparel';
import { MeaningSection } from './components/MeaningSection';
import { PhotoshootLooks } from './components/PhotoshootLooks';
import { FeaturedEpisode } from './components/FeaturedEpisode';
import { PodcastHighlights } from './components/PodcastHighlights';
import { MusicSpotlight } from './components/MusicSpotlight';
import { EcosystemSection } from './components/EcosystemSection';
import { CommunityStories } from './components/CommunityStories';
import { FounderMessage } from './components/FounderMessage';
import { JoinMovement } from './components/JoinMovement';
import { SocialMedia } from './components/SocialMedia';
import { BRAND } from '@/config/site';
import { organizationGraph } from '@/lib/seo/jsonLd';

/**
 * The homepage tells a story rather than presenting a catalogue.
 *
 * Section order is fixed by the guide and must not be rearranged. The
 * transition bands between sections carry the colour arc — steel for the past,
 * emerald for the turn, platinum for arrival — so removing one breaks the
 * journey the page is describing.
 */
export function HomePage() {
  return (
    <>
      <Seo
        title={BRAND.name}
        description="A global movement celebrating transformation. Storytelling, apparel, music, and media that turn struggle into success."
        canonicalPath="/"
        jsonLd={[organizationGraph()]}
      />

      {/* 1 */} <HeroSection />
      {/* 2 */} <MovementTrailer />
      {/* 3 */} <FeaturedApparel />
      {/* 4 */} <MeaningSection />
      <Band direction="to-forest" />
      {/* 5 */} <PhotoshootLooks />
      <Band direction="to-emerald" />
      {/* 6 */} <FeaturedEpisode />
      {/* 7 */} <PodcastHighlights />
      {/* 8 */} <MusicSpotlight />
      {/* 9 */} <EcosystemSection />
      <Band direction="to-light" />
      {/* 10 */} <CommunityStories />
      {/* 11 */} <FounderMessage />
      <Band direction="to-dark" />
      {/* 12 */} <JoinMovement />
      <Band direction="to-black" />
      {/* 13 */} <SocialMedia />
    </>
  );
}
