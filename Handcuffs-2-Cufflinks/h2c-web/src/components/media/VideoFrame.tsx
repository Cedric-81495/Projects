import { useState } from 'react';
import { AssetSlot } from '@/components/ui/AssetSlot';
import type { Ratio, Tone } from '@/components/ui/AssetSlot';
import { Icon } from '@/components/ui/Icon';
import { cloudinaryPoster, cloudinaryUrl } from '@/lib/media/cloudinary';

interface VideoFrameProps {
  /** YouTube video id. Empty while the CMS field is unset. */
  youtubeVideoId?: string;
  /**
   * A video hosted on Cloudinary, for material that does not belong on
   * YouTube — behind-the-scenes cuts, the movement trailer, artist reels.
   * Takes precedence over `youtubeVideoId` when both are set, because a file we
   * host plays without handing the visitor to a third party.
   */
  videoSrc?: string;
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
  videoSrc,
  title,
  ratio = '16x9',
  tone = '',
  posterSrc,
  spec,
  playLabel = 'Play',
}: VideoFrameProps) {
  const [playing, setPlaying] = useState(false);

  const playable = Boolean(videoSrc || youtubeVideoId);
  /**
   * A still is rendered from the video itself when no poster was supplied, so a
   * cut can be published without a separate poster file to produce, upload and
   * keep in step with the edit.
   */
  const poster = posterSrc || (videoSrc ? cloudinaryPoster(videoSrc) : '');

  if (playing && videoSrc) {
    return (
      <div className="vframe">
        {/* Captions belong on the file itself; Cloudinary serves the track when
            one is attached to the asset, so there is nothing to add here. */}
        <video
          className={`r-${ratio}`}
          style={{ width: '100%', display: 'block' }}
          src={cloudinaryUrl(videoSrc, { resourceType: 'video' })}
          poster={poster || undefined}
          controls
          autoPlay
          playsInline
          preload="metadata"
        />
      </div>
    );
  }

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
      <AssetSlot
        ratio={ratio}
        tone={tone}
        label="VIDEO"
        spec={spec}
        src={poster || undefined}
        alt={title}
      />
      <button
        type="button"
        className="play"
        onClick={() => setPlaying(true)}
        disabled={!playable}
        aria-label={playable ? `Play ${title}` : `${title} — video coming soon`}
      >
        <span className="play-ring">
          <Icon name="play" filled />
        </span>
        <span className="play-label">{playable ? playLabel : 'Coming soon'}</span>
      </button>
    </div>
  );
}
