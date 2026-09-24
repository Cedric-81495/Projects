# Tests

Excluded from `tsc --noEmit` and from `next build` — they are not application
code, and `vitest` is only installed once you opt in:

```bash
npm install -D vitest
npm run test:rls
```

`rls.spec.ts` is the suite that matters most. It talks to the **database** with
an anon key rather than to the API, which is the point: it proves the access
guarantee holds even if every line of application code is wrong. A failure here
means the client's paid content is reachable — treat it as sev-1, never as a
flaky test to skip.

Run it against a local or staging Supabase project. Never production.
