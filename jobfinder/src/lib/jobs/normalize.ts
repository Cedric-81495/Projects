import type { EmploymentType, WorkArrangement } from '@/types';

/**
 * Shared normalizers. Connectors call these so that "Full Time", "fulltime
 * permanent", "CDI" and "Vollzeit" all land on the same enum value.
 */

const EMPLOYMENT_PATTERNS: Array<[RegExp, EmploymentType]> = [
  [/\b(intern(ship)?|praktikum|working student|werkstudent|trainee|apprentice|ausbildung)\b/i, 'internship'],
  [/\b(part[\s-]?time|teilzeit|minijob)\b/i, 'part_time'],
  [/\b(temporary|temp|seasonal|befristet|fixed[\s-]?term)\b/i, 'temporary'],
  [/\b(contract|contractor|freelance|freiberuflich|b2b|consultant)\b/i, 'contract'],
  [/\b(hourly|per hour|stundenlohn)\b/i, 'hourly'],
  [/\b(full[\s-]?time|fulltime|vollzeit|permanent|festanstellung|unbefristet)\b/i, 'full_time'],
];

export function toEmploymentType(...candidates: Array<string | null | undefined>): EmploymentType {
  const haystack = candidates.filter(Boolean).join(' ');
  if (!haystack) return 'other';
  for (const [pattern, value] of EMPLOYMENT_PATTERNS) {
    if (pattern.test(haystack)) return value;
  }
  return 'other';
}

export function toWorkArrangement(opts: {
  remoteFlag?: boolean | null;
  location?: string | null;
  text?: string | null;
}): WorkArrangement {
  const haystack = [opts.location, opts.text].filter(Boolean).join(' ');
  if (/\bhybrid\b/i.test(haystack)) return 'hybrid';
  if (opts.remoteFlag === true) return 'remote';
  if (/\b(fully remote|100% remote|remote[\s-]?(first|only)?|work from home|telecommute|homeoffice|home office)\b/i.test(haystack)) {
    return 'remote';
  }
  if (/\b(on[\s-]?site|in[\s-]?office|vor ort|100% on[\s-]?site)\b/i.test(haystack)) return 'onsite';
  if (opts.remoteFlag === false && opts.location) return 'onsite';
  return 'unknown';
}

/**
 * Splits a free-text location. Deliberately conservative: it only claims a
 * country when it recognises one, and keeps the original string either way.
 */
const COUNTRY_ALIASES: Record<string, string> = {
  deutschland: 'Germany', germany: 'Germany', de: 'Germany',
  'united kingdom': 'United Kingdom', uk: 'United Kingdom', england: 'United Kingdom',
  'united states': 'United States', usa: 'United States', us: 'United States',
  philippines: 'Philippines', ph: 'Philippines',
  canada: 'Canada', australia: 'Australia', india: 'India', singapore: 'Singapore',
  ireland: 'Ireland', netherlands: 'Netherlands', spain: 'Spain', france: 'France',
  poland: 'Poland', portugal: 'Portugal', austria: 'Austria', switzerland: 'Switzerland',
  schweiz: 'Switzerland', osterreich: 'Austria', 'österreich': 'Austria',
};

const GERMAN_STATES = new Set([
  'bayern', 'bavaria', 'berlin', 'hesse', 'hessen', 'lower saxony', 'niedersachsen',
  'saxony', 'sachsen', 'hamburg', 'bremen', 'brandenburg', 'thuringia', 'thüringen',
  'north rhine-westphalia', 'nordrhein-westfalen', 'baden-württemberg', 'saarland',
]);

export interface ParsedLocation {
  raw: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
}

export function parseLocation(
  raw: string | null | undefined,
  fallbackCountry: string | null = null,
): ParsedLocation {
  if (!raw || !raw.trim()) {
    return { raw: null, city: null, region: null, country: fallbackCountry };
  }
  const cleaned = raw.replace(/\s+/g, ' ').trim();

  // Multi-location strings ("Berlin, Berlin; Munich, Bavaria") — use the first.
  const primary = cleaned.split(';')[0].trim();
  const parts = primary.split(',').map((p) => p.trim()).filter(Boolean);

  let country: string | null = null;
  let region: string | null = null;
  let city: string | null = null;

  for (let i = parts.length - 1; i >= 0; i--) {
    const key = parts[i].toLowerCase();
    if (!country && COUNTRY_ALIASES[key]) { country = COUNTRY_ALIASES[key]; continue; }
    if (!region && (GERMAN_STATES.has(key) || (parts.length > 1 && i > 0))) { region = parts[i]; continue; }
    if (!city) city = parts[i];
  }

  if (!city && parts.length) city = parts[0];
  // A single-part location that names a country is a country, not a city.
  if (city && COUNTRY_ALIASES[city.toLowerCase()]) city = null;
  // "Remote", "Remote - EU", "Remote (US)" describe an arrangement, not a place.
  if (city && /^(remote|anywhere|worldwide|global|distributed)\b/i.test(city)) city = null;

  return {
    raw: cleaned,
    city,
    region,
    country: country ?? fallbackCountry,
  };
}

const SKILL_VOCABULARY = [
  'javascript', 'typescript', 'python', 'java', 'kotlin', 'swift', 'go', 'golang', 'rust',
  'ruby', 'php', 'c#', 'c++', 'scala', 'elixir', 'react', 'vue', 'angular', 'svelte',
  'next.js', 'node.js', 'django', 'flask', 'rails', 'laravel', 'spring', '.net',
  'postgresql', 'mysql', 'mongodb', 'redis', 'clickhouse', 'elasticsearch', 'graphql',
  'aws', 'gcp', 'azure', 'docker', 'kubernetes', 'terraform', 'ansible', 'jenkins',
  'ci/cd', 'sql', 'excel', 'tableau', 'power bi', 'salesforce', 'hubspot', 'sap',
  'figma', 'seo', 'zendesk', 'jira', 'linux', 'git', 'rest', 'microservices',
];

/** Extracts known skills. Whole-word matching only, so "gone" never yields "go". */
export function extractSkills(text: string | null, extra: string[] = []): string[] {
  const found = new Set<string>();
  for (const tag of extra) {
    const t = tag.trim();
    if (t && t.length <= 60) found.add(t);
  }
  if (text) {
    const haystack = text.toLowerCase();
    for (const skill of SKILL_VOCABULARY) {
      const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (new RegExp(`(^|[^a-z0-9+#.])${escaped}([^a-z0-9+#.]|$)`, 'i').test(haystack)) {
        found.add(skill);
      }
    }
  }
  return [...found].slice(0, 30);
}

export function toDateOrNull(value: unknown): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'number') {
    // Heuristic: seconds vs milliseconds since epoch.
    const ms = value < 100_000_000_000 ? value * 1000 : value;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === 'string' && value.trim()) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}
