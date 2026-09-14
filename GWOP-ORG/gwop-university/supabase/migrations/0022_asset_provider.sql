-- ════════════════════════════════════════════════════════════════════════════
-- 0022 — WHERE EACH LESSON'S FILE LIVES, AND WHAT "NOT YET" LOOKS LIKE
--
-- Two problems, one column.
--
-- ── 1. THE STORAGE DECISION IS NOT MADE ────────────────────────────────────
-- Video is on Bunny Stream today and the code signs Bunny tokens. Documents
-- are in a private Supabase bucket. Neither is contractually settled, and the
-- question "which storage do the learning materials live in" is still open.
--
-- Right now the answer is inferred: playback.ts asks "is there a video row?
-- then Bunny. otherwise sign a Supabase URL." That works while there are
-- exactly two providers and every lesson has one of them. It stops working the
-- moment a third appears, or a lesson has neither — because "neither" and
-- "Supabase" are the same branch, and the Supabase branch is the fallthrough.
--
-- So the provider becomes data. Bunny is the option for video now; moving to
-- another provider later is an UPDATE plus one branch, not a rewrite.
--
-- ── 2. AN UNUPLOADED LESSON HAS NO STATE ───────────────────────────────────
-- A lesson row with no video_id, no storage_path and no external_url is a
-- lesson whose file has not been produced yet. That is the normal condition
-- for most of the curriculum — build order item 9 is "resolve the video
-- runtime problem, then film".
--
-- Today that row falls into the Supabase branch and calls createSignedUrl()
-- with a null key. The student gets "Could not prepare this lesson. Try
-- again." — which says try again about something that will not work until
-- somebody films it.
--
-- 'pending' names that condition so the code can answer honestly.
--
-- ⚠ THIS DOES NOT MAKE PENDING LESSONS VISIBLE. lessons_publishable still
-- refuses to publish a lesson with no source, and that guard is worth keeping.
-- Showing unfinished lessons in the portal as "coming soon" is a separate
-- decision needing a visibility flag and an RLS change — deliberately not done
-- here. This migration makes the state nameable; it does not change who sees
-- what.
-- ════════════════════════════════════════════════════════════════════════════

begin;

-- ── The provider ───────────────────────────────────────────────────────────
-- 'pending' first so it is the enum's default-looking member and reads as the
-- starting state rather than an error state.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'asset_provider') then
    create type public.asset_provider as enum ('pending','bunny','supabase','external');
  end if;
end$$;

alter table public.lessons
  add column if not exists asset_provider public.asset_provider not null default 'pending';

-- ── Backfill from the columns that already carry the answer ────────────────
-- Order matters only for readability; lessons_single_source already guarantees
-- at most one of the three is set, so these cannot fight over a row.
update public.lessons set asset_provider = 'bunny'
 where video_id is not null and asset_provider is distinct from 'bunny';

update public.lessons set asset_provider = 'supabase'
 where storage_path is not null and asset_provider is distinct from 'supabase';

update public.lessons set asset_provider = 'external'
 where external_url is not null and asset_provider is distinct from 'external';

update public.lessons set asset_provider = 'pending'
 where video_id is null
   and storage_path is null
   and external_url is null
   and kind <> 'quiz'
   and asset_provider is distinct from 'pending';

-- A quiz has no file by design, so it is not pending anything. Parked on
-- 'external' would be a lie and 'pending' would put it on Maui's upload list
-- forever. It keeps whatever it has; nothing above touches it.

-- ── The provider must agree with the source column ─────────────────────────
-- Without this the column is a comment. With it, a row cannot claim Bunny and
-- carry a bucket key, and 'pending' genuinely means empty rather than
-- "somebody forgot to update the provider after uploading".
alter table public.lessons drop constraint if exists lessons_provider_source;
alter table public.lessons add constraint lessons_provider_source check (
  kind = 'quiz'
  or (asset_provider = 'pending'
        and video_id is null and storage_path is null and external_url is null)
  or (asset_provider = 'bunny'    and video_id     is not null)
  or (asset_provider = 'supabase' and storage_path is not null)
  or (asset_provider = 'external' and external_url is not null)
);

commit;

-- ════════════════════════════════════════════════════════════════════════════
-- VERIFY — run separately.
--
-- A. The shape of the curriculum right now. 'pending' is the count of lessons
--    still waiting on a file, which is the number Maui and Sheena are working
--    against:
--
--      select asset_provider, count(*)
--        from public.lessons
--       group by asset_provider
--       order by asset_provider;
--
-- B. Expect zero rows. A published lesson can never be pending —
--    lessons_publishable already prevents it — so anything here means that
--    constraint was dropped somewhere and paid content has a dead player:
--
--      select id, level, slug, title
--        from public.lessons
--       where published and asset_provider = 'pending';
--
-- ── WHEN THE STORAGE DECISION IS MADE ──────────────────────────────────────
-- If documents move off Supabase, this is the whole migration:
--
--      update public.lessons
--         set asset_provider = 'bunny'
--       where asset_provider = 'supabase';
--
-- plus the matching branch in src/lib/services/playback.ts and dropping the
-- storage_path values into the new provider's keys. The point of this column
-- is that the list of things to change is short and written down.
-- ════════════════════════════════════════════════════════════════════════════
