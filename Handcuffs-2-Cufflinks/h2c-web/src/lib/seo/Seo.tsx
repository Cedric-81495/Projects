import { useContext, useEffect } from 'react';
import { env } from '@/config/env';
import { BRAND } from '@/config/site';
import { HeadCollectorContext } from './head';
import type { HeadTags } from './head';

type SeoProps = Omit<HeadTags, 'title'> & { title: string };

function resolveTitle(title: string): string {
  return title === BRAND.name ? `${BRAND.name} — ${BRAND.tagline}` : `${title} — ${BRAND.name}`;
}

function upsert(kind: 'meta' | 'link', keyAttr: string, key: string, valueAttr: string, value: string): void {
  const selector = `${kind}[${keyAttr}="${key}"]`;
  let el = document.head.querySelector<HTMLElement>(selector);
  if (!el) {
    el = document.createElement(kind);
    el.setAttribute(keyAttr, key);
    document.head.appendChild(el);
  }
  el.setAttribute(valueAttr, value);
}

/**
 * Per-page document head.
 *
 * Renders nothing. On the server it records into the head collector so the
 * prerender can inline real tags into the HTML — which is the entire reason
 * social platforms can unfurl these pages, since none of them run JavaScript.
 * In the browser it keeps the head in sync as the visitor navigates.
 */
export function Seo(props: SeoProps) {
  const { title, description, canonicalPath, ogImage, noIndex, jsonLd } = props;
  const collector = useContext(HeadCollectorContext);
  const fullTitle = resolveTitle(title);
  const image = ogImage ?? `${env.siteUrl}/media/hero.jpg`;

  if (collector) {
    collector.current = { title: fullTitle, description, canonicalPath, ogImage: image, noIndex, jsonLd };
  }

  useEffect(() => {
    document.title = fullTitle;
    upsert('meta', 'name', 'description', 'content', description);
    upsert('meta', 'property', 'og:title', 'content', fullTitle);
    upsert('meta', 'property', 'og:description', 'content', description);
    upsert('meta', 'property', 'og:image', 'content', image);
    upsert('meta', 'property', 'og:type', 'content', 'website');
    upsert('meta', 'name', 'twitter:card', 'content', 'summary_large_image');
    upsert('meta', 'name', 'robots', 'content', noIndex ? 'noindex,nofollow' : 'index,follow');
    if (canonicalPath) {
      upsert('link', 'rel', 'canonical', 'href', `${env.siteUrl}${canonicalPath}`);
      upsert('meta', 'property', 'og:url', 'content', `${env.siteUrl}${canonicalPath}`);
    }
  }, [fullTitle, description, canonicalPath, image, noIndex]);

  return null;
}
