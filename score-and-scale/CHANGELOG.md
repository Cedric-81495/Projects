# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

- **Database name resolution and guardrails** (`server/src/lib/db.ts`). The
  database is resolved from the path of `MONGODB_URI`, or from an optional
  `MONGODB_DB_NAME` override, and passed explicitly to Mongoose as `dbName`.
  Startup now **refuses to connect** when:
  - the connection string carries no database path — the condition under which
    the driver silently falls back to `test`;
  - the resolved name is a reserved database (`test`, `admin`, `local`,
    `config`);
  - `MONGODB_URI` is not a parsable connection string.

  Each failure names the problem and the fix. The connected database and host are
  logged on boot so the target is verifiable from the platform logs rather than
  assumed. Collections are still created on demand by Mongoose.

- **`MONGODB_DB_NAME`** (optional). Explicit database name, taking precedence
  over the path in `MONGODB_URI`. For when one cluster URI serves several
  environments, or the URI cannot carry a path.

- **Environment-driven OAuth callback path.** The server additionally serves the
  Google callback at whatever path `GOOGLE_CALLBACK_URL` specifies, so a
  deployment registered with a versioned prefix
  (`/api/v1/auth/google/callback`) works without renaming any other route.
  Previously a path mismatch produced a 404 *after* a successful sign-in — a
  failure that looks like broken auth but is pure configuration.

- **Startup configuration audit.** Warnings are emitted before the first request
  for misconfigurations that otherwise only surface when a real user hits them:
  - `GOOGLE_CALLBACK_URL` pointing at localhost, or using plain http, while
    `NODE_ENV=production`;
  - `CLIENT_URL` containing a localhost origin in production.

- **Automatic dev CORS origins.** Outside production, `http://localhost:5173`
  and `http://127.0.0.1:5173` are appended to the CORS allowlist, so a single
  production `CLIENT_URL` still works when running the API locally. Never applied
  when `NODE_ENV=production`.

- **`CHANGELOG.md`** — this file.

### Changed

- **All environment values are trimmed on read** (`server/src/lib/env.ts`).
  Credentials copied from a dashboard very often carry a trailing space, and an
  untrimmed secret fails authentication with a provider error that never mentions
  whitespace. A whitespace-only value is now treated as absent rather than as a
  valid empty string.

- **`server/.env.example`** and **`client/.env.example`** rewritten with every
  variable, per-environment values, and notes on the non-obvious failure modes
  (missing database path, build-time `VITE_` inlining, exact callback matching).

- **`server/render.yaml`** updated to the current variable names.

### Fixed

- **`@types/braintree` was missing from `server/package.json`.** The build only
  succeeded because a stale copy lingered in `node_modules`; a clean
  `npm ci && npm run build` — exactly what Render runs — would have failed with
  `TS7016: Could not find a declaration file for module 'braintree'`. Verified by
  deleting `node_modules` and the lockfile and reinstalling from scratch.

### Security

- No URL, key, secret, or credential is hardcoded in `client/src` or
  `server/src`; every value is read from the environment. Verified by grep.

---

## [1.1.0]

### Added

- **Google OAuth 2.0, server-side authorization-code flow**
  (`server/src/lib/googleOAuth.ts`, `client/src/components/auth/GoogleButton.tsx`).
  - CSRF protection for the flow itself: a nonce is sent to Google in `state` and
    its twin stored in a single-use httpOnly cookie, compared in constant time on
    return. Without it, an attacker could replay their own authorization code in
    a victim's browser and have the victim adopt the attacker's session.
  - Sign-in and sign-up share one resolver. An existing email is **linked**
    rather than duplicated; a new email creates a customer account. The user's own
    name and avatar are never overwritten by their Google profile.
  - An unverified Google email is rejected, so a Google profile claiming a known
    address cannot take over that account.
  - Role is always `user` on creation. Elevation remains CLI-only, so no OAuth
    path can mint an administrator.
  - Sessions are issued identically to password login: same cookies, same
    rotation lineage, same 15-minute access token.
  - No Google SDK ships to the browser and no client id enters the bundle.

- **`safeClientRedirect`** — post-authentication destinations are resolved
  against the `CLIENT_URL` allowlist, closing the open redirect that a
  caller-supplied `next` parameter would otherwise be. Protocol-relative
  (`//evil.com`), off-site, and `javascript:` targets are all rejected.

### Changed

- Environment variables renamed to match the deployment environments:

  | Before | After |
  | ------ | ----- |
  | `JWT_ACCESS_SECRET` | `JWT_SECRET` |
  | `CLIENT_ORIGIN` | `CLIENT_URL` |
  | `ADMIN_NOTIFICATION_EMAIL` | `CONTACT_NOTIFY_EMAIL` |

- `SUPABASE_STORAGE_BUCKET` now defaults to `documents` on both client and
  server, so only the Supabase credentials are genuinely required.

- `GET /api/auth/me` returns a CSRF token, letting a session created by an OAuth
  redirect collect one without a re-login. A redirect has no readable body, so
  the token cannot be delivered the way it is for password login.

### Removed

- `POST /api/auth/google` (browser-side ID-token flow), superseded by the
  authorization-code flow. `GOOGLE_CLIENT_SECRET` has no role in the ID-token
  flow, so its presence in the configuration implied the code flow.

---

## [1.0.0]

### Added

Initial build of the platform: marketing funnel, customer dashboard, and admin
console.

- **Client** — React 18, TypeScript, Vite, React Router 6, Tailwind CSS. Design
  system driven by CSS custom properties so light and dark themes swap tokens
  rather than every component carrying variants. Route-level code splitting keeps
  the funnel bundle small; Braintree and Supabase load only where used.
  Accessibility throughout: skip link, focus-visible rings, programmatically
  associated form errors, a focus-trapping dialog, and honoured
  `prefers-reduced-motion`.

- **Server** — Express 4, TypeScript, Mongoose. Ten models, twelve route
  modules, and a single error exit point that reduces unknown failures to an
  opaque `INTERNAL_ERROR`.

- **Security** — bcrypt (cost 12); 15-minute JWT access tokens in httpOnly
  cookies; refresh-token rotation with reuse detection, SHA-256 hashed at rest,
  where replaying a rotated token revokes the whole lineage; HMAC CSRF tokens
  built for a cross-site session; strict CORS allowlist; per-route rate limits;
  Helmet/CSP; Zod validation on every body, query, and param; `requireAdmin`
  re-reading the role from the database rather than trusting the token; an
  append-only audit log; and credential redaction in logs.

- **Payments** — Braintree Drop-in. The charge amount is derived from
  `Program.priceCents` server-side and never accepted from the client.

- **Storage** — Supabase Storage. File bytes never pass through the API: the
  client requests a scoped signed token, uploads directly, then confirms. The
  server re-verifies the storage key sits under the caller's own prefix and
  re-reads the real file size from storage before recording anything.

- **Email** — Resend, best-effort so a mail outage cannot fail a request whose
  data is already durably stored.
