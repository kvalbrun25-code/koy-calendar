-- ============================================================
-- KOY — AI credits + rate limiter (Sprint 5 / KOY AI)
--
-- Credits ARE the rate limiter: every KOY AI generation costs 1 credit.
-- A small free grant means one abuser can burn at most their allotment,
-- never the whole Anthropic budget. Later, purchased credits top up the
-- same balance (Marketplace / Stripe, Sprint 8+).
--
-- Security stance (same as packages): clients READ their own balance,
-- never write it. All mutation happens through SECURITY DEFINER RPCs that
-- key off auth.uid() — a user can never grant themselves credits.
--
-- FREE GRANT = 5 generations (change the v_free literal in spend_ai_credit
-- to adjust; founder call).
-- ============================================================

create table if not exists public.ai_credits (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  lifetime_used integer not null default 0 check (lifetime_used >= 0),
  updated_at timestamptz not null default now()
);

alter table public.ai_credits enable row level security;

-- Users can read ONLY their own balance (to display "N left").
drop policy if exists "Users read own ai credits" on public.ai_credits;
create policy "Users read own ai credits"
  on public.ai_credits for select
  using (auth.uid() = user_id);

-- No client write policies. Strip default write privileges too (defense in depth).
revoke insert, update, delete, truncate, references, trigger
  on public.ai_credits from anon, authenticated;

-- ------------------------------------------------------------
-- spend_ai_credit() — atomic decrement, keyed off the caller's JWT.
-- Returns the new balance, or -1 if the caller has no credits.
-- First call for a user lazily creates their row with the free grant.
-- ------------------------------------------------------------
create or replace function public.spend_ai_credit()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid  uuid := auth.uid();
  v_free integer := 5;   -- FREE GRANT — change here to adjust
  v_bal  integer;
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  insert into public.ai_credits (user_id, balance)
  values (v_uid, v_free)
  on conflict (user_id) do nothing;

  update public.ai_credits
     set balance = balance - 1,
         lifetime_used = lifetime_used + 1,
         updated_at = now()
   where user_id = v_uid
     and balance > 0
  returning balance into v_bal;

  if not found then
    return -1;   -- out of credits
  end if;
  return v_bal;
end;
$$;

revoke all on function public.spend_ai_credit() from public, anon;
grant execute on function public.spend_ai_credit() to authenticated;

-- ------------------------------------------------------------
-- refund_ai_credit() — give back 1 credit (called if the AI request
-- fails AFTER a credit was spent, so a failed generation is free).
-- ------------------------------------------------------------
-- SERVICE-ROLE ONLY (adversarial-review fix). A client-callable refund is an
-- infinite-credit printer, so refund is NOT granted to authenticated. The edge
-- function calls it with the service key + explicit uid, and only for genuine
-- infra failures (Anthropic 5xx / network) — never for model-produced outputs.
create or replace function public.refund_ai_credit(p_uid uuid)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_bal integer;
begin
  update public.ai_credits
     set balance = balance + 1,
         lifetime_used = greatest(lifetime_used - 1, 0),
         updated_at = now()
   where user_id = p_uid
  returning balance into v_bal;
  return coalesce(v_bal, 0);
end;
$$;

revoke all on function public.refund_ai_credit(uuid) from public, anon, authenticated;

-- ------------------------------------------------------------
-- grant_ai_credits(p_uid, p_n) — top up a user's balance. For the
-- founder (dashboard/service role) now, and Stripe webhooks later.
-- NOT callable by normal users.
-- ------------------------------------------------------------
create or replace function public.grant_ai_credits(p_uid uuid, p_n integer)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_bal integer;
begin
  if p_n is null or p_n <= 0 then
    raise exception 'BAD_AMOUNT';
  end if;
  insert into public.ai_credits (user_id, balance)
  values (p_uid, p_n)
  on conflict (user_id) do update
     set balance = public.ai_credits.balance + p_n,
         updated_at = now()
  returning balance into v_bal;
  return v_bal;
end;
$$;

revoke all on function public.grant_ai_credits(uuid, integer) from public, anon, authenticated;
-- service_role only (implicit; it bypasses grants). No explicit grant to clients.

-- ------------------------------------------------------------
-- VERIFY AFTER APPLY (read-only)
-- ------------------------------------------------------------
-- select policyname, cmd from pg_policies where tablename='ai_credits';       -- 1 SELECT policy
-- select proname, prosecdef from pg_proc where proname in
--   ('spend_ai_credit','refund_ai_credit','grant_ai_credits');                -- all secdef=true

-- ============================================================
-- APPENDED 2026-07-21 — Full-page AI design (Pro, metered). APPLIED.
-- Pro gate = owning a package with feature 'ai:page-design' (the 'koy-pro'
-- package, seeded is_purchasable=false; founder grants via user_packages now,
-- Stripe subscription wires into the same gate later). Metered at 30
-- page-designs / month (v_allow in spend_page_design). Reuses ai_credits.
-- ============================================================
alter table public.ai_credits
  add column if not exists page_used   integer not null default 0 check (page_used >= 0),
  add column if not exists page_period text;

create or replace function public.spend_page_design()
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare v_uid uuid := auth.uid(); v_allow integer := 30; v_period text := to_char(now(),'YYYY-MM'); v_ispro boolean; v_rem integer;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  select exists (select 1 from public.user_packages up join public.packages p on p.id=up.package_id
    where up.user_id=v_uid and (up.expires_at is null or up.expires_at>now()) and p.features ? 'ai:page-design') into v_ispro;
  if not v_ispro then return -2; end if;
  insert into public.ai_credits (user_id) values (v_uid) on conflict (user_id) do nothing;
  update public.ai_credits set page_used = case when page_period is distinct from v_period then 0 else page_used end, page_period = v_period where user_id=v_uid;
  update public.ai_credits set page_used = page_used + 1, updated_at = now()
   where user_id=v_uid and page_used < v_allow returning (v_allow - page_used) into v_rem;
  if not found then return -1; end if;
  return v_rem;
end; $$;
revoke all on function public.spend_page_design() from public, anon;
grant execute on function public.spend_page_design() to authenticated;

create or replace function public.refund_page_design(p_uid uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin update public.ai_credits set page_used = greatest(page_used-1,0), updated_at=now() where user_id=p_uid; end; $$;
revoke all on function public.refund_page_design(uuid) from public, anon, authenticated;

-- Seed the Pro package (founder grants until Stripe):
-- insert into public.packages (slug,name,description,kind,price_cents,features,is_purchasable)
-- values ('koy-pro','KOY Pro','Unlocks full-page AI design + premium templates.','feature',999,'["ai:page-design"]'::jsonb,false)
-- on conflict (slug) do update set features=excluded.features;
