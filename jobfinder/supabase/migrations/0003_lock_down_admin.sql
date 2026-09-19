-- Restrict what the public (anon) key can see.
--
-- Gating the /admin page in the app is not enough on its own: the anon key
-- ships to the browser, so anyone holding it could call admin_stats() or read
-- the sources table directly through PostgREST. Column and function grants
-- close that off at the database.

-- ---------------------------------------------------------------------------
-- admin_stats() is operator-only
-- ---------------------------------------------------------------------------
revoke all on function admin_stats() from public, anon, authenticated;
grant execute on function admin_stats() to service_role;

-- search_jobs() stays public — it is what the site runs on.
grant execute on function search_jobs(
  text, text, text, text[], text[], integer, numeric, numeric,
  text, boolean, text[], text, integer, integer
) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- sources: public reads see only what the UI renders
--
-- The row also holds crawl policy, connector config (which can contain board
-- tokens) and the last error message. None of that belongs in the browser.
-- ---------------------------------------------------------------------------
revoke select on sources from anon, authenticated;
grant select (id, name, homepage, attribution_required, attribution_text)
  on sources to anon, authenticated;

-- jobs and companies stay readable: that is the product. Stated explicitly
-- rather than relying on Supabase's default grants.
grant select on jobs      to anon, authenticated;
grant select on companies to anon, authenticated;

-- Collection history is operator-only. RLS already denies it (enabled, no
-- policy), but revoking the grant means a future policy cannot open it by
-- accident.
revoke all on collection_runs   from anon, authenticated;
revoke all on collection_errors from anon, authenticated;
grant all on collection_runs   to service_role;
grant all on collection_errors to service_role;
