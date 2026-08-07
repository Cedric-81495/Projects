# Deployment and publishing

## How a VA's edit reaches the site

Two independent paths. Understanding which is which prevents most confusion.

**Path 1 — content freshness (no build).** Pages fetch content from the Express
API at runtime. A moderator publishes, and the change appears on the next page
load. No rebuild, no waiting, nothing to trigger. This is how VAs experience the
site day to day.

**Path 2 — social previews (needs a build).** Facebook, WhatsApp, iMessage,
LinkedIn, and X do not run JavaScript. They read the raw HTML and stop. So each
route is prerendered to a static file carrying real titles, descriptions, and OG
images.

The consequence: an edit to an **existing** page is visible to visitors
immediately, and its unfurl metadata refreshes at the next build. A **brand-new**
page works for visitors immediately too, but until the next build its social
preview falls back to the site defaults.

That is an acceptable gap — nobody shares a URL in the first three minutes of it
existing — and it means the VA never waits on a build.

## Build pipeline

```
npm run build
  ├─ tsc -b                 typecheck
  ├─ vite build             client bundle → dist/
  ├─ vite build --ssr       server bundle → dist-server/
  └─ node scripts/prerender.mjs
       ├─ renders each route → dist/<path>/index.html
       ├─ writes sitemap.xml
       └─ writes robots.txt
```

The prerender also emits `dist/app.html`: an **empty** shell used as the SPA
fallback for URLs with no prerendered file — client-side redirects (`/shop`),
the CMS, and genuine 404s.

`vercel.json` must rewrite unmatched paths to `/app.html`, **not** `/index.html`.
Pointing it at `index.html` serves prerendered homepage markup for those URLs,
and React then throws a hydration mismatch on every one of them. This was a real
bug caught in testing; the rewrite target is load-bearing.

`npm run build:spa` skips prerendering. Useful for a quick check; do not deploy
it, because social previews will be wrong.

## Required environment variables

| Variable | Production | Staging / preview |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Render API URL | Render **staging** API URL |
| `VITE_SITE_URL` | `https://<production-domain>` | `https://<staging-domain>` |
| `SEO_NOINDEX` | **unset** | `true` |

### The two mistakes that cause real damage

1. **`SEO_NOINDEX` unset on staging** → Google indexes staging, it competes
   with production in search, and unpublished stories can leak.
2. **`SEO_NOINDEX=true` on production** → the live site is silently delisted.

Both are one variable. Verify on the live URL before announcing anything:

```bash
curl -s https://<production-domain>/robots.txt                # expect: Allow: /
curl -s https://<production-domain>/ | grep 'name="robots"'   # expect: index,follow
```

A wrong `VITE_SITE_URL` is the third trap: the build inlines it, so a production
build run with a local `.env` present would ship `og:image` pointing at
localhost. The prerender script re-bases image origins onto `VITE_SITE_URL` to
defend against this, but the variable still has to be right.

## Rebuild trigger (for the backend developer)

Prerendered metadata only refreshes on a build, so the API should ping Vercel
when content is published.

1. In Vercel: **Settings → Git → Deploy Hooks**, create a hook, copy the URL.
2. Store it in the backend as `VERCEL_DEPLOY_HOOK_URL`.
3. On successful publish or unpublish, fire it:

```ts
// Fire-and-forget. A failed hook must never fail the publish — the content is
// already live for visitors via the client fetch. Only metadata waits.
async function requestSiteRebuild(): Promise<void> {
  const url = process.env.VERCEL_DEPLOY_HOOK_URL;
  if (!url) return;
  try {
    await fetch(url, { method: 'POST' });
  } catch (error) {
    logger.warn({ error }, 'Site rebuild hook failed; metadata refreshes next build');
  }
}
```

**Debounce it.** A VA publishing six episodes in a row should cause one build,
not six. A 2–5 minute trailing debounce is enough. Vercel also queues and
cancels superseded builds, but debouncing keeps the log readable.

If adding the hook is not possible, schedule a Vercel cron rebuild instead
(hourly is fine). The VA experience is identical either way, because freshness
comes from the client fetch rather than the build.

## Adding detail pages to the prerender

`src/router/manifest.ts` holds the route list. `DYNAMIC_ROUTE_SOURCES` describes
detail routes whose slugs come from the CMS; the prerender script fetches them at
build time and generates a file per slug.

That fetch is deliberately non-fatal. If an endpoint is unreachable the build
logs a skip and continues — those URLs still work as client-rendered pages, and
only their unfurl metadata waits for the API.

## Writing SSR-safe code

The prerender runs the app in Node, where there is no `window`, `document`, or
`localStorage`. Two rules keep it building:

1. **Never touch a browser API during render or at module scope.** Guard with
   `typeof window === 'undefined'`, or move it into `useEffect`, which does not
   run on the server.
2. **Never render differently on the first client pass than the server did.**
   Anything read from `localStorage` must come from `useEffect`. `useLocalStorage`
   already does this and returns a `hydrated` flag for components that would
   otherwise flash.

Hydration mismatches surface as console errors, so the Playwright check catches
them. Run it before merging anything that touches providers or layout.

## Pre-launch checks

- [ ] `robots.txt` and the `robots` meta tag are correct on **production**
- [ ] `sitemap.xml` submitted in Google Search Console
- [ ] Every route in the sitemap returns a prerendered file (`curl` and look for
      real content, not an empty `<div id="root">`)
- [ ] Paste live URLs into the Facebook Sharing Debugger, X Card Validator,
      LinkedIn Post Inspector, and a real WhatsApp thread
- [ ] Google Rich Results Test against the homepage and a docuseries page
- [ ] Deep-link straight to an interior page in a fresh tab
- [ ] Visit an unknown URL and `/shop` — both should render cleanly with no
      console errors (this verifies the `/app.html` rewrite)
- [ ] Deploy hook fires on publish, and the resulting build succeeds
- [ ] Lighthouse run against staging, not localhost
