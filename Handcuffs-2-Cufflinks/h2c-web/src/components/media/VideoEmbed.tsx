import { useState } from 'react';
import { Play } from 'lucide-react';

/**
 * Privacy-friendly YouTube embed. Shows a lightweight poster + play button and
 * only loads the iframe (youtube-nocookie) on click — no third-party scripts or
 * cookies until the user chooses to watch. Falls back to `children` when no id.
 */
export function VideoEmbed({
  youtubeId,
  title,
  children,
}: {
  youtubeId?: string;
  title: string;
  children?: React.ReactNode;
}) {
  const [playing, setPlaying] = useState(false);

  if (!youtubeId) return <>{children}</>;

  if (playing) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-faint/40 bg-black">
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Play: ${title}`}
      className="group relative block aspect-video w-full overflow-hidden rounded-2xl border border-faint/40 bg-onyx"
    >
      <img
        src={`https://i.ytimg.com/vi/${youtubeId}/maxresdefault.jpg`}
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover opacity-80 transition group-hover:opacity-100"
      />
      <span className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
      <span className="absolute left-1/2 top-1/2 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-gold/60 bg-ink/50 backdrop-blur transition duration-300 group-hover:scale-105 group-hover:border-gold">
        <Play size={26} className="translate-x-0.5 fill-gold text-gold" />
      </span>
    </button>
  );
}
