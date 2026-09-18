import { publicEnv } from '@/lib/env.public'

/* ═══════════════════════════════════════════════════════════════════════════
   AUTH COOKIE SCOPE — one session across thegwopblueprint.com and go.*

   ⚠ EVERY SUPABASE CLIENT MUST PASS THIS. There are four of them — the browser
   client, the two server clients, and the one inside middleware — and they all
   read and write the same cookie. If one writes with a domain and another
   writes without, the browser ends up holding TWO cookies with the same name at
   different scopes, and which one it sends is decided by rules nobody wants to
   debug. Symptoms are "signed out at random" and "signed in on one page and out
   on the next".

   ── WHY THIS EXISTS ──────────────────────────────────────────────────────
   Supabase's cookies were host-only, because no domain was ever configured.
   Both hosts serve the same app, so someone could sign in on the apex domain,
   be returned by Stripe to go.thegwopblueprint.com, and arrive with no cookie
   at all — signed out, mid-purchase, with a successful payment behind them.
   That happened to a real $497 buyer on 2026-09-18.

   Setting the domain to '.thegwopblueprint.com' makes one session valid on the
   apex and on every subdomain, which is what "both domains do the same thing"
   actually requires.

   ── THE TRADE, STATED PLAINLY ────────────────────────────────────────────
   ⚠ ANY SUBDOMAIN CAN NOW RECEIVE THIS COOKIE. Cookie scope is a tree: the
   browser sends it to go.*, www.*, and to anything else ever hosted under
   thegwopblueprint.com. The token is httpOnly, so page scripts cannot read it —
   but a subdomain pointed at a third-party service receives it on every request
   to that host.

   So: do not park a GoHighLevel funnel, a status page, a webmail redirect or a
   marketing tool on a subdomain of this domain. Use a separate domain for those.
   If that ever becomes necessary, this decision has to be revisited first.

   ── LOCAL AND PREVIEW ────────────────────────────────────────────────────
   The variable is unset outside production, so cookies stay host-only there.
   That is deliberate: localhost has no parent domain to share, and preview URLs
   live under vercel.app, where scoping a cookie to the parent would either fail
   or be shared with every other Vercel deployment.
   ═══════════════════════════════════════════════════════════════════════════ */

export const authCookieOptions = publicEnv.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN
  ? { domain: publicEnv.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN }
  : {}
