import { env } from '@/config/env';
import { BRAND, ECOSYSTEM, SOCIAL_LINKS } from '@/config/site';

/**
 * Structured data.
 *
 * Note what is deliberately absent: Product schema for apparel. Declaring a
 * Product without price or availability produces Search Console errors, and
 * more importantly it would tell Google this is a store — contradicting the
 * showcase requirement. Product schema goes in when apparel mode reaches
 * commerce, not before.
 */

export function organizationGraph(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: BRAND.name,
    alternateName: BRAND.shortName,
    url: env.siteUrl,
    logo: `${env.siteUrl}/media/logo.png`,
    slogan: BRAND.tagline,
    description: BRAND.valueProposition,
    address: { '@type': 'PostalAddress', addressLocality: 'Boston', addressRegion: 'MA', addressCountry: 'US' },
    sameAs: SOCIAL_LINKS.filter((s) => s.url !== '#').map((s) => s.url),
    subOrganization: [
      { '@type': 'Organization', name: ECOSYSTEM.gwop.name, description: ECOSYSTEM.gwop.description },
      { '@type': 'Organization', name: ECOSYSTEM.kitchen.name, description: ECOSYSTEM.kitchen.description },
    ],
  };
}

export function videoGraph(input: {
  name: string;
  description: string;
  thumbnailUrl?: string;
  uploadDate?: string;
  durationMinutes?: number;
  embedUrl?: string;
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: input.name,
    description: input.description,
    thumbnailUrl: input.thumbnailUrl ?? `${env.siteUrl}/media/hero.jpg`,
    ...(input.uploadDate ? { uploadDate: input.uploadDate } : {}),
    ...(input.durationMinutes ? { duration: `PT${input.durationMinutes}M` } : {}),
    ...(input.embedUrl ? { embedUrl: input.embedUrl } : {}),
    publisher: { '@type': 'Organization', name: BRAND.name },
  };
}

export function breadcrumbGraph(trail: { label: string; path: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.label,
      item: `${env.siteUrl}${crumb.path}`,
    })),
  };
}
