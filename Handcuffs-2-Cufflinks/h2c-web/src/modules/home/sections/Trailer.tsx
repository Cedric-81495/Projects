import { Play } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { VideoEmbed } from '@/components/media/VideoEmbed';
import { media } from '@/data/media';

export function Trailer() {
  return (
    <section className="section-y bg-ink">
      <Container>
        <Reveal>
          <VideoEmbed youtubeId={media.trailerYouTubeId} title="H2C — Official Trailer">
          <div className="group relative aspect-video w-full overflow-hidden rounded-2xl border border-faint/40 bg-onyx">
            {/* Poster stand-in — swap for real <video>/embed */}
            <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_70%_10%,rgb(var(--c-gold)/0.18),transparent_55%)]" />
            <div className="absolute inset-0 bg-grain opacity-[0.05]" />

            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8 text-center">
              <Eyebrow className="justify-center">The Movement &mdash; Official Trailer</Eyebrow>
              <button
                type="button"
                aria-label="Play the trailer"
                className="grid h-20 w-20 place-items-center rounded-full border border-gold/50 bg-ink/40 backdrop-blur transition duration-300 ease-ease group-hover:scale-105 group-hover:border-gold"
              >
                <Play size={26} className="translate-x-0.5 fill-gold text-gold" />
              </button>
              <p className="max-w-md text-pretty font-display text-2xl text-bone sm:text-3xl">
                Ninety seconds on what it takes to change.
              </p>
            </div>

            {/* runtime chip */}
            <span className="absolute bottom-4 right-4 rounded-full border border-faint/50 bg-ink/70 px-3 py-1 font-mono text-xs text-muted">
              1:32
            </span>
          </div>
          </VideoEmbed>
        </Reveal>
      </Container>
    </section>
  );
}
