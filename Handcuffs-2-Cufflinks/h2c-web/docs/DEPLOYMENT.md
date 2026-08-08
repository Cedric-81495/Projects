# Deploying, and getting admin sign-in working

Two separate things have to be true before you can sign in to the CMS on a
deployed build:

1. `https://<site>/admin/sign-in` has to **load** (this was the 404).
2. The sign-in **request** has to reach the API, be allowed by CORS, and be
   able to set a cross-site cookie.

They fail independently and look similar from the browser, so check them in
order.

---

## 1. Why `/admin/sign-in` returned 404

The CMS is deliberately not prerendered — there is nothing to render for a
signed-out visitor, and the admin markup should not sit in the build output. So
no file was written at `dist/admin/sign-in/`, and the URL depended entirely on
the SPA fallback rewrite in `vercel.json`:

```json
"rewrites": [{ "source": "/((?!api/|assets/|media/|sitemap.xml|robots.txt).*)",
              "destination": "/app.html" }]
```

If that rewrite is not in effect, every non-prerendered URL falls through to
Vercel's own 404. The homepage and `/collections` keep working because they are
real files on disk, which is exactly the pattern you saw.

**Fixed** by writing the same empty shell as a real file at every client-only
route (`scripts/prerender.mjs` + `CLIENT_ONLY_ROUTES` in `src/router/manifest.ts`).
The build now emits:

```
dist/admin/index.html          dist/admin/media/index.html
dist/admin/sign-in/index.html  dist/admin/subscribers/index.html
dist/admin/dashboard/index.html  dist/admin/users/index.html
dist/admin/handcuffs-2-cufflinks/index.html
dist/admin/kitchen-muzik/index.html
dist/admin/gwop/index.html
dist/admin/community/index.html
dist/account/index.html
```

Each is `noindex`, has an empty `<div id="root">` (nothing to hydrate against),
and is absent from `sitemap.xml`. A file on disk cannot 404, so these no longer
depend on the rewrite at all. The rewrite stays as the safety net for
parameterised detail routes, which cannot be enumerated ahead of time.

### Still worth checking

Visit any nonsense URL, e.g. `https://<site>/zzz-does-not-exist`:

* **The site's own styled 404 page** → the rewrite works. Detail pages
  (`/docuseries/<slug>`) are fine.
* **Vercel's plain black `404: NOT_FOUND` page** → the rewrite is not being
  applied. Almost always because the Vercel project's **Root Directory** is not
  set to `h2c-web`; `vercel.json` is only read from the root of the deployment.
  Fix it in Project Settings → General → Root Directory, then redeploy.

---

## 2. Vercel — frontend environment

Project Settings → Environment Variables, scoped to **Production**. Vite inlines
`VITE_*` values **at build time**, so adding or changing any of these requires a
redeploy — saving them alone changes nothing.

| Variable | Value | Why it matters |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `https://<your-api>.onrender.com/api/v1` | **The most common cause of a broken sign-in.** If unset it defaults to `/api/v1`, so the CMS posts to `https://<site>/api/v1/auth/sign-in` — same origin, no such file, 404. It must be absolute and include `/api/v1`. |
| `VITE_SITE_URL` | `https://<your-site>` | Canonical URLs and OG images. Wrong value = every share link unfurls with the wrong host. |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth **client ID** | Public. The secret stays on the API. |
| `SEO_NOINDEX` | `true` on staging/preview, **unset on production** | Currently `true` on this deployment — `robots.txt` is serving `Disallow: /`. Correct for staging; delists the site if left on for production. |

Also confirm: **Root Directory = `h2c-web`**, Build Command `npm run build`,
Output Directory `dist` (these come from `vercel.json` once the root directory
is right).

---

## 3. Render — API environment

