/**
 * Minimal robots.txt reader. Not a full RFC 9309 implementation — it covers
 * User-agent / Disallow / Allow / Crawl-delay, which is what public job pages
 * use. When robots.txt cannot be fetched we fail closed for HTML sources.
 */
export interface RobotsRules {
  disallow: string[];
  allow: string[];
  crawlDelayMs: number | null;
}

const cache = new Map<string, { rules: RobotsRules; fetchedAt: number }>();
const TTL_MS = 60 * 60 * 1000;

export function parseRobots(body: string, userAgent: string): RobotsRules {
  const token = userAgent.split('/')[0].toLowerCase();
  const groups: Array<{ agents: string[]; rules: RobotsRules }> = [];
  let current: { agents: string[]; rules: RobotsRules } | null = null;
  let lastLineWasAgent = false;

  for (const line of body.split(/\r?\n/)) {
    const clean = line.split('#')[0].trim();
    if (!clean) continue;
    const idx = clean.indexOf(':');
    if (idx === -1) continue;
    const field = clean.slice(0, idx).trim().toLowerCase();
    const value = clean.slice(idx + 1).trim();

    if (field === 'user-agent') {
      if (!current || !lastLineWasAgent) {
        current = { agents: [], rules: { disallow: [], allow: [], crawlDelayMs: null } };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastLineWasAgent = true;
      continue;
    }
    lastLineWasAgent = false;
    if (!current) continue;
    if (field === 'disallow' && value) current.rules.disallow.push(value);
    else if (field === 'allow' && value) current.rules.allow.push(value);
    else if (field === 'crawl-delay') {
      const seconds = Number(value);
      if (Number.isFinite(seconds)) current.rules.crawlDelayMs = seconds * 1000;
    }
  }

  const specific = groups.find((g) => g.agents.some((a) => a === token || token.includes(a)));
  const wildcard = groups.find((g) => g.agents.includes('*'));
  return specific?.rules ?? wildcard?.rules ?? { disallow: [], allow: [], crawlDelayMs: null };
}

export async function getRobots(origin: string, userAgent: string): Promise<RobotsRules | null> {
  const hit = cache.get(origin);
  if (hit && Date.now() - hit.fetchedAt < TTL_MS) return hit.rules;

  try {
    const res = await fetch(new URL('/robots.txt', origin).toString(), {
      headers: { 'user-agent': userAgent },
      signal: AbortSignal.timeout(10_000),
    });
    // 404 means "no restrictions"; 5xx or a network failure means "unknown".
    if (res.status === 404 || res.status === 410) {
      const rules = { disallow: [], allow: [], crawlDelayMs: null };
      cache.set(origin, { rules, fetchedAt: Date.now() });
      return rules;
    }
    if (!res.ok) return null;
    const rules = parseRobots(await res.text(), userAgent);
    cache.set(origin, { rules, fetchedAt: Date.now() });
    return rules;
  } catch {
    return null;
  }
}

function matches(pattern: string, path: string): boolean {
  // Supports the * wildcard and the $ end-anchor used in practice.
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  const anchored = escaped.endsWith('\\$') ? `^${escaped.slice(0, -2)}$` : `^${escaped}`;
  try { return new RegExp(anchored).test(path); } catch { return false; }
}

export function isAllowed(rules: RobotsRules, url: string): boolean {
  const path = new URL(url).pathname + new URL(url).search;
  const longest = (list: string[]) =>
    list.filter((p) => matches(p, path)).sort((a, b) => b.length - a.length)[0];
  const allow = longest(rules.allow);
  const disallow = longest(rules.disallow);
  if (!disallow) return true;
  if (allow && allow.length >= disallow.length) return true;
  return false;
}
