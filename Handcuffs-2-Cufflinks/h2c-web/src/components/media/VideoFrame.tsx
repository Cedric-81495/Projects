import { useState } from 'react';
import { AssetSlot } from '@/components/ui/AssetSlot';
import type { Ratio, Tone } from '@/components/ui/AssetSlot';
import { Icon } from '@/components/ui/Icon';

interface VideoFrameProps {
  /** YouTube video id. Empty while the CMS field is unset. */
  youtubeVideoId?: string;
  title: string;
  ratio?: Ratio;
  tone?: Tone;
  posterSrc?: string;
  /** Placeholder spec shown before the video is available. */
  spec?: string;
  playLabel?: string;
}

/**
 * Click-to-play YouTube embed.
 *
 * The guide requires videos to play in place rather than sending visitors to
 * YouTube. Nothing loads from youtube.com until the visitor presses play,
 * which keeps third-party cookies off the first paint and keeps the page fast.
 */
export function VideoFrame({
  youtubeVideoId,
  title,
  ratio = '16x9',
  tone = '',
  posterSrc,
  spec,
  playLabel = 'Play',
}: VideoFrameProps) {
  const [playing, setPlaying] = useState(false);

  if (playing && youtubeVideoId) {
    return (
      <div className="vframe">
        <iframe
          className={`r-${ratio}`}
          style={{ width: '100%', border: 0, display: 'block' }}
          src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="vframe">
      <AssetSlot ratio={ratio} tone={tone} label="VIDEO" spec={spec} src={posterSrc} alt={title} />
      <button
        type="button"
        className="play"
        onClick={() => setPlaying(true)}
        disabled={!youtubeVideoId}
        aria-label={youtubeVideoId ? `Play ${title}` : `${title} — video coming soon`}
      >
        <span className="play-ring">
          <Icon name="play" filled />
        </span>
        <span className="play-label">{youtubeVideoId ? playLabel : 'Coming soon'}</span>
      </button>
    </div>
  );
}
