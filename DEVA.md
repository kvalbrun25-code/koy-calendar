# Dev A — Coding-Craft Appendix

*Authored by Dev A (Sprint 1 → end of Sprint 2). Voice preserved. Architect folds in as a clearly-marked dev-authored section; fact-checking only.*

---

## What this is

A map and a method for the next Dev A. Not a rules document — the Design Constitution and the State/Auth Invariants are the rules. This is the layer below: how I actually work inside those rules, what I learned the hard way, and the specific shape of the codebase you're about to own.

Read the Invariants first. Then come back here. This file assumes you know them by number.

---

## Stack & idioms

### One file, dense, deliberate

`src/App.jsx` is ~3000+ lines and growing. Resist the urge to split it before Sprint 4's state-management refactor. The single-file pattern is a known accepted condition — it's compact, the artifact renderer historically depended on a specific React-import pattern, and the cost of splitting now is conflict surface with Dev B. The Sprint 4 refactor is when the split happens, on purpose, with intent. Until then: dense one-line functions, `var` instead of `const/let`, `function ComponentName()` declarations only (never arrow components, never `import React`). Match the existing style on every edit. The few times the style felt cramped, doing it the "clean" way introduced churn that wasn't worth it.

### Supabase access goes through one wrapper, period

This is **I2**. The only sanctioned bypass is the storage-upload raw fetch in Dev B's image-upload code, which explicitly mirrors `sbF`'s contract (auth header, status check, 401-refresh-and-retry, `__sessExpired` semantics).

`sbF(path, opts)` is module-level. It does five things, in order:

1. Builds the fetch with `apikey` + `Authorization: Bearer ${token||SK}` headers.
2. Logs `[sbF]` to `console.warn` on any 4xx/5xx — keep this. The B12 catch was partly from this log.
3. On `401` with a token: tries refresh once, dispatches `koyAuthRefreshed` on success, retries the original request with the new access token. On refresh failure or no refresh_token: marks the session expired (one-shot via `__sessExpired`), dispatches `koyAuthExpired`, throws `SESSION_EXPIRED`.
4. On `204/205`: returns `null` (this matters — `r.json()` on empty body throws, which silently killed deletes in B3).
5. On other 4xx/5xx: parses the body if it can, throws `Error("HTTP_<status>")` with `.status` and `.body` properties attached.

That last point is the contract callers must honor. Every callsite that does a write either:

- Wraps in `.catch` and rolls back optimistic state, or
- Lets the throw propagate to a parent that does

The pre-hotfix codebase was `r.json()` blind — no status check, no throw, no rollback. Every "silent fail" bug in Sprint 2 traces to that. Don't soften the throw behavior to "make tests easier" — that's regressing the fix.

### Migrations and RLS ship together (Invariant I3)

A migration that creates a table without policies is a defect, even if the table looks "internal." `pages` and `profiles` had no SELECT policies in any tracked migration — that's how B12 happened. Every CREATE TABLE I write from now on includes:

```sql
alter table public.<table> enable row level security;

create policy "Users read own <table>" on public.<table> for select using (auth.uid() = <user_id_col>);
create policy "Users insert own <table>" on public.<table> for insert with check (auth.uid() = <user_id_col>);
create policy "Users update own <table>" on public.<table> for update using (auth.uid() = <user_id_col>);
create policy "Users delete own <table>" on public.<table> for delete using (auth.uid() = <user_id_col>);
```

Public-read paths go through `SECURITY DEFINER` RPCs, never broad anon SELECTs. `get_public_page(handle)` is the exemplar — read it before designing any other public read. The shape:

```sql
create or replace function public.get_public_<thing>(<param>)
returns json
language sql stable security definer
set search_path = public, pg_temp
as $$
  select json_build_object(...)
  from ... where ... limit 1;
$$;
revoke all on function public.get_public_<thing>(<param>) from public;
grant execute on function public.get_public_<thing>(<param>) to anon, authenticated;
```

`set search_path = public, pg_temp` matters. `SECURITY DEFINER` without an explicit search_path is a CVE pattern (search_path injection). Keep it.

The matching client call goes through `sbF`:

```js
sbF("/rest/v1/rpc/get_public_<thing>", {method: "POST", body: {<param>: x}})
```

