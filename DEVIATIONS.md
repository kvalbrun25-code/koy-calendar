# DEVIATIONS

## D1 — `uploadToStorage` 401 guard changed from `__sessExpired` to `!getToken()`

**Location:** `src/lib/upload.js`, inside `uploadToStorage`, the `if(r.status===401)` block:

```js
if(r.status===401){if(!getToken())return{error:"session expired — please log in again"}; ... }
```

### 1. What the instruction / original code said

The pre-extraction original in `App.jsx` (as of commit `c7cb762`) guarded the 401 branch with the **session-expired flag**, not the token:

```js
if(r.status===401){if(__sessExpired)return{error:"session expired — please log in again"}; ... }
```

`isSessionExpired()` was added to `lib/auth.js` (line 6, `return __sessExpired`) and exported (line 15) **specifically** to be the read-only, module-boundary-safe replacement for that direct `__sessExpired` read — since `__sessExpired` is now private to `auth.js` and can't be referenced from `upload.js`. The intended extraction was:

```js
if(r.status===401){if(isSessionExpired())return{...}; ... }
```

### 2. What was done instead

The extraction imported `isSessionExpired` into `upload.js` (line 2) but **never called it**. The guard was rewritten to `if(!getToken())` instead. So the extraction silently swapped one predicate (`session has been marked terminally dead`) for a different predicate (`no access token is currently held`).

### 3. Why — are they equivalent?

**No. They are two distinct predicates that happen to agree on the common path into this handler.**

Definitions from `auth.js`:
- `getToken()` → `__session && __session.token` (line 12) — truthy iff a token object is currently held.
- `isSessionExpired()` → `__sessExpired` (line 6) — true iff `sessionMarkExpired()` has fired and not been reset by `sessionMarkActive()`.

**Does `sessionMarkExpired()` produce a "token present, session dead" state?** No.

```js
function sessionMarkExpired(){if(__sessExpired)return;__sessExpired=true;clearAuth();dispatchAuthEvt("koyAuthExpired")}   // line 4
function clearAuth(){__session=null; ... }                                                                             // line 10
```

`sessionMarkExpired()` sets the flag **and** calls `clearAuth()`, which nulls `__session`. So the instant the session is marked dead, the token is also gone. In that exact post-expiry state:
- `!getToken()` → `true`
- `isSessionExpired()` → `true`

They agree. This is why the current code has no observable bug on the ordinary "our own refresh failed → mark expired" path — the two flip together.

**Where they diverge (why they are not equivalent):**

- **Direction A — token absent, but NOT expired.** Fresh load / clean logout / guest entry: `loadAuth()` returns `null` so `__session` is `null` → `!getToken()` is `true`, while `__sessExpired` is `false` → `isSessionExpired()` is `false`. Here `!getToken()` reports "session expired" for a session that was never expired. In this handler you needed a truthy `token` **argument** to get past the pre-POST guard (`if(!userId||!blockId||!token)`), but `!getToken()` re-reads the **module** token at response time, so a clean logout landing between request and 401 response would take this branch and mislabel the state. Outcome (don't retry, tell user to log in) is still safe; the label is wrong.

- **Direction B — token present, but expired flag set.** This is the state your question names. `sessionMarkExpired()` cannot create it (it clears the token). It is only reachable if some `saveAuth()` runs **after** the flag is set **without** a paired `sessionMarkActive()` reset. Every current `saveAuth()` in a refresh-success path is preceded by `sessionMarkActive()` (`supabase.js:3`, `upload.js:4`, `App.jsx:49`), so this state is **presently unreachable**. In it, the predicates would disagree in the dangerous direction: `!getToken()` → `false` (proceeds to refresh a terminally-dead session), `isSessionExpired()` → `true` (correctly bails). This is precisely the invariant the original `__sessExpired` check defended without depending on caller discipline.

**Verdict:** Equivalent on today's hot path, not equivalent in general. `isSessionExpired()` is self-contained — it asks "has this session been declared dead?" `!getToken()` asks a weaker, adjacent question — "is there no token right now?" — and its correctness is only propped up by the external discipline that every token write is paired with `sessionMarkActive()`. The original check did not lean on that coupling.

### 4. What breaks if it's reverted

Reverting here means restoring the intended `isSessionExpired()` call (the faithful extraction). **Nothing breaks** — this is the safer direction. It:
- Restores exact behavioral parity with the pre-extraction `App.jsx` (`__sessExpired` semantics), so the extraction becomes truly behavior-preserving as intended.
- Removes the dead import warning (`isSessionExpired` is currently imported, never used — `upload.js:2`).
- Re-decouples the terminal-state guard (B16) from the "every `saveAuth` pairs with `sessionMarkActive`" discipline, closing Direction B before any future code can open it.
- Stops mislabeling clean-logout / guest states as "session expired" (Direction A).

The only thing lost by reverting is the incidental behavior that `!getToken()` **also** bails when a token is absent for non-expiry reasons — but in this handler that path is already handled downstream (`loadAuth()` returns no `refresh_token` → `sessionMarkExpired()` + same error), so nothing depends on `!getToken()` catching it early.

**Conclusion:** This is not a justified deviation — it is unintended semantic drift introduced during extraction. The correct action is to use `isSessionExpired()` as originally intended. (No code changed yet, per instruction.)
