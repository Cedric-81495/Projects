# Score and Scale

Credit strategy and funding-preparation platform: a marketing funnel, a customer
dashboard, and an admin console.

- **Frontend** — https://score-and-scale.netlify.app (Netlify)
- **Backend** — https://score-and-scale-api.onrender.com (Render)

## Stack

| Layer    | Technology |
| -------- | ---------- |
| Frontend | React 18, TypeScript, Vite, React Router 6, Tailwind CSS |
| Backend  | Node.js, Express 4, TypeScript |
| Database | MongoDB with Mongoose |
| Auth     | JWT access tokens, rotating refresh tokens, httpOnly cookies, Google OAuth |
| Payments | Braintree (Drop-in UI) |
| Storage  | Supabase Storage (signed upload/download URLs) |
| Email    | Resend |

## Layout

```
score-and-scale/
├── client/                     # React + Vite + TS
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/          # DataTable, KpiCard, RevenueChart, StatusSelect
│   │   │   ├── auth/           # AuthShell, SessionManager
│   │   │   ├── dashboard/      # DocumentUpload, PaymentHistory, StatusBadge, Timeline
│   │   │   ├── marketing/      # Hero, Tiers, Process, Faq, ScoreDial, PaymentForm, …
│   │   │   └── ui/             # Button, Card, Field, Modal, FadeUp, Skeleton, …
│   │   ├── context/            # AuthContext, ThemeContext
│   │   ├── hooks/              # useIdleTimer
│   │   ├── lib/                # api, uploadClient, supabaseClient, format, cn
│   │   ├── pages/              # Home, Contact, Login, Register, Checkout, dashboard/, admin/
│   │   └── routes/             # ProtectedRoute, AdminRoute
│   └── netlify.toml            # SPA fallback, CSP, cache headers
└── server/                     # Express + TS
    ├── src/
    │   ├── lib/                # env, db, jwt, cookies, braintree, storage, mailer, audit, notify
    │   ├── middleware/         # requireAuth, requireAdmin, csrf, validate, rateLimit, errorHandler
    │   ├── models/             # User, Program, Enrollment, Payment, Document, …
    │   ├── routes/             # auth, programs, contact, enrollments, checkout, payments,
    │   │                       #   documents, notifications, academy, admin, webhooks
    │   └── scripts/            # seedPrograms, promoteAdmin
    └── render.yaml             # Render blueprint
```

## Running locally

Requires Node 20+ and a MongoDB connection string.

```sh
# from score-and-scale/
npm install

cp server/.env.example server/.env    # fill in MONGODB_URI and the two JWT secrets
cp client/.env.example client/.env    # set VITE_API_URL=http://localhost:4000

npm run seed          # loads the pricing tiers and starter academy lessons
npm run dev           # client on :5173, API on :4000
```

Grant yourself admin access after registering:

```sh
npm run promote-admin --workspace=server -- you@example.com
```

## Environment variables

### Server (Render)

Required — the API refuses to boot without these:

| Variable | Notes |
| -------- | ----- |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_ACCESS_SECRET` | 32+ chars. Must differ from the refresh secret |
| `JWT_REFRESH_SECRET` | 32+ chars |
| `CLIENT_ORIGIN` | Comma-separated CORS allowlist. Must include the Netlify URL |

Optional — validated lazily on first use, so the API boots and serves every
unrelated route while these are unset. Routes that need a missing integration
return `503 INTEGRATION_NOT_CONFIGURED`:

| Group | Variables |
| ----- | --------- |
| Braintree | `BT_ENV`, `BT_MERCHANT_ID`, `BT_PUBLIC_KEY`, `BT_PRIVATE_KEY` |
| Supabase | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` |
| Email | `RESEND_API_KEY`, `MAIL_FROM`, `ADMIN_NOTIFICATION_EMAIL` |
| Google OAuth | `GOOGLE_CLIENT_ID` |

`SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security. It is confined to
`server/src/lib/storage.ts` and must never reach the browser.

### Client (Netlify)

| Variable | Notes |
| -------- | ----- |
| `VITE_API_URL` | `https://score-and-scale-api.onrender.com` |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Public anon key — safe to ship in the bundle |
| `VITE_SUPABASE_STORAGE_BUCKET` | `enrollment-documents` |

