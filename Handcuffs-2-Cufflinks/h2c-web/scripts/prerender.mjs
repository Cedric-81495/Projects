/**
 * Prerender build step.
 *
 * Renders each route to a static HTML file so crawlers and social unfurlers —
 * none of which run JavaScript — see real titles, descriptions, and OG images.
 * Visitors get the same file as a fast first paint, then the app hydrates and
 * refetches from the API, which is why a VA's edit appears without a rebuild.
 *
 * Run after the client and SSR builds:
 *   vite build && vite build --ssr … && node scripts/prerender.mjs
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const dist = join(root, 'dist');

const SITE_URL = (process.env.VITE_SITE_URL ?? 'https://handcuffs2cufflinks.com').replace(/\/$/, '');
const API_BASE_URL = process.env.VITE_API_BASE_URL ?? '';

/**
 * Staging and preview deployments must never be indexed, or they compete with
 * production and can expose unpublished stories. Production must never carry
 * the flag, or the real site gets delisted. Driven by env, never hardcoded.
 */
const NO_INDEX = process.env.SEO_NOINDEX === 'true';

const escapeHtml = (value) =>
  String(value).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/** Builds the <head> block for one page from the metadata Seo collected. */
function headTags(head, routePath) {
  const canonical = `${SITE_URL}${head?.canonicalPath ?? routePath}`;
  const title = head?.title ?? 'Handcuffs 2 Cufflinks — From Struggle to Success';
  const description =
    head?.description ??
    'A global movement celebrating transformation. Storytelling, apparel, music, and media that turn struggle into success.';
  // Absolute image URLs are re-based onto SITE_URL. The client bundle inlines
  // its own VITE_SITE_URL at build time, so without this a production build run
  // on a machine with a local .env would ship og:image pointing at localhost —
  // which silently breaks every social preview.
  const rawImage = head?.ogImage ?? `${SITE_URL}/media/hero.jpg`;
  const image = rawImage.replace(/^https?:\/\/[^/]+/, SITE_URL);
  const robots = NO_INDEX || head?.noIndex ? 'noindex,nofollow' : 'index,follow';

  const tags = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<meta name="robots" content="${robots}" />`,
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="Handcuffs 2 Cufflinks" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:image" content="${escapeHtml(image)}" />`,
    `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(image)}" />`,
  ];

  for (const graph of head?.jsonLd ?? []) {
    // </script> inside JSON would close the tag early.
    const json = JSON.stringify(graph).replace(/</g, '\\u003c');
    tags.push(`<script type="application/ld+json">${json}</script>`);
  }

  return tags.join('\n    ');
}

/**
 * Replaces the placeholder head from index.html with per-page tags. The template
 * ships generic values so the dev server and any un-prerendered route still
 * unfurl acceptably; here they are swapped for the real ones.
 */
function injectHead(template, block) {
  let out = template
    .replace(/<title>[\s\S]*?<\/title>\s*/i, '')
    .replace(/<meta\s+name="description"[^>]*>\s*/gi, '')
    .replace(/<meta\s+property="og:[^"]*"[^>]*>\s*/gi, '')
    .replace(/<meta\s+name="twitter:[^"]*"[^>]*>\s*/gi, '')
    .replace(/<link\s+rel="canonical"[^>]*>\s*/gi, '')
    .replace(/<meta\s+name="robots"[^>]*>\s*/gi, '');
  return out.replace('</head>', `    ${block}\n  </head>`);
}

