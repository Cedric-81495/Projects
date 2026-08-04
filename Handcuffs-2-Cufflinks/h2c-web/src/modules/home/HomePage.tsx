import { Hero } from './sections/Hero';
import { Trailer } from './sections/Trailer';
import { Meaning } from './sections/Meaning';
import { StoriesPreview } from './sections/StoriesPreview';
import { PodcastPreview } from './sections/PodcastPreview';
import { MusicPreview } from './sections/MusicPreview';
import { ApparelBand } from './sections/ApparelBand';
import { CommunityCallout } from './sections/CommunityCallout';
import { FounderIntro } from './sections/FounderIntro';
import { JoinCta } from './sections/JoinCta';

/**
 * Homepage flow mirrors the platform's intended emotional progression:
 * Hero → Trailer → Meaning → Stories → Podcast → Music → (Express) →
 * Community → Founder → Join.
 * Shopping is one stop along the journey, never the destination.
 */
export function HomePage() {
  return (
    <>
      <Hero />
      <Trailer />
      <Meaning />
      <StoriesPreview />
      <PodcastPreview />
      <MusicPreview />
      <ApparelBand />
      <CommunityCallout />
      <FounderIntro />
      <JoinCta />
    </>
  );
}
