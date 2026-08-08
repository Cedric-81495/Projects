/**
 * Inline icon set. Ported from the reference build so stroke weight and joins
 * match the type. Icons are inline SVG rather than a font or a package: five
 * paths do not justify a dependency, and inline paths inherit currentColor.
 */
import type { JSX } from 'react';

export type IconName =
  | 'like'
  | 'save'
  | 'vote'
  | 'notify'
  | 'share'
  | 'arrow'
  | 'play'
  | 'close'
  | 'menu'
  | 'plus'
  | 'check'
  | 'eye'
  | 'eye-off'
  | 'youtube'
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'spotify';

const PATHS: Record<IconName, JSX.Element> = {
  like: <path d="M12 20s-7-4.3-7-9.2A4 4 0 0 1 12 8a4 4 0 0 1 7 2.8C19 15.7 12 20 12 20Z" />,
  save: <path d="M6 4h12v16l-6-4.2L6 20V4Z" />,
  vote: (
    <>
      <path d="M7 11v9H4v-9h3Z" />
      <path d="M7 11l4-7a2 2 0 0 1 3 1.6V9h4.3a2 2 0 0 1 2 2.4l-1.2 6A2 2 0 0 1 17 19H7" />
    </>
  ),
  notify: (
    <>
      <path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" />
      <path d="M10.5 20a1.8 1.8 0 0 0 3 0" />
    </>
  ),
  share: (
    <>
      <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
      <path d="M12 16V4" />
      <path d="m8 8 4-4 4 4" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  play: <path d="M8 5v14l11-7L8 5Z" />,
  close: (
    <>
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </>
  ),
  menu: (
    <>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  check: <path d="m5 13 4 4L19 7" />,
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3.2" />
    </>
  ),
  'eye-off': (
    <>
      <path d="M10.6 6.7A8.6 8.6 0 0 1 12 6.6c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-3 3.7" />
      <path d="M6.3 7.9A15.9 15.9 0 0 0 2.5 13s3.5 6.5 9.5 6.5a8.9 8.9 0 0 0 3.9-.9" />
      <path d="M9.9 10.2a3.2 3.2 0 0 0 4.3 4.5" />
      <path d="M4 3.5 20.5 20" />
    </>
  ),
  youtube: (
    <>
      <path d="M2.5 8.2a3 3 0 0 1 2.4-2.5C7 5.3 12 5.3 12 5.3s5 0 7.1.4a3 3 0 0 1 2.4 2.5c.3 1.6.3 3.8.3 3.8s0 2.2-.3 3.8a3 3 0 0 1-2.4 2.5c-2.1.4-7.1.4-7.1.4s-5 0-7.1-.4a3 3 0 0 1-2.4-2.5C2.2 14.2 2.2 12 2.2 12s0-2.2.3-3.8Z" />
      <path d="m10 15 5-3-5-3v6Z" />
    </>
  ),
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17.5 6.6h.01" />
    </>
  ),
  facebook: <path d="M14.5 8.5h2V5.6h-2.3c-2.2 0-3.4 1.3-3.4 3.5v1.6H9v3h1.8V21h3.1v-7.3h2.2l.4-3h-2.6V9.4c0-.6.2-.9.6-.9Z" />,
  tiktok: (
    <>
      <path d="M15 4c.3 2 1.6 3.4 3.6 3.6v2.7c-1.4.1-2.6-.3-3.6-1v5.4a5.2 5.2 0 1 1-5.2-5.2c.3 0 .6 0 .9.1v2.8a2.4 2.4 0 1 0 1.6 2.3V4H15Z" />
    </>
  ),
  spotify: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M7.6 9.6c2.8-.7 6-.4 8.5 1" />
      <path d="M8.2 12.6c2.3-.6 4.8-.3 6.8.8" />
      <path d="M8.8 15.4c1.8-.4 3.7-.2 5.3.7" />
    </>
  ),
};

interface IconProps {
  name: IconName;
  className?: string;
  /** Filled icons (play, facebook) need no stroke. */
  filled?: boolean;
}

export function Icon({ name, className, filled = false }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className={className}
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {PATHS[name]}
    </svg>
  );
}
