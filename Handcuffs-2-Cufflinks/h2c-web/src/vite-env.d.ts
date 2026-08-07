/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_SITE_URL?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_YOUTUBE_CHANNEL_ID?: string;
  readonly VITE_APPAREL_MODE?: 'showcase' | 'preorder' | 'commerce';
  readonly VITE_ENABLE_COMMUNITY_SUBMISSIONS?: string;
  readonly VITE_ENABLE_DONATIONS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
