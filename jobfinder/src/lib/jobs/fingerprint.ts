import { createHash } from 'node:crypto';

const NOISE_WORDS = [
  'senior', 'sr', 'junior', 'jr', 'lead', 'staff', 'principal',
  'i', 'ii', 'iii', 'iv', 'remote', 'hybrid', 'onsite', 'on-site',
  'm/w/d', 'f/m/d', 'm/f/d', 'all genders', 'h/f', 'w/m/d',
];

/** Lowercases, strips punctuation and gendered job-title suffixes. */
export function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\((m|w|f|d|x)[\/|](m|w|f|d|x)([\/|](m|w|f|d|x))?\)/g, ' ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function companySlug(name: string): string {
  return normalizeText(name)
    .replace(/\b(gmbh|ag|inc|llc|ltd|limited|corp|corporation|co|bv|nv|sa|sas|srl|plc|holding|group)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/ /g, '-') || 'unknown';
}

/** Title with seniority/format noise removed, so the same role matches across boards. */
export function coreTitle(title: string): string {
  const words = normalizeText(title).split(' ').filter((w) => w && !NOISE_WORDS.includes(w));
  return words.join(' ') || normalizeText(title);
}

export function coreLocation(location: string | null): string {
  if (!location) return '';
  const first = location.split(/[;,|]/)[0] ?? location;
  return normalizeText(first);
}

/**
 * Stable hash of (company, role, location). Two postings of the same job on
 * different boards produce the same fingerprint.
 */
export function jobFingerprint(input: {
  companyName: string;
  title: string;
  locationRaw: string | null;
}): string {
  const key = [companySlug(input.companyName), coreTitle(input.title), coreLocation(input.locationRaw)].join('|');
  return createHash('sha256').update(key).digest('hex').slice(0, 32);
}

const TRACKING_PARAMS = /^(utm_|gh_src|ref|source|src|gclid|fbclid|mc_cid|mc_eid|trk|lever-origin)/i;

/** Strips tracking params so the same posting URL compares equal across sources. */
export function canonicalUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    const keep = new URLSearchParams();
    parsed.searchParams.forEach((value, key) => {
      if (!TRACKING_PARAMS.test(key)) keep.append(key, value);
    });
    parsed.search = keep.toString();
    parsed.hostname = parsed.hostname.replace(/^www\./, '');
    let out = parsed.toString();
    if (out.endsWith('/')) out = out.slice(0, -1);
    return out;
  } catch {
    return url;
  }
}
