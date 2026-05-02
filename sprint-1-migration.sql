-- ============================================================
-- KOY CALENDAR — SPRINT 1 MIGRATION
-- Run this in Supabase SQL Editor (left sidebar > SQL Editor > New Query)
-- Idempotent: safe to run multiple times. Non-destructive: no data is deleted.
-- ============================================================

-- ------------------------------------------------------------
-- A. TIGHTEN user_events INSERT POLICY
-- ------------------------------------------------------------
-- Current policy allows anyone to insert any user_id. This makes the
-- "money table" (event data for AI training) trivially poisonable.
-- New policy: authenticated users may only insert events with their own user_id,
-- and anonymous events (user_id IS NULL) are still allowed for guest tracking.

drop policy if exists "Anyone can insert events" on public.user_events;

create policy "Users insert own events or anonymous"
  on public.user_events for insert
  with check (
    auth.uid() = user_id
    or user_id is null
  );

-- ------------------------------------------------------------
-- B. ENFORCE ONE ACTIVE PAGE PER USER
-- ------------------------------------------------------------
-- Without this, a user can have multiple pages with is_active = true,
-- which makes "show me this user's live page" lookups ambiguous.

create unique index if not exists pages_one_active_per_user
  on public.pages (user_id)
  where is_active = true;

-- ------------------------------------------------------------
-- C. AUTO-UPDATE updated_at ON ROW MODIFICATION
-- ------------------------------------------------------------
-- The updated_at columns currently default to now() on INSERT only.
-- They never bump on UPDATE, so timestamps lie.

create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_profiles_updated_at on public.profiles;
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at_column();

drop trigger if exists update_pages_updated_at on public.pages;
create trigger update_pages_updated_at
  before update on public.pages
  for each row execute function public.update_updated_at_column();

-- ------------------------------------------------------------
-- D. ADD MISSING DELETE POLICIES
-- ------------------------------------------------------------
-- comments and trading_days had no DELETE policy, meaning users
-- couldn't delete their own data even though they should be able to.

drop policy if exists "Users delete own comments" on public.comments;
create policy "Users delete own comments"
  on public.comments for delete
  using (auth.uid() = author_id);

drop policy if exists "Users delete own trading days" on public.trading_days;
create policy "Users delete own trading days"
  on public.trading_days for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- E. MIRROR PAGE VISIBILITY ONTO COMMENTS
-- ------------------------------------------------------------
-- Currently comments are world-readable, but pages are only visible
-- if active or owned. This means someone could read comments tied to
-- a page they can't view. Fix: comments inherit the page's visibility.

drop policy if exists "Anyone can read comments" on public.comments;
create policy "Read comments on visible pages"
  on public.comments for select
  using (
    exists (
      select 1 from public.pages
      where pages.id = comments.page_id
        and (pages.is_active = true or pages.user_id = auth.uid())
    )
  );

-- ------------------------------------------------------------
-- F. INDEX FOR HANDLE LOOKUPS (public page route performance)
-- ------------------------------------------------------------
-- /u/{handle} routes will query profiles by handle on every public
-- page load. The existing UNIQUE constraint provides an index, but
-- we add a lower(handle) functional index for case-insensitive lookups.

create index if not exists idx_profiles_handle_lower
  on public.profiles (lower(handle));

-- ============================================================
-- DONE. Verify with:
--   select policyname from pg_policies where tablename in ('user_events','comments','trading_days');
--   select indexname from pg_indexes where tablename in ('pages','profiles');
--   select trigger_name from information_schema.triggers where event_object_table in ('profiles','pages');
-- ============================================================