/** Detail-page slugs from the CMS. Skipped when the API is unreachable. */
async function fetchDynamicRoutes(sources) {
  if (!API_BASE_URL || !/^https?:\/\//.test(API_BASE_URL)) {
    console.log('  · no absolute VITE_API_BASE_URL — skipping dynamic routes');
    return [];
  }

  const found = [];
  for (const source of sources) {
    try {
      const response = await fetch(`${API_BASE_URL}${source.endpoint}`, {
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      const items = payload?.data ?? payload ?? [];
      for (const item of items) {
        if (item?.slug) {
          found.push({
            path: `${source.base}/${item.slug}`,
            priority: source.priority,
            changefreq: source.changefreq,
          });
        }
      }
    } catch (error) {
      // A missing endpoint must not fail the build. Those URLs still work as
      // client-rendered pages; only their unfurl metadata waits for the API.
      console.log(`  · ${source.endpoint} unavailable (${error.message}) — skipped`);
    }
  }
  return found;
}

function sitemap(routes) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = routes
    .filter((r) => !r.unlisted)
    .map(
      (r) =>
        `  <url>\n    <loc>${SITE_URL}${r.path === '/' ? '/' : r.path}</loc>\n` +
        `    <lastmod>${today}</lastmod>\n    <changefreq>${r.changefreq}</changefreq>\n` +
        `    <priority>${r.priority.toFixed(1)}</priority>\n  </url>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function robots() {
  if (NO_INDEX) {
    return `# Non-production deployment. Indexing is disabled deliberately.\nUser-agent: *\nDisallow: /\n`;
  }
  return (
    `User-agent: *\nAllow: /\n\n` +
    `# The CMS is private and holds unpublished content.\nDisallow: /admin\n\n` +
    `Sitemap: ${SITE_URL}/sitemap.xml\n`
  );
}

async function main() {
  const template = await readFile(join(dist, 'index.html'), 'utf8');
  const { render, PRERENDER_ROUTES, DYNAMIC_ROUTE_SOURCES } = await import(
    join(root, 'dist-server', 'entry-server.js')
  );

  const routes = [...PRERENDER_ROUTES, ...(await fetchDynamicRoutes(DYNAMIC_ROUTE_SOURCES))];

  console.log(`\nPrerendering ${routes.length} routes → dist/`);
  if (NO_INDEX) console.log('  ! SEO_NOINDEX is on: this build will not be indexed\n');

  let failures = 0;
  for (const route of routes) {
    try {
      const { html, head } = await render(route.path);
      const page = injectHead(template, headTags(head, route.path)).replace(
        '<div id="root"></div>',
        `<div id="root">${html}</div>`
      );

      const outPath =
        route.path === '/' ? join(dist, 'index.html') : join(dist, route.path, 'index.html');
      await mkdir(dirname(outPath), { recursive: true });
      await writeFile(outPath, page);
      console.log(`  ✓ ${route.path.padEnd(34)} ${(head?.title ?? '(no title)').slice(0, 44)}`);
    } catch (error) {
      failures += 1;
      console.error(`  ✗ ${route.path} — ${error.message}`);
    }
  }

  /**
   * Fallback shell for any URL without a prerendered file — client-side
   * redirects (/shop), the CMS, and genuine 404s.
   *
   * This must NOT be the prerendered homepage. Vercel rewrites unmatched paths
   * to a single file, and if that file carried homepage markup, React would try
   * to hydrate a 404 into it and throw a mismatch on every such URL. An empty
   * shell has nothing to disagree with.
   *
   * noindex because these resolve to soft 404s and redirects, which should not
   * be indexed.
   */
  const shellHead = [
    '<title>Handcuffs 2 Cufflinks — From Struggle to Success</title>',
    '<meta name="robots" content="noindex,follow" />',
  ].join('\n    ');
  await writeFile(join(dist, 'app.html'), injectHead(template, shellHead));
  console.log('  ✓ app.html (fallback shell)');

  await writeFile(join(dist, 'sitemap.xml'), sitemap(routes));
  await writeFile(join(dist, 'robots.txt'), robots());
  console.log(`\n  ✓ sitemap.xml (${routes.filter((r) => !r.unlisted).length} urls)\n  ✓ robots.txt`);

  if (failures > 0) {
    console.error(`\n${failures} route(s) failed to prerender.`);
    process.exit(1);
  }
  console.log('\nPrerender complete.\n');
}

main().catch((error) => {
  console.error('\nPrerender failed:\n', error);
  process.exit(1);
});
