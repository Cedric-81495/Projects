# H2C — Project Memory & Progress

> Living document. Update the **Status** and **Changelog** as work lands so any
> contributor (or a future session) can resume without re-reading everything.

**Project:** Handcuffs 2 Cufflinks — Movement-Driven Brand Ecosystem Platform
**Stack:** MERN + TypeScript. Frontend: React 18 · Vite 5 · Tailwind 3 · React Router 6.
**Palette:** ink black · burnished gold · redemption green · bone.
**Hosting plan:** Frontend → Render static (or Vercel) · API → Render web service · DB → MongoDB Atlas.

---

## Status board

| Area                        | State            | Notes                                                        |
| --------------------------- | ---------------- | ------------------------------------------------------------ |
| Frontend build / typecheck  | ✅ Green          | `tsc -b` + `vite build` clean; lint clean (ESLint 9 flat).   |
| Design system & pages       | ✅ Done           | All 10 hubs + home journey sections built.                   |
| API service layer           | ✅ Done           | `src/services/` — typed client, content (GET), forms (POST). |
| Forms wired (3)             | ✅ Done           | Newsletter, Join, Community → services + loading/error UX.   |
| Error boundary + SEO polish | ✅ Done           | Route error page, favicon, OG/Twitter meta, robots.txt.      |
| Deploy configs              | ✅ Done           | `render.yaml`, `vercel.json`, `_redirects`.                  |
| **Backend (Express API)**   | ✅ Built          | `h2c-api/` — public + admin endpoints, security, seed. Green. |
| **MongoDB Atlas**           | ⬜ Provision      | Models done; create cluster + set `MONGODB_URI`, run seed.   |
| **Admin auth + moderation** | ✅ Built          | JWT httpOnly cookie; admin API + frontend login/queue. Green. |
| Content CRUD (admin)        | ✅ Built          | API + full admin UI (list/create/edit/delete) for all 3 types.|
| Public community gallery    | ✅ Built          | Community page shows approved submissions.                    |
| Media embeds                | 🟡 Partial       | Reusable YouTube embed wired into Trailer (config-driven).    |
| Real media/content          | ⬜ Client input   | Trailer id, social URLs, real stories = placeholders to fill. |

---

## What was fixed in this pass (frontend audit)

1. **Broken lint** — `.eslintrc.cjs` referenced ESLint + plugins that weren't
   installed, so `npm run lint` failed (`eslint: not found`). → Replaced with
   **ESLint 9 flat config** (`eslint.config.js`) + deps. Lint is now green.
2. **No route error boundary** — a runtime throw showed React Router's unstyled
   default. → Added branded `RouteError` as the router `errorElement`.
3. **Dead form stubs / no data layer** — forms only flipped local state; content
   was hard-coded. → Added `src/services/` (client + content + forms) and wired
   all three forms with real submit, loading, and error states. GETs fall back to
   seed data, so nothing breaks before the API exists.
4. **Deploy symptom (`💿 Hey developer 👋`)** — build is clean, so this was the
   **host serving the wrong output** (wrong Publish Directory / placeholder), not
   a code error. → Added `render.yaml` and exact host settings in the README.
5. **SEO/polish** — no favicon (404 on `/favicon.ico`), no social meta, no robots.
   → Added `favicon.svg`, Open Graph/Twitter tags, `robots.txt`.
6. **Repo hygiene** — stale `*.tsbuildinfo` caches were shipped in the zip. →
   Removed and added to `.gitignore`.

Known, intentional stand-ins (content, not bugs): Hero/Trailer video posters,
bare social URLs in `src/data/nav.ts`, seed story/episode/track data.

---

## Architecture (how to find things)

```
src/
├── components/  ui/ (Button, Field, Container…) · brand/ (TransformationMark, Logo) · system/ (RouteError)
├── data/        seed content + types (fallback for the API)
├── hooks/       useReveal (scroll), useSubmit (async form state)
├── layouts/     RootLayout, Navbar, Footer
├── modules/     home/ movement/ storytelling/ media/ apparel/ community/ founder/ ecosystem/ join/
├── services/    apiClient.ts · content.ts (GET) · forms.ts (POST)  ← all network access
└── router/      routes.tsx (errorElement wired)
```

