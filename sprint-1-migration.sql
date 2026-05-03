-- ============================================================
-- KOY CALENDAR — SPRINT 1 MIGRATION
-- Run this in Supabase SQL Editor (left sidebar > SQL Editor > New Query)
-- Idempotent: safe to run multiple times. Non-destructive: no data is deleted.
-- ============================================================

-- ------------------------------------------------------------
-- A. TIGHTEN user_events INSERT POLICY
-- ------------------------------------------------------------
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
create unique index if not exists pages_one_active_per_user
  on public.pages (user_id)
  where is_active = true;

-- ------------------------------------------------------------
-- C. AUTO-UPDATE updated_at ON ROW MODIFICATION
-- ------------------------------------------------------------
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
-- F. INDEX FOR HANDLE LOOKUPS
-- ------------------------------------------------------------
create index if not exists idx_profiles_handle_lower
  on public.profiles (lower(handle));
