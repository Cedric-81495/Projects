# Deployment and setup

Backend on Render, frontend on Netlify, database on MongoDB Atlas.

- **Frontend** — https://score-and-scale.netlify.app
- **Backend** — https://score-and-scale-api.onrender.com

Every value is read exclusively from the environment. No URL, key, or credential
is hardcoded in `client/src` or `server/src`, so the same commit runs in
development and production with no code change.

---

## 1. MongoDB Atlas

The database already exists:

| | |
| --- | --- |
| Cluster | `ScoreAndScaleCluster` |
| Database | `score-and-scale` |

### The database name must be in the connection string

```
mongodb+srv://<user>:<password>@<cluster>.mongodb.net/score-and-scale?retryWrites=true&w=majority
                                                    ^^^^^^^^^^^^^^^^^
```

The name goes **before** the query string. A URI ending `.mongodb.net/?appName=…`
has *no* database path, and the driver silently falls back to `test`.

The server refuses to start in that case rather than writing into the wrong
database. You will see:

```
No database name could be determined from MONGODB_URI.
```

If you cannot change the URI, set `MONGODB_DB_NAME=score-and-scale` instead — it
takes precedence over the path. Reserved names (`test`, `admin`, `local`,
`config`) are rejected either way.

### Verifying the connection

On boot the API logs the database it actually connected to:

```json
{"level":"info","message":"Connected to MongoDB","context":{"database":"score-and-scale","host":"..."}}
```

Check that line in the Render logs. If it says anything other than
`score-and-scale`, stop and fix the URI.

### Network access

Render does not publish a fixed egress IP range on the free plan, so Atlas →
**Network Access** must allow `0.0.0.0/0`. The database is still protected by its
credentials; if you need IP allowlisting, Render offers static outbound IPs on
paid plans.

### Collections

`users` already exists. Mongoose creates the rest on first write —
`programs`, `enrollments`, `payments`, `enrollmentdocuments`,
`contactsubmissions`, `auditlogs`, `notifications`, `lessons`,
`lessonprogresses`. Every model shares one connection, so they all land in the
same database; no model declares a database of its own.

Seed the pricing tiers and starter curriculum once:

```sh
npm run seed --workspace=server
```

It upserts on slug, so re-running is safe.

---

## 2. Render — backend

| Setting | Value |
| ------- | ----- |
| Root directory | `score-and-scale/server` |
| Build command | `npm ci && npm run build` |
| Start command | `npm start` |
| Health check path | `/health` |

`server/render.yaml` is a blueprint for the same configuration.

### Environment variables

Required — the server will not boot without them:

| Variable | Notes |
| -------- | ----- |
| `MONGODB_URI` | Must include `/score-and-scale` (see above) |
| `JWT_SECRET` | 32+ chars |
| `JWT_REFRESH_SECRET` | 32+ chars, **different** from `JWT_SECRET` |

Core:

| Variable | Production value |
| -------- | ---------------- |
| `NODE_ENV` | `production` |
| `CLIENT_URL` | `https://score-and-scale.netlify.app` |
| `PORT` | Render injects this |

Optional integrations — validated lazily, so the API boots and serves everything
else while any of these are blank. Routes needing a missing one return
`503 INTEGRATION_NOT_CONFIGURED`:

| Group | Variables |
| ----- | --------- |
| Braintree | `BT_ENV`, `BT_MERCHANT_ID`, `BT_PUBLIC_KEY`, `BT_PRIVATE_KEY` |
| Supabase | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` |
| Resend | `RESEND_API_KEY`, `CONTACT_NOTIFY_EMAIL`, `MAIL_FROM` |
| Google | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` |

### `NODE_ENV=production` is load-bearing

It is what switches session cookies to `Secure; SameSite=None`. Netlify and
Render are different sites, so without it the browser refuses to send the session
cookie cross-site and authentication fails with no visible error. Conversely
locally, where the site is plain http, `Secure` would prevent the cookie being
stored at all — hence the automatic switch rather than a fixed setting.

### `CLIENT_URL` drives four things

CORS allowlist, cookie policy, OAuth redirect target, and post-login frontend
redirects. It accepts a comma-separated list; the **first** entry is canonical
and is what redirects and email links are built against.

Outside production, `http://localhost:5173` and `http://127.0.0.1:5173` are
appended to the CORS allowlist automatically, so one production value still works
when running the API locally. This never applies when `NODE_ENV=production`.

### Free-tier cold starts

The service sleeps when idle and a cold start takes several seconds. The pricing
section falls back to built-in tiers if `/api/programs` cannot be reached, so the
funnel still renders and converts while the API wakes.

---

## 3. Netlify — frontend

| Setting | Value |
| ------- | ----- |
| Base directory | `score-and-scale/client` |
| Build command | `npm run build` |
| Publish directory | `dist` |

`client/netlify.toml` supplies the SPA fallback, CSP, and cache headers. Without
the fallback, a refresh on `/dashboard` returns Netlify's own 404.

### Environment variables