> **These must be set in Netlify's *build* environment, not just at runtime.**
> Vite inlines `import.meta.env.*` at build time. With the Supabase variables
> unset, the guard clause in `supabaseClient.ts` becomes a compile-time constant,
> Rollup dead-code eliminates the `createClient` call, and `supabase-js` is
> dropped from the bundle — producing a deploy where document upload can never
> work. `vite.config.ts` prints a warning when this happens; treat it as a
> failed build.

## Security

| Control | Where |
| ------- | ----- |
| Password hashing | bcrypt, cost 12 (`models/User.ts`) |
| Access tokens | 15-minute JWT in an httpOnly cookie |
| Refresh rotation | New token per use, SHA-256 hashed at rest, reuse revokes the whole lineage (`routes/auth.routes.ts`) |
| Cross-site cookies | `SameSite=None; Secure` in production, `Lax` locally (`lib/cookies.ts`) |
| CSRF | HMAC token delivered in the response body and echoed as `X-CSRF-Token` (`middleware/csrf.ts`) |
| CORS | Strict origin allowlist, credentials enabled, no wildcard |
| Rate limiting | Per-route buckets for auth, contact, checkout, uploads, plus a global backstop |
| Helmet / CSP | Locked-down API policy; the frontend ships its own via `netlify.toml` |
| Input validation | Zod on every body, query, and param (`middleware/validate.ts`) |
| Authorisation | `requireAdmin` re-reads the role from MongoDB rather than trusting the token |
| Audit trail | Append-only `AuditLog` for every privileged action |
| Error handling | Single exit point; unknown errors reduced to an opaque `INTERNAL_ERROR` |
| Log redaction | Credential-shaped keys stripped before anything reaches stdout |

Two deliberate design decisions worth knowing about:

**Prices are never taken from the client.** `POST /api/checkout` accepts a
program slug and a payment nonce only, and derives the amount from
`Program.priceCents` server-side.

**Uploads never pass through the API.** The client requests a scoped signed
token, sends bytes straight to Supabase, then confirms. The server re-verifies
that the storage key sits under the caller's own prefix and re-reads the real
file size from storage before recording anything.

## API

| Method | Path | Access |
| ------ | ---- | ------ |
| `POST` | `/api/auth/register` · `/login` · `/google` · `/refresh` · `/logout` | Public |
| `GET` | `/api/auth/me` | Authenticated |
| `GET` | `/api/programs` | Public |
| `POST` | `/api/contact` | Public |
| `GET` | `/api/enrollments` | Authenticated |
| `PATCH` | `/api/enrollments/:id/cancel` | Owner |
| `PATCH` | `/api/enrollments/:id/status` | Admin |
| `GET` | `/api/checkout/client-token` | Authenticated |
| `POST` | `/api/checkout` | Authenticated |
| `GET` | `/api/payments` | Authenticated |
| `POST` | `/api/documents/upload-url` · `/api/documents` | Owner |
| `GET` | `/api/documents?enrollmentId=` | Owner |
| `GET` | `/api/documents/admin/all` | Admin |
| `PATCH` | `/api/documents/:id/review` | Admin |
| `GET` | `/api/notifications` | Authenticated |
| `GET` | `/api/academy` · `/api/academy/:slug` | Authenticated + entitled |
| `GET` | `/api/admin/kpis` · `/enrollments` · `/contacts` · `/payments` · `/audit-log` · `/customers` | Admin |
| `POST` | `/api/webhooks/braintree` | Signature-verified |
| `GET` | `/health` | Public |

## Deployment

**Netlify** — base directory `score-and-scale/client`, build `npm run build`,
publish `dist`. `netlify.toml` supplies the SPA fallback (without it a refresh on
`/dashboard` returns Netlify's 404), the CSP, and cache headers.

**Render** — root directory `score-and-scale/server`, build
`npm ci && npm run build`, start `npm start`, health check `/health`.
`server/render.yaml` is a blueprint for the service.

On Render's free tier the API sleeps when idle and a cold start takes several
seconds. The pricing section falls back to hard-coded tiers if `/api/programs`
cannot be reached, so the funnel still renders and converts during a cold start.
