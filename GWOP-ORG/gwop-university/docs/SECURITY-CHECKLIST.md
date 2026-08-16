# Pre-handoff security checklist

Run as its own session. Report findings only; fix in a second pass.

## Secrets — must all return nothing
```bash
pnpm build
grep -rE "service_role|sk_live|sk_test|whsec_|BUNNY_TOKEN|CRON_SECRET" .next/static/
grep -rn "SUPABASE_SERVICE_ROLE_KEY" src/ | grep -v "lib/env.ts\|lib/supabase/admin.ts"
```
Every module touching a service key must start with `import 'server-only'`.

## Database
- [ ] Every table in `\dt public.*` appears in `0006_rls.sql`, or has no policy on purpose
- [ ] `select relname, relrowsecurity, relforcerowsecurity from pg_class where relnamespace='public'::regnamespace` — both true everywhere
- [ ] Every `SECURITY DEFINER` function has `set search_path`
- [ ] Anonymous client cannot read `profiles`, `enrollments`, `payment_references`, `audit_records`
- [ ] Level-1 user gets nothing back for a level-2 lesson ID
- [ ] A user cannot insert `lesson_progress` for a lesson above their level
- [ ] `update profiles set id = <other uuid>` is rejected by the WITH CHECK

## Payments
- [ ] Webhook rejects an unsigned request
- [ ] Replaying a captured event grants nothing the second time
- [ ] A checkout request with a tampered body still charges the catalogue price
- [ ] Navigating directly to the success URL grants no access
- [ ] Full refund revokes; partial refund does not

## Content
- [ ] `public/notes/*.pdf` moved to the private bucket — **currently outstanding**
- [ ] Bunny library has token authentication ON
- [ ] An expired playback token returns 403 from Bunny, not the video
- [ ] Signed storage URLs expire within `SIGNED_URL_TTL_SECONDS`

## Platform
- [ ] CSP has no `'unsafe-eval'` in production
- [ ] `frame-ancestors 'none'` present on every response
- [ ] Rate limits enforced with Redis unreachable (fail closed, not open)
- [ ] No email, phone or IP in any log line or Sentry breadcrumb
- [ ] `npm audit` clean; lockfile committed; Dependabot on
- [ ] Supabase daily backups verified with one **tested restore**

## Both journeys
- [ ] Student: signup → login → checkout → webhook → level access → Bunny playback → progress
- [ ] Event: printed QR → `/go/1` → `/event?s=greeter` → GHL form → CRM tag → SMS on a real US carrier phone
