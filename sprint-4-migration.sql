-- KOY Sprint 4, slice 1 — atomic save path (save_active_page RPC)
-- Source: claude/KOY-SAVE-FIX-DRAFT.sql (project knowledge), founder-gated.
--
-- ⚠ INVARIANT GATE: apply this to Supabase (founder sign-off + smoke) BEFORE
-- merging the client change in this branch — the client now calls this RPC.
-- DB check 2026-07-20: function does NOT exist yet; pages_one_active_per_user
-- unique index EXISTS, so the assumptions below hold.
--
-- Bug: saving a new page fires PATCH (deactivate old active) then POST (insert new active)
-- as two separate calls. If the PATCH fails (observed 503) but the POST succeeds, you get
-- TWO rows with is_active=true (violates the unique constraint) + scrambled timestamps,
-- while the UI still says "saved". This makes both writes happen in ONE transaction.
--
-- Table recap:
--   pages(id, user_id, name, is_active bool, page_settings jsonb, blocks jsonb,
--         created_at, updated_at)
--   UNIQUE: only one is_active=true per user_id (pages_one_active_per_user).
--
-- Security: SECURITY DEFINER (bypasses RLS), so ownership is enforced INSIDE via auth.uid().
-- search_path pinned (CVE pattern otherwise). Follows the get_public_page RPC pattern.

create or replace function public.save_active_page(
  p_name          text,
  p_page_settings jsonb,
  p_blocks        jsonb,
  p_page_id       uuid default null   -- pass an id to OVERWRITE that page; null = save as new
)
returns public.pages
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid  uuid := auth.uid();
  v_row  public.pages;
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  -- Serialize saves per-user so two at once fail gracefully instead of a raw unique_violation.
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text, 0));

  -- One transaction: clear the old active page(s), then write the new active one.
  -- If ANYTHING here fails, the whole thing rolls back — no half-saved double-active state.
  update public.pages
     set is_active = false, updated_at = now()
   where user_id = v_uid
     and is_active = true
     and (p_page_id is null or id <> p_page_id);

  if p_page_id is not null then
    -- Overwrite path: must be the caller's own page.
    update public.pages
       set name = p_name,
           page_settings = p_page_settings,
           blocks = p_blocks,
           is_active = true,
           updated_at = now()
     where id = p_page_id
       and user_id = v_uid
    returning * into v_row;

    if v_row.id is null then
      raise exception 'PAGE_NOT_FOUND_OR_NOT_OWNED';
    end if;
  else
    -- Save-as-new path.
    insert into public.pages (user_id, name, is_active, page_settings, blocks, updated_at)
    values (v_uid, p_name, true, p_page_settings, p_blocks, now())
    returning * into v_row;
  end if;

  return v_row;
end;
$$;

revoke all on function public.save_active_page(text, jsonb, jsonb, uuid) from public;
grant execute on function public.save_active_page(text, jsonb, jsonb, uuid) to authenticated;

-- Client change (src/App.jsx savePg), shipped in the same branch:
--   The two-step PATCH-then-POST is replaced with ONE call through sbF:
--     sbF("/rest/v1/rpc/save_active_page", { method: "POST", token: getToken(),
--       body: { p_name, p_page_settings, p_blocks, p_page_id: null } })
--   sbF already throws on failure, so a failed save now surfaces honestly (red flash,
--   Invariant I5) and can never leave two active rows (Invariant I6). Passing a real
--   p_page_id later gives the Overwrite / Save-as-new founder ask for free.