Same wrapper, same 401-refresh path. The RPC pattern doesn't bypass `sbF`.

---

## The auth/session map (read this twice)

This is the most important section. Sprint 3's hardest work — B15, B16, B11 — is reshaping this map. Understand it before you cut.

### Where data lives today

**`localStorage["koyAuth"]`** — shape: `{ user, token, refresh_token, expires_at }`.
- Written by `saveAuth({...})`, read by `loadAuth()`, removed by `clearAuth()`.
- Touched by: `doAuth` on signup/login success, `sbF` after a successful refresh, `clearUserState` on logout, `enterGuestMode` defensively.
- This is the persistence layer. It survives reload. It's the source of truth for "is there a session" between renders.

**Editor component `useState`** — `user`, `token`, `profile`.
- Initialized from `loadAuth()` on mount: `var initAuth = loadAuth(); useState(initAuth?.user || null); useState(initAuth?.token || null);`
- `setUser`, `setToken`, `setProfile` are called from many places (`doAuth`, `clearUserState`, `enterGuestMode`, the `koyAuthRefreshed` listener, the guest button's old broken handlers).
- **This is B15.** The token sits in renderable React state. Devtools, error boundaries, future telemetry-via-state-dump can all see it. Per I1, the access_token and refresh_token must move out of this layer.

**`AccountSettings` component `useState`** — its own `auth` state.
- Independently calls `loadAuth()` on mount.
- Also listens for `koyAuthRefreshed` to keep its copy in sync.
- Same B15 violation, parallel.

**Module-level `__sessExpired`** — a single boolean.
- Set to `true` by `sessionMarkExpired()` after a 401-with-failed-refresh.
- Set to `false` by `sessionMarkActive()` on successful login, successful refresh, `clearUserState`, `enterGuestMode`.
- One-shot guard against the dispatch loop I introduced in the original hotfix and caught with Claudette's B5 trace (~9 dispatches/sec until I added this flag).

### Custom events (the spine)

Two `CustomEvent`s, dispatched via `dispatchAuthEvt`:

- **`koyAuthRefreshed`** — fired by `sbF` after a successful 401-recovery refresh. Editor's listener calls `setToken(loadAuth().token)` to sync React state. AccountSettings listener does the same with `setAuth(loadAuth())`. **This is the localStorage→React-state sync mechanism that Dev B's upload retry depends on.** Don't sever it without a replacement.
- **`koyAuthExpired`** — fired by `sbF` after a 401-with-failed-refresh. Editor's listener calls `clearUserState()` via a `useRef`-captured latest reference (the stale-closure fix from Claudette's B5 escalation). AccountSettings listener calls `clearAuth(); nav("/")`.

### State-flow walk-throughs

**Login (happy path):**

```
User submits form → doAuth → POST /auth/v1/token
  → response with access_token, refresh_token, user, expires_at
  → sessionMarkActive()  (clears __sessExpired in case it was set)
  → setUser(r.user); setToken(r.access_token)
  → saveAuth({user, token, refresh_token, expires_at})
  → lProf(); lPages()
  → Editor render with user present, started=false → start screen
```

**Reload (auth restored from localStorage):**

```
Page load → Editor mount
  → useState init: initAuth = loadAuth() → user, token populated from storage
  → useEffect[] runs:
      saveAuth({user, token})  (re-stamps to ensure freshness)
      if (!profile) lProf(user.id, token)
      lPages(user.id, token)   ← I added this in Sprint 2 UI patch (Bug 2 fix)
  → second useEffect[] attaches koyAuthRefreshed + koyAuthExpired listeners
  → render
```

**1-hour expiry (refresh works):**

```
User clicks save → savePg → sbF PATCH → 401
  → sbF reads loadAuth() → has refresh_token → POST /auth/v1/token?grant_type=refresh_token
  → response with new access_token, new refresh_token, expires_at, user
  → sessionMarkActive()
  → saveAuth({user, token: new, refresh_token: new, expires_at: new})
  → dispatchAuthEvt("koyAuthRefreshed")
  → Editor's listener fires: setToken(loadAuth().token)
  → retry the original PATCH with new token → 204
  → control returns to savePg's .then → doInsert → POST 201 → success
```

**1-hour expiry (refresh fails — token revoked, network, etc.):**