| Variable | Value | Notes |
| --- | --- | --- |
| `NODE_ENV` | `production` | **Do not skip this.** It is what switches the refresh cookie to `Secure; SameSite=None`. Without it the cookie is `SameSite=Lax`, and because the CMS (Vercel) and API (Render) are different sites, the browser silently drops it — you sign in successfully, then get signed out on the next page load or refresh. |
| `MONGODB_URI` | Atlas connection string | Use a different database from local. |
| `JWT_ACCESS_SECRET` | `openssl rand -base64 48` | |
| `JWT_REFRESH_SECRET` | `openssl rand -base64 48` | Must **differ** from the access secret — the server refuses to start otherwise. |
| `CORS_ORIGINS` | `https://<your-site>` | Exact scheme + host, **no trailing slash**, comma-separated for several. No wildcards: the API uses cookies, and browsers reject `*` with credentials. Preview deployments get a new URL each time, so they will not be allowed unless you add them. |
| `SITE_URL` | `https://<your-site>` | |
| `ADMIN_URL` | `https://<your-site>/admin` | Password reset and email confirmation links are built from this. |
| `RESEND_API_KEY` | Resend key | Optional, but **without it password reset does not send** — the mailer logs the link to the Render console instead. |
| `MAIL_FROM` | `Handcuffs 2 Cufflinks <no-reply@yourdomain>` | Domain must be verified with the provider. |
| `REQUIRE_SUPER_ADMIN_MFA` | `false` | Leave false until every super admin has enrolled, or you lock everyone out at once. |

Google sign-in (optional — password sign-in works without it):

| Variable | Value |
| --- | --- |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | From Google Cloud Console → Credentials → OAuth client ID (Web application) |
| `GOOGLE_CALLBACK_URL` | `https://<your-api>.onrender.com/api/v1/auth/google/callback` |
| `OAUTH_SUCCESS_REDIRECT` | `https://<your-site>/admin/dashboard` |
| `OAUTH_MEMBER_REDIRECT` | `https://<your-site>/community` |
| `OAUTH_FAILURE_REDIRECT` | `https://<your-site>/admin/sign-in` |

`GOOGLE_CALLBACK_URL` must be added verbatim to the OAuth client's **Authorised
redirect URIs** — Google matches character for character, and a trailing slash
is a different URI. One callback serves both the CMS and member flows.

---

## 4. MongoDB Atlas

* **Network Access → 0.0.0.0/0.** Render's free and starter tiers have no
  static outbound IP, so an allowlist of specific addresses will fail
  intermittently and look like a database outage.
* Database user with read/write on the app database.
* If startup fails with `querySrv ECONNREFUSED`, the host's DNS is refusing the
  SRV lookup that `mongodb+srv://` needs — set `DNS_SERVERS=8.8.8.8,1.1.1.1`.

---

## 5. Create the first administrator

There is no self-registration into the CMS — by design. Google sign-in also
never creates a staff account; it only matches an existing one. So the first
account has to be made against the production database:

```bash
cd h2c-api
MONGODB_URI="<your production Atlas URI>" npm run create-admin -- \
  --email you@example.com --name "Your Name"
```

The password is generated and printed **once**. It is never logged or written
to a file — copy it before closing the terminal, then change it after first
sign-in.

You can run this from your own machine (your IP needs Atlas access) or from a
Render shell.

---

## 6. Verify, in order

1. `https://<your-api>.onrender.com/api/v1/health` → `{"success":true,...,"database":"connected"}`.
   A 503 here means the API is up but cannot reach Mongo — fix that first.
2. `https://<your-site>/admin/sign-in` → the sign-in form renders.
3. Submit the form with DevTools → Network open:
   * **404 on the request** → `VITE_API_BASE_URL` is wrong or unset (§2).
   * **CORS error** → `CORS_ORIGINS` does not exactly match the site origin (§3).
   * **200, then signed out on refresh** → `NODE_ENV` is not `production`, so
     the refresh cookie is being dropped (§3).
   * **401 "email and password combination did not work"** → credentials; the
     API is reachable and configured correctly.
4. In DevTools → Application → Cookies, confirm `h2c_rt` is present with
   `Secure` and `SameSite=None`.

Note that Render's free tier sleeps after inactivity, so the first request after
a quiet period can take 30–60 seconds and may time out. That is not a
misconfiguration — retry once before debugging.
