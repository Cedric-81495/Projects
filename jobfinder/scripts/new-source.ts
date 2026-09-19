/**
 * Source connector generator.
 *
 *   npm run new-source -- --url https://example.com/careers \
 *                         --search "https://example.com/jobs?q=developer"
 *
 * Inspects what a site actually publishes, then scaffolds a connector matched
 * to the best access method it found. It reports findings; it never invents an
 * endpoint. If nothing permitted is available it writes no connector and says
 * why, so the source can be recorded as unsupported instead.
 *
 * Probe order mirrors docs/ADDING-A-SOURCE.md:
 *   1. official API   2. RSS/Atom   3. public JSON   4. JSON-LD   5. HTML
 */
import 'dotenv/config';
import { mkdir, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import * as cheerio from 'cheerio';
import { getRobots, isAllowed } from '../src/lib/scraping/robots';

const USER_AGENT = process.env.CRAWLER_USER_AGENT ?? 'JobFinderBot/0.1';

interface Findings {
  robotsAllows: boolean | null;
  crawlDelayMs: number | null;
  feeds: string[];
  apiLinks: string[];
  jsonLdJobPostings: number;
  jsonLdSample: Record<string, unknown> | null;
  listingSelectors: string[];
}

async function probe(url: string): Promise<Findings> {
  const origin = new URL(url).origin;
  const rules = await getRobots(origin, USER_AGENT);

  const findings: Findings = {
    robotsAllows: rules ? isAllowed(rules, url) : null,
    crawlDelayMs: rules?.crawlDelayMs ?? null,
    feeds: [], apiLinks: [], jsonLdJobPostings: 0, jsonLdSample: null, listingSelectors: [],
  };

  if (findings.robotsAllows === false) return findings;

  const res = await fetch(url, {
    headers: { 'user-agent': USER_AGENT },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`Page returned HTTP ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  // 2. Feeds the page declares.
  $('link[rel="alternate"]').each((_, el) => {
    const type = ($(el).attr('type') ?? '').toLowerCase();
    const href = $(el).attr('href');
    if (href && /(rss|atom|xml)/.test(type)) findings.feeds.push(new URL(href, url).toString());
  });

  // 3. JSON endpoints the page itself references. Only URLs present in the
  //    markup are reported — nothing is guessed from common path patterns.
  const jsonPattern = /["'](\/[^"']*?(?:api|\.json)[^"']*?)["']/gi;
  const seen = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = jsonPattern.exec(html)) !== null && seen.size < 15) {
    const candidate = new URL(match[1], url).toString();
    if (!seen.has(candidate)) { seen.add(candidate); findings.apiLinks.push(candidate); }
  }

  // 4. Schema.org JobPosting.
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const parsed = JSON.parse($(el).text());
      const nodes = Array.isArray(parsed) ? parsed : [parsed, ...(parsed['@graph'] ?? [])];
      for (const node of nodes) {
        if (node && node['@type'] === 'JobPosting') {
          findings.jsonLdJobPostings += 1;
          findings.jsonLdSample ??= node;
        }
      }
    } catch { /* malformed block, skip */ }
  });

  // 5. Repeated structures that look like a results list.
  const counts = new Map<string, number>();
  $('[class]').each((_, el) => {
    const classes = ($(el).attr('class') ?? '').split(/\s+/);
    for (const c of classes) {
      if (/job|listing|vacancy|position|result|card|posting/i.test(c)) {
        counts.set(c, (counts.get(c) ?? 0) + 1);
      }
    }
  });
  findings.listingSelectors = [...counts.entries()]
    .filter(([, n]) => n >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([c, n]) => `.${c} (${n} matches)`);

  return findings;
}

function recommend(f: Findings): { method: string; reason: string } {
  if (f.robotsAllows === false) {
    return { method: 'unsupported', reason: 'robots.txt disallows this path for our user agent.' };
  }
  if (f.apiLinks.length) {
    return { method: 'json_endpoint', reason: 'The page loads listings from a JSON endpoint it references itself.' };
  }
  if (f.feeds.length) {
    return { method: 'rss', reason: 'The site publishes a feed, which is the lightest way to read it.' };
  }
  if (f.jsonLdJobPostings > 0) {
    return { method: 'structured_data', reason: 'Pages embed schema.org JobPosting JSON-LD.' };
  }
  if (f.listingSelectors.length) {
    return { method: 'html', reason: 'No feed or JSON found; the listing markup is repetitive enough to parse.' };
  }
  return { method: 'unsupported', reason: 'Nothing parseable was found without executing the page\'s JavaScript.' };
}

function scaffold(id: string, name: string, homepage: string, method: string, notes: string) {
  return `import { normalizeParsedJob, passthroughFetch } from '../base';
import type { JobRef, JobSourceConnector, ParsedJob, RawJob, SourceContext } from '../types';

/**
 * ${name}
 * Access method: ${method}
 * ${notes}
 *
 * TODO before enabling:
 *  - fill in discoverJobs() against the endpoint the probe reported
 *  - map every field in parseJob(); leave a field null rather than guessing
 *  - never set postedAtRaw unless the source publishes a real posting date
 */
interface Payload { /* the source's own job shape */ }

export const ${id}Connector: JobSourceConnector<Payload> = {
  id: '${id}',
  name: '${name}',
  homepage: '${homepage}',
  accessMethod: '${method}',
  accessNotes: ${JSON.stringify(notes)},

  async discoverJobs(ctx: SourceContext): Promise<JobRef<Payload>[]> {
    const refs: JobRef<Payload>[] = [];
    // while (ctx.session.hasPageBudget()) {
    //   const body = await ctx.session.fetchJson<unknown>(url);
    //   ctx.session.countPage();
    //   ...validate with zod, then push refs
    // }
    ctx.log(\`Discovered \${refs.length} jobs\`);
    return refs;
  },

  fetchJob(ref, ctx): Promise<RawJob<Payload>> {
    return passthroughFetch(ref, ctx);
  },

  parseJob(raw: RawJob<Payload>): ParsedJob {
    throw new Error('parseJob not implemented for ${id}');
  },

  normalizeJob(parsed) {
    return normalizeParsedJob('${id}', parsed);
  },
};
`;
}

async function main() {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : undefined;
  };

  const url = get('--url') ?? get('--search');
  if (!url) {
    console.error('Usage: npm run new-source -- --url <listing page URL> [--id <slug>]');
    process.exit(1);
  }

  const homepage = new URL(url).origin;
  const id = get('--id') ?? new URL(url).hostname.replace(/^www\./, '').split('.')[0];
  const name = get('--name') ?? id.charAt(0).toUpperCase() + id.slice(1);

  console.log(`Probing ${url}\n`);
  const findings = await probe(url);
  const { method, reason } = recommend(findings);

  console.log(`robots.txt allows this path : ${findings.robotsAllows ?? 'could not be read'}`);
  if (findings.crawlDelayMs) console.log(`crawl-delay                 : ${findings.crawlDelayMs}ms`);
  console.log(`feeds declared              : ${findings.feeds.length || 'none'}`);
  findings.feeds.forEach((f) => console.log(`   ${f}`));
  console.log(`JSON endpoints referenced   : ${findings.apiLinks.length || 'none'}`);
  findings.apiLinks.slice(0, 8).forEach((a) => console.log(`   ${a}`));
  console.log(`schema.org JobPosting blocks: ${findings.jsonLdJobPostings}`);
  findings.listingSelectors.forEach((s) => console.log(`   repeated class ${s}`));
  console.log(`\nRecommended access method   : ${method}\n   ${reason}\n`);

  if (method === 'unsupported') {
    console.log('No permitted automated access was found. Record this source as');
    console.log("access_method = 'unsupported' and leave it disabled. No connector written.");
    return;
  }

  const dir = join('src', 'lib', 'sources', id);
  try {
    await access(dir);
    console.log(`${dir} already exists; not overwriting it.`);
    return;
  } catch { /* does not exist, good */ }

  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'index.ts'), scaffold(id, name, homepage, method, reason), 'utf8');
  await writeFile(join(dir, 'types.ts'),
    `import { z } from 'zod';\n\n// Describe the source's own response shape here, then use\n// safeParse() in discoverJobs so a format change is caught, not stored.\nexport const ${id}JobSchema = z.object({});\n`, 'utf8');
  await writeFile(join(dir, 'parser.ts'),
    `import type { ParsedJob } from '../types';\n\n// Field extraction for ${name}. Site-specific selectors and regexes live\n// here; shared vocabulary lives in src/lib/jobs/normalize.ts.\n`, 'utf8');

  console.log(`Wrote ${dir}/{index,types,parser}.ts`);
  console.log('\nNext:');
  console.log(`  1. implement discoverJobs/parseJob in ${dir}`);
  console.log(`  2. register it in src/lib/sources/registry.ts`);
  console.log(`  3. insert a row in the sources table with access_method = '${method}'`);
  console.log(`  4. npm run collect -- ${id}`);
}

main().catch((error) => {
  console.error(`Probe failed: ${(error as Error).message}`);
  process.exit(1);
});
