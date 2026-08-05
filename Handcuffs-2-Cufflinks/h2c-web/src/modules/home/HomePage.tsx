import { useReveal } from '@/lib/useReveal';
import { Hero } from './sections/Hero';
import { Trailer, MovementMeaning, Boston } from './sections/Intro';
import {
  LookbookSection,
  StoriesTeaser,
  PodcastTeaser,
  MusicTeaser,
  GwopTeaser,
  CommunityTeaser,
  FounderTeaser,
  JoinTeaser,
} from './sections/Hubs';

/**
 * The homepage guides the visitor through an emotional progression:
 * Hero → Trailer → Meaning → Boston → Stories → Podcast → Music →
 * Lookbook → GWOP → Community → Founder → Join.
 *
 * The lookbook is one stop on the journey — brand expression — not
 * the destination. The destination is joining the movement.
 */
export function HomePage() {
  useReveal('home');
  return (
    <>
      <Hero />
      <Trailer />
      <MovementMeaning />
      <Boston />
      <StoriesTeaser />
      <PodcastTeaser />
      <MusicTeaser />
      <LookbookSection />
      <GwopTeaser />
      <CommunityTeaser />
      <FounderTeaser />
      <JoinTeaser />
    </>
  );
}
