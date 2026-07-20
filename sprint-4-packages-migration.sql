-- ============================================================
-- KOY Sprint 4 — package plumbing: packages + user_packages
--
-- ✅ STATUS: APPLIED 2026-07-21. Invariant gate: PASSED — founder approved
-- ("lets apply that package design") and it was applied to Supabase as
-- migrations packages_and_user_packages + packages_revoke_remaining_write_privs.
-- Post-apply verify: 3 policies, all SELECT; anon/authenticated hold SELECT only.
--
-- Founder decisions baked in (2026-07-20):
--   * Sprint 4 scope = schema + client-side feature gating ONLY.
--     No Stripe/checkout this sprint (Stripe waits for Marketplace, Sprint 8+).
--     Grants happen manually (founder via dashboard / service role) until then.
--   * packages sits ALONGSIDE profiles.is_premium — is_premium keeps doing
--     its current job (upload limits). Nothing existing changes.
--
-- Idempotent: safe to run multiple times. Non-destructive: creates only.
-- Follows the sprint-2 pattern (create table if not exists + drop/create policies).
-- ============================================================

-- ------------------------------------------------------------
-- A. packages — the catalog of things a user can own
-- ------------------------------------------------------------
-- One row per sellable/grantable thing: a paid template, a feature pack,
-- or a bundle of both. The founder edits this table via the Supabase
-- dashboard (service role); clients can only READ it.

create table if not exists public.packages (
  id uuid default gen_random_uuid() primary key,

  -- stable machine name the client gates on, e.g. 'template-bloomberg',
  -- 'glam-girl', 'koy-plus'. Lowercase/digits/hyphens only.
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]*$'),

  name text not null,                    -- human name shown in UI
  description text,

  -- what kind of thing this is (affects where the client looks for it)
  kind text not null check (kind in ('template', 'feature', 'bundle')),

  -- price in cents to avoid float money bugs: $25.99 = 2599.
  -- 0 = free/promo package (grantable, not sold).
  price_cents integer not null default 0 check (price_cents >= 0),
  currency text not null default 'usd',

  -- list of feature keys this package unlocks, e.g.
  -- ["template:bloomberg", "cool-element:neon-sign"].
  -- The client gate checks membership in the union of owned packages' features.
  features jsonb not null default '[]'::jsonb check (jsonb_typeof(features) = 'array'),

  -- false = retired/not yet on sale. Retired packages stay in the table so
  -- existing owners keep rendering them (copy-not-reference spirit: buying
  -- is forever; retiring only stops NEW purchases).
  is_purchasable boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- B. user_packages — who owns what
-- ------------------------------------------------------------
-- One row per (user, package). Existence of a non-expired row = ownership.

create table if not exists public.user_packages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,

  -- RESTRICT, not cascade: you cannot delete a package people own.
  -- Retire it (is_purchasable=false) instead.
  package_id uuid not null references public.packages(id) on delete restrict,

  -- where the grant came from; 'stripe' reserved for Sprint 8+.
  source text not null default 'manual' check (source in ('manual', 'stripe', 'promo')),

  granted_at timestamptz not null default now(),

  -- null = owned forever (the normal case for one-time purchases).
  -- Set only if we ever sell time-limited access (hybrid-pricing option).
  expires_at timestamptz,

  unique (user_id, package_id)
);

-- The unique constraint above already indexes (user_id, package_id) with
-- user_id leading, which covers the client's "load my packages" query —
-- no extra index needed.

-- ------------------------------------------------------------
-- C. ROW LEVEL SECURITY
-- ------------------------------------------------------------
-- Stance: the client can READ, never WRITE. All writes to either table go
-- through the founder (dashboard / service role, which bypasses RLS).
-- Users must never be able to grant themselves a package.

alter table public.packages enable row level security;
alter table public.user_packages enable row level security;

-- packages: anyone (incl. logged-out visitors on a future pricing page)
-- can see what's on sale...
drop policy if exists "Anyone reads purchasable packages" on public.packages;
create policy "Anyone reads purchasable packages"
  on public.packages for select
  using (is_purchasable = true);

-- ...and owners can still read packages they own even after retirement,
-- so their templates/features keep rendering.
drop policy if exists "Users read packages they own" on public.packages;
create policy "Users read packages they own"
  on public.packages for select
  using (
    exists (
      select 1 from public.user_packages up
      where up.package_id = packages.id
        and up.user_id = auth.uid()
    )
  );

-- user_packages: users see only their own rows.
drop policy if exists "Users read own packages" on public.user_packages;
create policy "Users read own packages"
  on public.user_packages for select
  using (auth.uid() = user_id);

-- NO insert/update/delete policies on either table — with RLS enabled and
-- no policy, client writes are refused. This is the load-bearing rule.

-- Defense in depth (house style, cf. save_active_page anon revoke):
-- also strip the write PRIVILEGES Supabase grants by default, so even a
-- future accidental "allow all" policy could not open writes to clients.
revoke insert, update, delete on public.packages from anon, authenticated;
revoke insert, update, delete on public.user_packages from anon, authenticated;
-- ...and the remaining non-SELECT default grants too. TRUNCATE in particular is
-- NOT subject to RLS (unreachable via PostgREST, but strip it anyway).
revoke truncate, references, trigger on public.packages from anon, authenticated;
revoke truncate, references, trigger on public.user_packages from anon, authenticated;

-- ------------------------------------------------------------
-- D. updated_at trigger (reuse the Sprint 1 function)
-- ------------------------------------------------------------

drop trigger if exists update_packages_updated_at on public.packages;
create trigger update_packages_updated_at
  before update on public.packages
  for each row execute function public.update_updated_at_column();

-- ------------------------------------------------------------
-- E. SEED (commented out — founder fills real values at apply time)
-- ------------------------------------------------------------
-- Example shape for the ~$25.99 launch package. Slug/name/features are
-- placeholders pending Phase C template naming (Taste gate).
--
-- insert into public.packages (slug, name, description, kind, price_cents, features, is_purchasable)
-- values (
--   'koy-templates-launch',
--   'KOY Templates',
--   'Unlocks the premium template collection.',
--   'bundle',
--   2599,
--   '["template:bloomberg", "template:glam-girl"]'::jsonb,
--   false   -- flip to true when Phase C ships
-- )
-- on conflict (slug) do nothing;

-- ------------------------------------------------------------
-- F. VERIFY AFTER APPLY (read-only)
-- ------------------------------------------------------------
-- select tablename, policyname from pg_policies
--   where tablename in ('packages', 'user_packages');
-- Expect exactly 3 rows (2 on packages, 1 on user_packages), all SELECT.
--
-- select grantee, privilege_type from information_schema.role_table_grants
--   where table_name in ('packages','user_packages')
--     and grantee in ('anon','authenticated');
-- Expect SELECT only (no INSERT/UPDATE/DELETE) for both grantees.
