-- ============================================================
-- B12 HOTFIX: SELECT-side RLS lockdown across all user tables
-- Plus public-page RPC, calendar_entries helper, cleanup of test rows.
-- Run in Supabase SQL Editor. Idempotent. No app redeploy needed.
-- Critical fix for P0 anon SELECT vulnerability on pages.
-- ============================================================

-- ------------------------------------------------------------
-- A. PAGES — owner-only CRUD, NO direct anon SELECT
-- ------------------------------------------------------------
-- Wipes any pre-existing permissive policies (likely created
-- in Supabase Dashboard pre-Sprint-1, never tracked in repo)
-- and replaces with strict owner-only access.

alter table public.pages enable row level security;

do $$
declare p record;
begin
  for p in select policyname from pg_policies where schemaname='public' and tablename='pages' loop
    execute format('drop policy if exists %I on public.pages', p.policyname);
  end loop;
end $$;

create policy "Users read own pages"
  on public.pages for select
  using (auth.uid() = user_id);

create policy "Users insert own pages"
  on public.pages for insert
  with check (auth.uid() = user_id);

create policy "Users update own pages"
  on public.pages for update
  using (auth.uid() = user_id);

create policy "Users delete own pages"
  on public.pages for delete
  using (auth.uid() = user_id);

-- No public SELECT. Anon path goes through get_public_page() in section F.

-- ------------------------------------------------------------
-- B. PROFILES — owner-only direct access
-- ------------------------------------------------------------
-- Same treatment. Public handle lookup goes through the RPC.

alter table public.profiles enable row level security;

do $$
declare p record;
begin
  for p in select policyname from pg_policies where schemaname='public' and tablename='profiles' loop
    execute format('drop policy if exists %I on public.profiles', p.policyname);
  end loop;
end $$;

create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users delete own profile"
  on public.profiles for delete
  using (auth.uid() = id);

-- No INSERT policy. Profile rows are created by Supabase auth trigger
-- running as supabase_auth_admin which bypasses RLS.

-- ------------------------------------------------------------
-- C. COMMENTS — add INSERT + UPDATE policies (SELECT + DELETE exist)
-- ------------------------------------------------------------
-- Prevents author spoofing per architect.

alter table public.comments enable row level security;

drop policy if exists "Users insert own comments" on public.comments;
create policy "Users insert own comments"
  on public.comments for insert
  with check (auth.uid() = author_id);

drop policy if exists "Users update own comments" on public.comments;
create policy "Users update own comments"
  on public.comments for update
  using (auth.uid() = author_id);

-- ------------------------------------------------------------
-- D. TRADING_DAYS — legacy, drops in Sprint 3. Lock down meanwhile.
-- ------------------------------------------------------------
-- Sprint 1 added DELETE policy; nothing else. Add SELECT + INSERT +
-- UPDATE for own rows only. App doesn't write to this table anymore
-- (data migrated to calendar_entries in Sprint 2), but historical
-- rows exist and need to be protected.

alter table public.trading_days enable row level security;

drop policy if exists "Users read own trading days" on public.trading_days;
create policy "Users read own trading days"
  on public.trading_days for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own trading days" on public.trading_days;
create policy "Users insert own trading days"
  on public.trading_days for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own trading days" on public.trading_days;
create policy "Users update own trading days"
  on public.trading_days for update
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- E. USER_EVENTS — "money table" / behavioral analytics
-- ------------------------------------------------------------
-- Sprint 1 added INSERT policy. No SELECT/UPDATE/DELETE policies in
-- repo. RLS enabled + no SELECT policy = default deny, which is what
-- we want — anon and authenticated should NOT be able to read this
-- table at all from the client. (Future AI-training-data licensing
-- depends on the server-side reading via service role only.)

alter table public.user_events enable row level security;

-- Explicitly drop any stale SELECT policies just in case:
do $$
declare p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname='public' and tablename='user_events' and cmd='SELECT'
  loop
    execute format('drop policy if exists %I on public.user_events', p.policyname);
  end loop;
end $$;