Rule: **components never `fetch` directly** — they call `services/`. To connect the
backend, implement the endpoints below and set `VITE_API_URL`. No component edits.

---

## Backend contract (build this next)

Base URL = `VITE_API_URL` (e.g. `http://localhost:4000/api`). Errors → `{ message }`.

| Method & path              | Body / returns                              | Frontend caller                     |
| -------------------------- | ------------------------------------------- | ----------------------------------- |
| `POST /newsletter`         | `{ email, source }`                         | `services/forms.subscribeNewsletter`|
| `POST /members`            | `{ name, email, interests: string[] }`      | `services/forms.joinMovement`       |
| `POST /community/stories`  | `{ name, email, title, story }` (moderated) | `services/forms.submitCommunityStory`|
| `GET  /stories`            | `Story[]` or `{ data: Story[] }`            | `services/content.getStories`       |
| `GET  /episodes`           | `Episode[]`                                 | `services/content.getEpisodes`      |
| `GET  /tracks`             | `Track[]`                                   | `services/content.getTracks`        |

Types are the source of truth in `src/data/content.ts` (`Story`, `Episode`, `Track`).

### Suggested Mongoose models
- **Newsletter**: `{ email (unique), source, createdAt }`
- **Member**: `{ name, email (unique), interests: [String], createdAt }`
- **CommunityStory**: `{ name, email, title, story, status: 'pending'|'approved'|'rejected', createdAt }`
- **Story / Episode / Track**: mirror the frontend types; add `published: Boolean`, `order: Number`.

### API server must-haves
- CORS allowing the frontend origin.
- Validation (zod/express-validator) + rate limiting on POSTs (spam).
- Helmet, JSON body limit, centralized error handler returning `{ message }`.
- `GET /health` for Render health checks.

---

## Next steps (ordered)

**Phase 2 — Backend & DB**  ✅ *API built (`h2c-api/`); DB provisioning remains*
1. ✅ Express + TS scaffold: helmet, cors allow-list, rate limiting, error handler, `/health`.
2. ⬜ Create MongoDB Atlas cluster; set `MONGODB_URI` (backend env only).
3. ✅ All 6 endpoints + Mongoose models + zod validation + seed script.
4. ⬜ Deploy API as a Render **web service** (`render.yaml` included); set frontend
   `VITE_API_URL` to it and redeploy the frontend; run `npm run seed` against Atlas.

**Phase 3 — Admin & content**
5. ✅ Auth (JWT httpOnly cookie) + admin API to moderate community stories and CRUD
   content. Frontend: `/admin` (login) + `/admin/dashboard` (moderation queue).
   Env-based single admin — set `ADMIN_EMAIL` + `ADMIN_PASSWORD_HASH` (`npm run hash`).
6. ✅ Admin content UI: list/create/edit/delete for stories, episodes, tracks
   (`/admin/content/:resource`, one generic page driven by a field spec). Public
   Community page now shows approved submissions (`GET /api/community/stories`).
7. 🟡 Media: reusable privacy-friendly `VideoEmbed` (click-to-load YouTube) wired
   into the home Trailer via `src/data/media.ts` (`trailerYouTubeId`). Social URLs
   centralized/flagged in `src/data/nav.ts`.

> **Client inputs to finish launch (no code needed):** set `trailerYouTubeId` in
> `src/data/media.ts`; replace social URLs in `src/data/nav.ts`; add real content
> via the admin UI (then it replaces seed data automatically).
>
> **Optional follow-up (needs small backend change):** per-item video/audio embeds
> for individual Stories / Podcast / Music entries require adding `youtubeId` /
> `spotifyId` fields to those models + admin form fields + rendering on the pages.

**Phase 4 — Hardening** *(resume here next session)*
8. Sitemap.xml + per-route `<title>`/meta (react-helmet-async).
9. Analytics + newsletter provider integration.
10. Lighthouse/a11y pass; error monitoring (Sentry); CI running lint + typecheck + build (both apps).

---

