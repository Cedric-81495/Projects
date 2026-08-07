import { createContext } from 'react';

/**
 * Head metadata contract shared by the client and the prerender build.
 */
export interface HeadTags {
  title: string;
  description: string;
  canonicalPath?: string;
  ogImage?: string;
  noIndex?: boolean;
  /** JSON-LD graph objects emitted as <script type="application/ld+json">. */
  jsonLd?: Record<string, unknown>[];
}

/**
 * During the prerender build a collector is provided, and <Seo> records into it
 * synchronously as it renders. In the browser no collector is provided, so
 * <Seo> falls through to its effect and mutates document.head instead.
 *
 * Recording during render is a side effect React normally discourages, but it
 * is the only point at which the server knows a page's metadata — the same
 * approach react-helmet takes. It is safe here because the collector is a
 * per-request object, never shared across renders.
 */
export interface HeadCollector {
  current: HeadTags | null;
}

export const HeadCollectorContext = createContext<HeadCollector | null>(null);