```
User clicks save → savePg → sbF PATCH → 401
  → sbF reads loadAuth() → has refresh_token → POST /auth/v1/token?grant_type=refresh_token
  → response is null or no access_token
  → sessionMarkExpired() one-shot:
      __sessExpired = true
      clearAuth() (wipes localStorage)
      dispatchAuthEvt("koyAuthExpired")
  → Editor's listener fires clearUserState via clearRef.current
      clearRef is updated every render to the latest clearUserState
      (the useRef capture was the B5 fix — without it, the listener
       held the first-render's clearUserState forever, which is how
       the loop ran with a stale token reference)
  → clearUserState:
      idempotent guard: !user && !token → bail
      if (token && !__sessExpired) fetch /auth/v1/logout (skip on expired)
      sessionMarkActive() (reset for next login)
      clearAuth(); setUser(null); setToken(null); setProfile(null); ...
      nav("/")
  → throw SESSION_EXPIRED propagates back to savePg.catch → flash("red")
```

**Logout (clean):**

```
User clicks Log out → clearUserState()
  → token present, not expired → fetch /auth/v1/logout (best-effort)
  → sessionMarkActive() (reset flag)
  → clearAuth() (localStorage gone)
  → setUser(null); setToken(null); setProfile(null); saved/bks/started/sid all reset
  → nav("/") → auth screen
```

### Landmines

1. **The stale-closure listener.** Always re-bind via `useRef` for event handlers that need the latest version of a function defined in component scope. I learned this the hard way with B5 — the original listener captured the first-render's `clearUserState`, which captured the first-render's `user` and `token`, which is how the loop ran with stale credentials.

2. **`tk2("logout")` inside `clearUserState` was the loop fuel** in the original hotfix. Any analytics or write from inside the cleanup path can re-enter `sbF`, re-401, re-dispatch `koyAuthExpired`, re-enter `clearUserState`. **No writes from inside `clearUserState`. Ever.** Logout analytics is not worth the loop risk.

3. **Five logout-shaped UI affordances** existed before the hotfix, only one was correct. The architect's I4 (single owner) maps directly to this. Every "exit to auth screen" path must go through `clearUserState` and nothing else. The five paths:
   - Desktop dropdown "Log out" (was correct)
   - Mobile sheet "Log out" row (was correct)
   - Start-screen "Log Out" button (was broken: in-memory clear only)
   - Desktop "Log in" button when guest (was broken)
   - Mobile "Log in / Sign up" row when guest (was broken)
   - Plus `enterGuestMode` for "Continue as Guest" (calls `clearAuth()` proactively to prevent prior session bleeding into guest)

4. **`__sessExpired` is module-level state.** It's deliberately not in React. It must be reset by `sessionMarkActive()` on every fresh session start. If you forget to reset, the next 401 won't try to refresh and the user is one-shot logged out.

5. **The B7 short refresh_token** (12-19 chars) was a Supabase project-config artifact, not a parsing bug. If you see weirdness in token shape, check the raw response in Network tab before assuming a code issue. I burned a half-cycle on this — read the diagnostic note in `sbF` if you hit it.

---

## The B15 / koyAuthRefreshed boundary (the trick)

B15 says: token off renderable state. Per I1.

But: Dev B's upload retry depends on `koyAuthRefreshed` firing and components syncing the new token into their React state, so the next upload picks up the refreshed credential. If you naïvely move the token to a module-level ref and stop dispatching `koyAuthRefreshed`, Dev B's code breaks on a token-expired-mid-upload scenario.

The way through:

### Plan

1. **Module-level `__session`** — single source of truth for credentials:

   ```js
   var __session = { token: null, refresh_token: null, expires_at: null };
   function getToken() { return __session.token; }
   function getRefreshToken() { return __session.refresh_token; }
   function setSession(s) {
     __session.token = s?.token || null;
     __session.refresh_token = s?.refresh_token || null;
     __session.expires_at = s?.expires_at || null;
   }
   ```

   Initialized from `loadAuth()` at module load. Updated by `doAuth` success, `sbF` refresh success, `clearAuth` (sets to null).

2. **`sbF` reads from `getToken()` instead of `o?.token`.** Callers stop passing token through — they just call `sbF(path, {method, body})` and `sbF` attaches auth from the module.