## Admin quick reference
- Backend auth: env-based single admin. `cd h2c-api && npm run hash -- "password"`
  → set `ADMIN_PASSWORD_HASH`; set `ADMIN_EMAIL`, `JWT_SECRET`, and matching `CORS_ORIGIN`.
- CORS uses `credentials: true`; frontend admin calls use `credentials: 'include'`.
  Cross-domain cookies are `SameSite=None; Secure` (needs HTTPS — Render provides it).
- Frontend admin lives at `/admin` and `/admin/dashboard` (outside the public layout,
  not in nav). Guard: `src/modules/admin/RequireAdmin.tsx`.
- Community submissions are `pending` until approved; public gallery endpoint returns
  approved only (`GET /api/community/stories`).

---

## Commands (frontend)
```bash
npm install
npm run dev        # http://localhost:5173
npm run lint       # ESLint 9 (flat config)
npm run typecheck  # tsc, no emit
npm run build      # tsc -b && vite build → dist/
npm run preview    # serve dist/ locally
```

## Changelog
- **v0.6.1 (green theme + mark cleanup):** Removed `TransformationMark` entirely
  (component, all usages, `.tm-draw` CSS). Removed the logo from the desktop navbar;
  mobile drawer now shows `logo-mark.png`. Recolored to brand emerald: navbar chrome
  + mobile drawer (`green-deep`), footer (`green-deep`), and the Founder, Podcast, and
  Movement sections (`green` / `green-deep`). Footer now shows `logo-dark.png`.
  NOTE: `logo-dark` is the black wordmark — low contrast on the dark-green footer;
  switch to `logo-mark` if it should read brighter.
- **v0.6 (branding & responsive fixes):** Applied official H2C brand — fonts
  Cormorant Garamond (display) + Montserrat (body/eyebrow); palette Obsidian
  #0B0B0C, Charcoal #24272A, Graphite #555A60, Platinum #BFC3C7, Prestige Gold
  #C8A34A, Emerald #0D5B3F (via CSS tokens). Integrated real assets as **static
  files** in `public/brand/` (logo-mark.png = platinum/gold wordmark for dark bg,
  logo-dark.png for light bg, hero.jpg) — Logo + Hero now use them; OG/Twitter image
  set to hero. Fixed navbar breakpoint (Join CTA was `sm`, hamburger `lg` → both
  showed on tablet; CTA now `lg`, so <lg shows only the hamburger). Hero is now a
  **full-bleed background** (image object-cover + legibility gradients, CTAs pinned
  bottom, sr-only H1). Podcast rows rebuilt with a CSS grid
  `[auto_minmax(0,1fr)_auto]` (middle track can't overflow) + responsive sizing;
  added global `overflow-x: clip` + `img{max-width:100%}` as a mobile safety net.
  Added `vercel.json` cache headers (immutable assets, no-cache index.html).
  NOTE: built on the v0.5 base — does NOT include Phase 4 (SEO/analytics/CI) yet.
- **v0.5 (Phase 3 — items 6 & 7):** Admin content CRUD UI (generic page for
  stories/episodes/tracks under a shared admin layout), public approved-stories
  gallery on the Community page, reusable click-to-load `VideoEmbed` wired into the
  Trailer, centralized media/social config. Frontend green (lint/type/build), all
  admin + public routes serve via SPA fallback.
- **v0.4 (Phase 3 — auth & admin):** JWT httpOnly-cookie admin auth (env-based single
  admin, bcrypt), admin API (moderation + content CRUD), public approved-stories
  endpoint, credentialed CORS. Frontend admin: `/admin` login + `/admin/dashboard`
  moderation queue with a route guard. Both apps green; auth flow smoke-tested
  (bad login/401, unauth/401, login→cookie, authed /me, logout).
- **v0.3 (backend):** `h2c-api/` — Express + TS + Mongoose. Public endpoints, zod
  validation, Helmet/CORS/rate-limit, `/health`, graceful shutdown, seed script.
- **v0.2 (frontend hardening):** service layer + wired forms, route error boundary,
  ESLint 9, favicon/SEO/robots, render.yaml, README deploy guide, repo cleanup.
- **v0.1:** initial frontend — design system, all pages, home journey.
