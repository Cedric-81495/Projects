import { useState } from 'react';
import type { MediaAsset, MediaRatio } from '@/types';
import { cn } from '@/lib/cn';

// ============================================================
// Data-driven media components.
// Every image / video / audio surface flows through these so that
// missing, slow, or broken assets degrade to a branded placeholder
// instead of a broken-image icon or an empty box.
// ============================================================

const ratioClass: Record<MediaRatio, string> = {
  '3x4': 'phw--3x4',
  '4x5': 'phw--4x5',
  '2x3': 'phw--2x3',
  '1x1': 'phw--1x1',
  '16x9': 'phw--16x9',
  '21x9': 'phw--21x9',
};

/** The H2C monogram placeholder — used whenever no image resolves. */
function Placeholder({ label }: { label?: string }) {
  return (
    <span className="ph-fallback" aria-hidden="true">
      <span className="ph-mark">
        H<i>2</i>C
      </span>
      {label && <span className="ph-note">{label}</span>}
    </span>
  );
}

/**
 * Image with a shimmer while loading and a branded fallback on
 * error or when `src` is absent. Drop-in for any photo well.
 */
export function SmartImage({
  src,
  alt = '',
  ratio = '4x5',
  warm = true,
  caption,
  fallbackLabel,
  className,
  plain,
}: {
  src?: string;
  alt?: string;
  ratio?: MediaRatio;
  warm?: boolean;
  caption?: string;
  fallbackLabel?: string;
  className?: string;
  plain?: boolean;
}) {
  const [state, setState] = useState<'load' | 'ok' | 'err'>(src ? 'load' : 'err');

  return (
    <div
      className={cn(
        'phw',
        ratioClass[ratio],
        warm && 'phw--warm',
        plain && 'phw--plain',
        className
      )}
    >
      {state !== 'err' && src ? (
        <img
          className="ph"
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setState('ok')}
          onError={() => setState('err')}
          style={{ opacity: state === 'ok' ? 1 : 0 }}
        />
      ) : (
        <Placeholder label={fallbackLabel} />
      )}
      {state === 'load' && <span className="sk sk--fill" aria-hidden="true" />}
      {caption && <span className="phw-cap">{caption}</span>}
    </div>
  );
}

const PlayGlyph = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M8 5v14l11-7z" />
  </svg>
);

function youTubeId(src: string): string | null {
  if (/^[\w-]{11}$/.test(src)) return src;
  const m = src.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/);
  return m ? m[1] : null;
}
function vimeoId(src: string): string | null {
  const m = src.match(/(?:vimeo\.com\/)(\d+)/);
  return m ? m[1] : (/^\d+$/.test(src) ? src : null);
}

/**
 * Video with a click-to-load facade (fast + privacy-friendly).
 * - youtube / vimeo → embed on play
 * - file            → native <video> on play
 * - no src          → poster with a "coming soon" badge, not playable
 */
export function VideoPlayer({
  asset,
  ratio,
  label = 'Watch',
  className,
}: {
  asset?: MediaAsset;
  ratio?: MediaRatio;
  label?: string;
  className?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const r = ratio ?? asset?.ratio ?? '16x9';
  const src = asset?.src?.trim();
  const hasVideo = Boolean(src);

  let embed: string | null = null;
  if (hasVideo && src) {
    if (asset?.provider === 'youtube' || youTubeId(src)) {
      const id = youTubeId(src);
      embed = id ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0` : null;
    } else if (asset?.provider === 'vimeo' || vimeoId(src)) {
      const id = vimeoId(src);
      embed = id ? `https://player.vimeo.com/video/${id}?autoplay=1` : null;
    }
  }

  if (playing && hasVideo) {
    return (
      <div className={cn('phw', ratioClass[r], className)}>
        {embed ? (
          <iframe
            className="video-frame"
            src={embed}
            title={asset?.alt ?? 'Video'}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video className="video-frame" src={src} poster={asset?.poster} controls autoPlay />
        )}
      </div>
    );
  }

  return (
    <div className={cn('phw', ratioClass[r], 'phw--warm', className)}>
      {asset?.poster ? (
        <img className="ph" src={asset.poster} alt={asset.alt ?? ''} loading="lazy" />
      ) : (
        <Placeholder />
      )}
      {hasVideo ? (
        <button className="play" aria-label={label} onClick={() => setPlaying(true)}>
          <span className="play-ring">
            <PlayGlyph />
          </span>
          <span className="play-label">
            {label}
            {asset?.duration ? ` · ${asset.duration}` : ''}
          </span>
        </button>
      ) : (
        <span className="play play--soon" aria-hidden="true">
          <span className="play-label">Coming soon</span>
        </span>
      )}
    </div>
  );
}

/**
 * Audio with a compact branded shell. When no `src` is present it
 * shows an unobtrusive "not available yet" note rather than an
 * empty control.
 */
export function AudioPlayer({ asset, title }: { asset?: MediaAsset; title?: string }) {
  const src = asset?.src?.trim();
  return (
    <div className={cn('audio', !src && 'audio--empty')}>
      <span className="audio-glyph" aria-hidden="true">
        {src ? <PlayGlyph /> : <i className="audio-wave" />}
      </span>
      <div className="audio-meta">
        {title && <span className="audio-title">{title}</span>}
        {src ? (
          <audio controls preload="none" src={src} style={{ width: '100%' }}>
            Your browser does not support audio playback.
          </audio>
        ) : (
          <span className="audio-note">
            Audio not available yet{asset?.duration ? ` · ${asset.duration}` : ''}
          </span>
        )}
      </div>
    </div>
  );
}

/** Routes a MediaAsset to the right renderer by kind. */
export function MediaFigure({
  asset,
  ratio,
  className,
}: {
  asset: MediaAsset;
  ratio?: MediaRatio;
  className?: string;
}) {
  if (asset.kind === 'video') return <VideoPlayer asset={asset} ratio={ratio} className={className} />;
  if (asset.kind === 'audio') return <AudioPlayer asset={asset} title={asset.alt} />;
  return (
    <SmartImage
      src={asset.src ?? asset.poster}
      alt={asset.alt}
      ratio={ratio ?? asset.ratio}
      className={className}
    />
  );
}
