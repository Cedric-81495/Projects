/**
 * Typed access to environment configuration.
 *
 * Deliberately never throws. An earlier version treated a missing API URL as
 * fatal, which white-screened the whole site — including every page that
 * renders entirely from CMS content and needs no API at all. The public site's
 * job is to tell the story; losing the engagement endpoints must degrade a few
 * buttons, not the movement.
 *
 * Misconfiguration is surfaced loudly in development instead, where someone can
 * act on it.
 */

export type ApparelMode = 'showcase' | 'preorder' | 'commerce';

/** Same-origin default, so a reverse proxy works with no configuration. */
const DEFAULT_API_BASE_URL = '/api/v1';

function optional(key: string, fallback: string): string {
  const value = import.meta.env[key as keyof ImportMetaEnv] as string | undefined;
  if (!value) {
    if (import.meta.env.DEV) {
      console.warn(
        `[config] ${key} is not set. Falling back to "${fallback}". ` +
          'Copy .env.example to .env.local to set it.'
      );
    }
    return fallback;
  }
  return value;
}

function flag(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value === 'true';
}

const rawApparelMode = import.meta.env.VITE_APPAREL_MODE ?? 'showcase';
const isValidMode = (['showcase', 'preorder', 'commerce'] as const).includes(
  rawApparelMode as ApparelMode
);

export const env = {
  apiBaseUrl: optional('VITE_API_BASE_URL', DEFAULT_API_BASE_URL),
  /**
   * Absolute site origin. Must not read window: this module is imported during
   * the prerender build, where there is no window and touching it crashes the
   * whole build. Configure VITE_SITE_URL per environment.
   */
  siteUrl:
    import.meta.env.VITE_SITE_URL ??
    (typeof window === 'undefined' ? 'https://handcuffs2cufflinks.com' : window.location.origin),
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '',
  /**
   * Cloudinary cloud name. Public by design — it appears in every delivery URL.
   * Only needed for assets stored as a bare public id; full addresses coming
   * out of the media library carry the cloud name themselves.
   */
  cloudinaryCloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ?? '',
  youtubeChannelId: import.meta.env.VITE_YOUTUBE_CHANNEL_ID ?? '',
  isProduction: import.meta.env.PROD,

  /**
   * Showcase -> Preorder -> Commerce.
   *
   * Apparel stays non-transactional until the client approves otherwise. This
   * flag is the only switch that changes it, and an unrecognised value falls
   * back to showcase — the safe direction, since the failure mode of guessing
   * wrong is an unapproved storefront.
   */
  apparelMode: (isValidMode ? rawApparelMode : 'showcase') as ApparelMode,

  features: {
    communitySubmissions: flag(import.meta.env.VITE_ENABLE_COMMUNITY_SUBMISSIONS, true),
    donations: flag(import.meta.env.VITE_ENABLE_DONATIONS, false),
  },
} as const;

export const canPurchaseApparel = env.apparelMode === 'commerce';
export const canPreorderApparel = env.apparelMode !== 'showcase';