3. **Components stop holding token in `useState`.** Editor's `token` state goes away. AccountSettings' `auth.token` goes away. Components that need "is there a session" use a non-credential signal (e.g., `user` state, which is OK — uuid and email aren't credentialed in the I1 sense).

4. **`koyAuthRefreshed` event stays.** It still fires after every successful refresh. Its job changes from "tell components to setToken" to "tell anyone caching a derived value (URL builders, upload retry logic, etc.) that the session was refreshed." Dev B's upload retry listener keeps working — they just call `getToken()` from inside the listener instead of receiving a token prop.

5. **Dev B's upload bypass adapter** — they're already constructing a raw fetch with `Authorization: Bearer ${token}`. The one-line change for them: replace `token` (from props or state) with `getToken()` (from the module). Their retry logic continues to work via the event.

### What I'll write in the relay to Dev B before I touch this

A one-paragraph migration guide: "The token left React state. Replace every read of `props.token` / `auth.token` / your captured token in upload code with `getToken()` from `App.jsx` module scope. The event you listen for is unchanged. Your retry logic works as before. The refactor is mechanical, ~5-10 lines on your side."

### Why this preserves I1

`__session` is not renderable. No component receives it as a prop or holds it in state. Error boundaries and devtools state snapshots don't see it. React's serialization paths can't reach it. The token is "in memory" but not in any layer React touches.

The user object (uuid, handle, email, is_premium) can stay in `useState` — it's identity, not credentials. I1's specific concern is the access and refresh tokens.

### The boundary I will not cross without a relay

Before I push the B15 fix to a preview, I send Dev B the one-paragraph migration note above and confirm they've seen it. PR description includes which lines of their upload code need the swap. If they're mid-upload-PR rebase, I wait for that to land first or coordinate the rebase with the architect.

---

## How I debug

Three patterns I lean on. Use them in this order.

### 1. Read the wire first

Before reading code: open DevTools → Network. Reproduce the bug. Look at the actual HTTP traffic. The "no network requests fire" observation in B10 was the entire diagnosis — once Claudette confirmed zero requests on the wire, I knew the user-mode gate was firing or the call site was misrouted. Reading code first would have cost hours.

Network tab plus `[sbF]` console logs together tell you 90% of what's happening. The remaining 10% needs source.

### 2. Identify the minimum reproducing path

The B10 bug looked like one bug. It was three.

- "Save click does nothing on the network." → misrouted button (Bug 3: the ⋯-menu Save handler was opening the modal, not calling savePg)
- "Saved list doesn't appear on reload." → missing `lPages` in mount useEffect (Bug 2)
- "Guest mode silently doesn't persist." → pre-existing UX trap (Bug 1)

Each had a different root cause, a different fix, a different test. The trap is reading "save doesn't work" as one issue and writing one fix. Separate them by what condition makes each one fire, fix each independently, test each independently. The "Outcome A/B/C/D" framing in my B10 diagnosis report exists specifically to force this discipline.

### 3. Catch the regression you're about to introduce

When I shipped the original auth hotfix, I introduced the `koyAuthExpired` dispatch — and the loop. Claudette caught it in audit. The lesson I took: every new event dispatch needs a one-shot guard before it ships, not after audit catches the storm. `__sessExpired` is that guard.

Pattern: if you're introducing a side effect that can be re-entered by a listener of an event you also dispatch, ask yourself "what stops this from looping" before writing it. If the answer is "nothing, the inputs won't repeat," prove it by walking the cycle out loud. Most of the time when I do this honestly, the answer is "actually there is a re-entry path" and I add the guard.

The B5 audit caught this for me once. Don't make me — or you — burn that grace twice.

---

## SQL / migration discipline

### SELECT before DELETE, always

Architect's instruction during the B12 cleanup: "targeted DELETE by id, not bulk." This is the discipline. Even with tight WHERE clauses, if you don't know exactly which row(s) you're hitting before the DELETE, you don't run the DELETE.

```sql
-- Step 1: confirm what you're about to delete
select id, user_id, name, created_at
from public.<table>
where <conditions>;

-- Step 2: delete by id from step 1, after eyeballing the result
delete from public.<table>
where id = '<exact-uuid-from-step-1>';

-- Step 3: verify the absence
select count(*) from public.<table> where id = '<exact-uuid>';
-- expect 0
```

This is slower. It catches mistakes. The cost of slow is hours; the cost of mistakes is days plus a trust hit.

### user_id safety belt

Every DELETE / UPDATE in a multi-tenant table includes `user_id = '<owner-uuid>'` in the WHERE clause even when filtering by primary key. Redundant but cheap. If a UUID I copy-pasted is somehow wrong, the user_id filter catches it. If the row was supposed to belong to user A and somehow belongs to user B, the DELETE returns 0 rows instead of incinerating someone else's data.

### Idempotent migrations

Every migration uses `drop policy if exists`, `create or replace function`, `alter table ... enable row level security` (idempotent if already enabled), `create unique index if not exists`. Re-running a migration must be a no-op. The B12 migration is the canonical example — Khalid can run it twice and the second run does nothing.

### One file per migration, named by scope

`sprint-1-migration.sql`, `sprint-2-migration.sql`, `b12-migration.sql`. Not `migration-2026-05-09.sql` — dates rot, semantics don't.

### RLS ships in the same migration as the table

Already noted under Stack & idioms, repeating because it's load-bearing per Invariant I3. CREATE TABLE without RLS in the same file is a defect. Future me, future you, future Claude: don't ship the table without the policy.

---

## Scar tissue

### Stream timeouts

Claude Code on the web has a known stream-idle-timeout bug. The Sprint 1 implementation hit it twice mid-paste. The discipline:

- After every meaningful change, run `npm run build` and commit. Push after every commit.
- If a chunk feels like it'll take more than ~5-10 tool calls, break into sub-steps and pause for the founder to say "go" between them. The Sprint 1 chunk-1-through-5 cadence was built around this.
- If you hit "API Error: Stream idle timeout - partial response received," commit what you have if you can, tell the founder which sub-step you stopped at, wait for restart. Don't try to recover the partial response.

### File partitioning with Dev B

Two devs in one `App.jsx` is workable if you partition. Dev A owns auth/session/state/save layer plus migrations. Dev B owns UI (block rendering, mobile layout, image upload UI). The same file gets edited but at different sections — Dev A near the top (sbF, doAuth, clearUserState, savePg, mount useEffects) and Dev B in the middle-to-bottom (BI, DB, MobileCard, image-upload helpers).

When in doubt about a touch point, post it on the relay before editing. The cost of a 30-second confirm is much less than a merge conflict on dense single-line JSX.

### Things that wasted hours I won't repeat

1. **Assuming the local repo's branch state matches origin.** Always `git fetch origin && git log --oneline ...origin/main` before branching for a hotfix. Main may have moved while you were working. The B12 doc PR almost branched off a stale local.

2. **Trusting a regex without testing it on real inputs.** The `extractYouTubeId` regex covers five URL shapes; I tested each separately before committing. Cheap.

3. **Believing "the call signature didn't change" without diffing.** When Claudette flagged the post-cc96069 logout 503, I diffed `64f6032..cc96069` on the fetch line itself, byte-by-byte, before claiming the call was unchanged. Felt obvious in hindsight; not obvious in the moment when there's pressure.

4. **The architect's "send the architect a one-paragraph compliance statement before touching auth code" rule from the State/Auth Invariant doc.** This is new for Sprint 3. I'll start every PR/relay with "Touches Invariants Iₓ, Iᵧ. Compliant because [...]." Anchor the practice from the first relay, not the third.

5. **Vercel preview URLs.** When the architect references a preview, ask which preview URL — there are three production-aliased domains plus per-branch previews. Trying to test against the wrong one cost a cycle in mid-Sprint-2. The canonical is `koy-calendar.vercel.app`; the others are aliases.

### One last thing

The founder is non-coder, lean, direct, and trusting. Don't pad responses. Don't ask three questions when one will do. When you're holding for a signal, say so in one line. When you're about to do something risky, say it before you do it, not after.

The architect (Claudesson Jr.) gives clear scope. Stay in it. If a task tempts you out of scope — auth code touch when the brief says SQL only — stop and flag, don't proceed. That instinct saved Sprint 2's close-out once already.

Good luck. You're inheriting a foundation that has scars but stands. Sprint 3 is where the auth/state layer gets cleaned up properly under the Invariants. The map above is the inheritance.

— Dev A