| Variable | Production value |
| -------- | ---------------- |
| `VITE_API_URL` | `https://score-and-scale-api.onrender.com` |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Publishable (anon) key |
| `VITE_SUPABASE_STORAGE_BUCKET` | `documents` |

### `VITE_` values are baked in at build time

Vite inlines `import.meta.env.*` during the build; they are not read at runtime.
So:

- **Changing one in Netlify requires a redeploy.**
- With the Supabase variables unset, the guard clause in `supabaseClient.ts`
  becomes a compile-time constant, Rollup dead-code eliminates `supabase-js`
  entirely, and document upload can never work in that bundle.

`vite.config.ts` prints a warning when a required variable is missing. **Treat it
as a failed build.** Watch for:

```
⚠  VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set.
⚠  VITE_API_URL is not set — this build will call http://localhost:4000.
```

Never put a secret in a `VITE_` variable — it ships to every visitor.

---

## 4. Google OAuth

Server-side **authorization-code** flow. The client secret is only meaningful for
a server-to-server code exchange, so no Google SDK ships to the browser and no
client id appears in the bundle — the button is a plain link to
`/api/auth/google`.

### Google Cloud console

**APIs & Services → Credentials → OAuth 2.0 Client ID** (Web application). Add
both **Authorised redirect URIs**:

```
http://localhost:4000/api/auth/google/callback
https://score-and-scale-api.onrender.com/api/auth/google/callback
```

Google compares these **byte for byte** — scheme, host, port, and path. A
mismatch fails with `redirect_uri_mismatch` before ever reaching this app.

Note the callback is on the **API** domain, not Netlify. Google returns the
browser to the server so it can exchange the code and set httpOnly cookies, and
only then redirects to the frontend.

Under **OAuth consent screen**, add your test accounts while the app is in
Testing, or publish it.

### Versioned paths

The server also serves the callback at whatever path `GOOGLE_CALLBACK_URL`
specifies. If you register `/api/v1/auth/google/callback`, that path is mounted
automatically alongside the default — no other route is renamed. The active path
is logged on boot.

### What the flow guarantees

- Registration and login are the same endpoint. A Google email that already has
  an account is **linked**, not duplicated; a new email creates a customer
  account. An existing name or avatar is never overwritten.
- An unverified Google email is rejected, so it cannot be used to claim a known
  address.
- Role is always `user` on creation; elevation is CLI-only.
- Sessions are issued identically to password login. The CSRF token cannot travel
  in a redirect, so the client collects it from `/me` on the next page load.
- Failures redirect to `/login?error=CODE`, mapped to copy in `Login.tsx`.

---

## 5. Local development

Requires Node 20+.

```sh
# from score-and-scale/
npm install

cp server/.env.example server/.env
cp client/.env.example client/.env
```

Then in `server/.env`:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/score-and-scale?retryWrites=true
JWT_SECRET=<48+ random chars>
JWT_REFRESH_SECRET=<a different 48+ random chars>
CLIENT_URL=http://localhost:5173
NODE_ENV=development
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback
```

and in `client/.env`:

```env
VITE_API_URL=http://localhost:4000
```

Generate a secret with:

```sh
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Then:

```sh
npm run seed     # once
npm run dev      # client on :5173, API on :4000
```

Grant yourself admin access after registering:

```sh
npm run promote-admin --workspace=server -- you@example.com
```

> Point local development at a **separate** database from production if you
> intend to write test data.

---

## 6. Verification checklist

### Build

```sh
npm run typecheck      # both workspaces
npm run build          # both workspaces
```

Render runs `npm ci`, so verify against a clean install — a dependency present
only in a stale `node_modules` will pass locally and fail on deploy:

```sh
rm -rf server/node_modules server/package-lock.json
npm install --workspace=server && npm run build --workspace=server
```

### After deploying

1. **Health** — `GET https://score-and-scale-api.onrender.com/health`. Every
   integration you configured should read `true`:

   ```json
   {"status":"ok","env":"production",
    "integrations":{"braintree":true,"storage":true,"email":true,"googleOAuth":true}}
   ```

   `googleOAuth` is `true` only when all three Google variables are present.

2. **Database** — confirm the boot log names `score-and-scale`.

3. **Startup warnings** — the Render log should contain no
   `Google OAuth configuration problem` or `CLIENT_URL contains a localhost
   origin` lines.

4. **CORS and cookies** — load the Netlify site, register, and confirm a reload
   keeps you signed in. If it does not, check `NODE_ENV=production` and that
   `CLIENT_URL` exactly matches the Netlify origin.

5. **Google OAuth** — the case worth testing deliberately: sign up with Google
   using an email that **already has a password account**. You should land in the
   same account, not a second one. Then check the admin console's customer list
   shows one record for that email.

6. **Braintree** — checkout with sandbox card `4111 1111 1111 1111`, any future
   expiry. The payment should appear in both the customer's history and the admin
   payments table.

7. **Supabase** — upload a document from the dashboard, then open it from the
   admin review queue. The link is signed and expires after 15 minutes.

8. **Resend** — submit the contact form and confirm the notification arrives at
   `CONTACT_NOTIFY_EMAIL`.