-- No SELECT policy created. Default deny.

-- ------------------------------------------------------------
-- F. PUBLIC-PAGE RPC — single SECURITY DEFINER call replaces all
--    anon SELECTs on pages + profiles for the /u/{handle} flow
-- ------------------------------------------------------------

create or replace function public.get_public_page(handle_param text)
returns json
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select json_build_object(
    'profile', json_build_object(
      'id',           pr.id,
      'handle',       pr.handle,
      'display_name', pr.display_name,
      'bio',          pr.bio
    ),
    'page', json_build_object(
      'id',            p.id,
      'name',          p.name,
      'page_settings', p.page_settings,
      'blocks',        p.blocks
    ),
    'entries', coalesce(
      (select json_agg(row_to_json(ce))
       from public.calendar_entries ce
       where ce.user_id = pr.id),
      '[]'::json
    )
  )
  from public.pages p
  inner join public.profiles pr on pr.id = p.user_id
  where lower(pr.handle) = lower(handle_param)
    and p.is_active = true
  limit 1;
$$;

revoke all on function public.get_public_page(text) from public;
grant execute on function public.get_public_page(text) to anon, authenticated;

-- ------------------------------------------------------------
-- G. calendar_entries helper — preserves public calendar reads
-- ------------------------------------------------------------
-- The original "Anyone read calendar entries on visible pages" policy
-- used EXISTS (SELECT 1 FROM pages ...) which runs in the calling
-- user's context. With pages SELECT now locked down for anon, that
-- subquery returns false and the policy denies anon. Replace with a
-- SECURITY DEFINER helper that can read pages internally without
-- exposing rows directly.

create or replace function public.user_has_active_page(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.pages
    where user_id = uid and is_active = true
  );
$$;

revoke all on function public.user_has_active_page(uuid) from public;
grant execute on function public.user_has_active_page(uuid) to anon, authenticated;

drop policy if exists "Anyone read calendar entries on visible pages" on public.calendar_entries;
create policy "Anyone read calendar entries on visible pages"
  on public.calendar_entries for select
  using (public.user_has_active_page(user_id));

-- ------------------------------------------------------------
-- H. CLEANUP — remove test rows from B12 verification probes
-- ------------------------------------------------------------

delete from public.pages
  where user_id = 'af15baa1-c33e-4133-afb0-2e325602d6cc'
    and name = 'ClaudetteB12Test';

-- Khalid's account: tight window to avoid wiping legitimate earlier
-- Untitled rows. Verify the date below matches the day Phase A ran.
delete from public.pages
  where user_id = '98f1aa4a-9a63-4fb3-9f26-f0c26896eec6'
    and name = 'Untitled'
    and created_at >= '2026-05-15T16:00:00Z'
    and created_at <  '2026-05-15T17:00:00Z';

-- ============================================================
-- VERIFY after running
-- ============================================================
--
--   -- 1. RLS enabled on all user tables
--   select tablename, rowsecurity from pg_tables
--     where schemaname='public'
--       and tablename in ('pages','profiles','comments','trading_days','user_events','calendar_entries');
--   -- all rowsecurity columns should be true
--
--   -- 2. Policy inventory
--   select tablename, policyname, cmd from pg_policies
--     where schemaname='public'
--     order by tablename, cmd;
--
--   -- 3. RPC sanity (replace 'khalid' with a real handle)
--   select public.get_public_page('khalid');
--   -- should return a JSON object with profile, page, entries.
--
--   -- 4. Helper sanity
--   select public.user_has_active_page(
--     (select id from public.profiles where handle = 'khalid')
--   );
--   -- should return true.
--
--   -- 5. Cleanup verification
--   select id, name, created_at from public.pages
--     where user_id in ('af15baa1-c33e-4133-afb0-2e325602d6cc',
--                       '98f1aa4a-9a63-4fb3-9f26-f0c26896eec6');
--   -- ClaudetteB12Test should be gone; Khalid's UUID shows only
--   -- legitimate rows (not the Phase A Untitled row from 16:35 UTC).
-- ============================================================
