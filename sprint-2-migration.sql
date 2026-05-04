-- ============================================================
-- KOY CALENDAR — SPRINT 2 MIGRATION
-- Run this in Supabase SQL Editor BEFORE running app code from Sprint 2.
-- Idempotent: safe to run multiple times.
-- Non-destructive: trading_days table is preserved, not dropped.
-- ============================================================

-- ------------------------------------------------------------
-- A. CREATE calendar_entries TABLE (replaces trading_days conceptually)
-- ------------------------------------------------------------
-- New table is persona-agnostic. Old trading_days stays in place
-- for one sprint as a backup, will be dropped in Sprint 3.

create table if not exists public.calendar_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  day date not null,

  -- structured fields (all optional, persona-agnostic)
  emoji text,
  label text check (char_length(label) <= 60),
  numeric_value numeric,            -- e.g., trader P&L
  count_value integer,              -- e.g., trade count, rep count
  journal text,
  mood text,                        -- carried over from trading_days for compatibility

  -- freeform mini-canvas elements (chunk 7)
  freeform_blocks jsonb not null default '[]'::jsonb,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(user_id, day)
);

-- ------------------------------------------------------------
-- B. COPY EXISTING DATA from trading_days (one-time, idempotent via ON CONFLICT)
-- ------------------------------------------------------------

insert into public.calendar_entries (user_id, day, numeric_value, count_value, mood, journal, created_at)
select user_id, day, pnl, trade_count, mood, journal, created_at
from public.trading_days
on conflict (user_id, day) do nothing;

-- ------------------------------------------------------------
-- C. ROW LEVEL SECURITY — mirror trading_days policies
-- ------------------------------------------------------------

alter table public.calendar_entries enable row level security;

drop policy if exists "Users read own calendar entries" on public.calendar_entries;
create policy "Users read own calendar entries"
  on public.calendar_entries for select
  using (auth.uid() = user_id);

drop policy if exists "Anyone read calendar entries on visible pages" on public.calendar_entries;
create policy "Anyone read calendar entries on visible pages"
  on public.calendar_entries for select
  using (
    exists (
      select 1 from public.pages
      where pages.user_id = calendar_entries.user_id
        and pages.is_active = true
    )
  );

drop policy if exists "Users insert own calendar entries" on public.calendar_entries;
create policy "Users insert own calendar entries"
  on public.calendar_entries for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own calendar entries" on public.calendar_entries;
create policy "Users update own calendar entries"
  on public.calendar_entries for update
  using (auth.uid() = user_id);

drop policy if exists "Users delete own calendar entries" on public.calendar_entries;
create policy "Users delete own calendar entries"
  on public.calendar_entries for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- D. UPDATED_AT TRIGGER (reuse function from Sprint 1)
-- ------------------------------------------------------------

drop trigger if exists update_calendar_entries_updated_at on public.calendar_entries;
create trigger update_calendar_entries_updated_at
  before update on public.calendar_entries
  for each row execute function public.update_updated_at_column();

-- ------------------------------------------------------------
-- E. INDEXES
-- ------------------------------------------------------------

create index if not exists idx_calendar_entries_user_day
  on public.calendar_entries (user_id, day desc);

-- ------------------------------------------------------------
-- F. STORAGE BUCKET POLICIES (run AFTER creating user-uploads bucket in Dashboard)
-- ------------------------------------------------------------
-- IMPORTANT: First create the bucket "user-uploads" in Supabase Dashboard:
-- Storage > New bucket > name: user-uploads > Public bucket: ON
-- Then run the policies below.

drop policy if exists "Public read on user-uploads" on storage.objects;
create policy "Public read on user-uploads"
  on storage.objects for select
  using (bucket_id = 'user-uploads');

drop policy if exists "Users upload to own folder" on storage.objects;
create policy "Users upload to own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'user-uploads'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users delete own files" on storage.objects;
create policy "Users delete own files"
  on storage.objects for delete
  using (
    bucket_id = 'user-uploads'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- DONE. Verify with:
--   select count(*) from calendar_entries;
--   select count(*) from trading_days;
-- The two counts should match (data was copied over).
-- ============================================================
