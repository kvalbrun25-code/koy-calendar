# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```
npm run dev       # start Vite dev server
npm run build     # production build to dist/
npm run preview   # preview the production build locally
```

There is no lint or test script configured (no test framework is installed). Verify changes by running `npm run dev` and exercising the affected flow in the browser.

## What this is

Koy is a customizable page-builder ("your page, your rules") — users drag/style blocks (calendar, text, stickers, embeds, images, comments) onto a canvas and get a public URL at `/u/{handle}`. It is not a productivity tool, Linktree clone, or calendar app; treat it as self-expression/creator-economy product, not a utility app.

## Architecture

- **`src/App.jsx`** is the entire application: all routes, all editor logic, all templates, all Supabase calls. It's intentionally a single dense file (see coding conventions below) — read the relevant function in full before editing rather than assuming structure from a file layout.
- **`src/main.jsx`** — entry point, wraps `<App/>` in `<BrowserRouter>`.
- **`src/Landing.jsx`** — a separate marketing landing page (`/landing` route), shipped independently of the Editor. It has its own CSS namespace (`.kl-*` in `koy-landing.css`) specifically so it cannot bleed into the Editor's inline-styled UI. Don't cross-wire the two.
- Routes (defined at the bottom of `App.jsx`): `/` (Editor — auth gate → template picker → canvas), `/account` (settings), `/u/:handle` (public read-only page), `/u/:handle/edit` (redirects to `/`), `/landing`.

### Supabase access — no supabase-js client

The app talks to Supabase via raw `fetch`, not the `@supabase/supabase-js` SDK. Key pieces in `App.jsx`:
- `SB`/`SK` — hardcoded Supabase project URL + publishable anon key (expected to be public in a client bundle; not a secret).
- `sbF(path, opts)` — the REST/RPC fetch wrapper. Handles 401s by transparently refreshing the session via `refreshSession()` and retrying once; throws `SESSION_EXPIRED` if refresh fails. Always go through this for `/rest/v1/*` and `/rpc/*` calls rather than calling `fetch` directly.
- `sbA(endpoint, body)` — auth-specific POSTs (`signup`, `token?grant_type=password`, etc.).
- `uploadToStorage(...)` — Supabase Storage upload with the same refresh-and-retry pattern, tier-based size limits (5MB free / 25MB premium), and MIME allowlist.

### Auth state lives outside React

The access token is **not** stored in React state — it lives in a module-level `__session` variable (`getToken()`/`getRefreshToken()`/`getSessionUser()`), backed by `localStorage` via `saveAuth()`/`loadAuth()`/`clearAuth()`. This was a deliberate security hardening (see commit history around "B15" / "access token off React state") — don't reintroduce the token into `useState`. `sessionMarkExpired()`/`sessionMarkActive()` plus the `koyAuthExpired`/`koyAuthRefreshed` window events coordinate logout/refresh across components (`Editor`, `AccountSettings`).

### Templates

`TPLS` in `App.jsx` is the array of starter templates (each with page settings + a `bk` block array). Templates are **copied at save time, not referenced** — a template update must never propagate into a user's already-saved page. Preserve this when touching template data.

### Data model (Supabase/Postgres)

- `profiles` — one per user (handle, display_name, is_premium, data_sharing).
- `pages` — saved layouts; `page_settings` + `blocks` as jsonb; only one `is_active=true` per user (unique constraint).
- `comments`, `user_events` (analytics/training-data table, nullable `user_id` for guests).
- `calendar_entries` — current per-day calendar data (superseded the legacy `trading_days` table).
- Migrations are plain SQL files in the repo root (`sprint-1-migration.sql`, `sprint-2-migration.sql`) rather than a migration tool — new schema changes should follow that pattern unless told otherwise.

### CSS

Plain CSS with a class-prefix-per-layer convention, no framework:
- `styles/koy-tokens.css` — design tokens (must load first; theme values only, semantic layer references them).
- `styles/koy-chrome.css` — `kc-` prefix, editor toolbar/shell/panels/modals.
- `styles/koy-state-comm.css` — `ks-` prefix, loading/success/error/confirm state primitives.
- `styles/koy-landing.css` — `kl-` prefix, Landing page only.

## Non-negotiable coding conventions

These are documented project rules, not stylistic suggestions — violating them has broken builds before:

- **React imports**: always named imports (`import { useState } from "react"`), always `function` declarations for components, always `export default App` as its own line at file bottom. Never `import React, { ... }` + `export default function App()` — this pattern has produced build errors in this project's toolchain.
- **No new dependencies without justification.** Stack is React + Vite + react-router-dom + raw-fetch Supabase. Do not add UI kits (Material UI, Chakra), animation libraries (Framer Motion), or CSS frameworks (Tailwind is not installed) — plain CSS/inline styles are the convention.
- **Mobile detection** is `useIsMobile()` reading `window.matchMedia('(max-width: 767px)')` — never user-agent sniffing.
- Below 768px, rendering is a single-column stack ordered by each block's desktop `(y, x)`; dragging is disabled entirely on mobile (tap → action sheet). Don't build separate mobile-only layouts — same blocks, different rendering path.

## Historical/planning docs

`KOY CALENDAR — PROJECT HANDOFF`, `KOY-SPRINT-1-SPEC.md`, and `KOY-SPRINT-2-SPEC.md` in the repo root are architect-authored planning docs with a lot of product strategy, data-model rationale, and "why" behind decisions (e.g. why templates are copy-not-reference, why auth is email/password only, the seven "MySpace-aware" product protections). They are useful for context but **go stale quickly** — the handoff doc in particular is dated mid-Sprint-2 and predates work visible in git log (Sprint 2.5 design pass, the B15 auth-security branch, etc.). Treat `git log` and the current code as the source of truth over these docs when they conflict.

---

## ⚠️ App.jsx write hazard — READ BEFORE ANY EDIT TO App.jsx

`src/App.jsx` is a single ~103-line file of extremely dense minified-style JS (~83KB). Editing it has repeatedly corrupted the file.

**Observed failure modes:** string-replace/patch tooling has silently truncated the file mid-write and injected null bytes. This has happened with multiple editors, including agentic ones. The file appeared to save successfully and only failed at build time — or worse, built and failed at runtime.

**Required practice:**
1. Prefer **surgical, single-function replacements** over rewriting regions. Anchor on the full function signature and replace the whole function body in one operation.
2. **After every write to App.jsx, verify all four:**
   ```
   wc -l src/App.jsx                       # expect ~103 lines
   grep -qP '\x00' src/App.jsx && echo CORRUPT || echo clean
   tail -1 src/App.jsx                     # must be exactly: export default App;
   npm run build                           # must succeed
   ```
3. If any check fails: `git checkout -- src/App.jsx` and retry. Do not attempt to repair a corrupted App.jsx in place.
4. Never batch multiple unrelated App.jsx edits into one write. One logical change per write, verify, then proceed.

**Line count is a canary.** A significant drop means truncation, not tidy code.

---

## Auth invariants — do not violate

These were established across Sprint 3 (B15, B16, B11) and are load-bearing. Any change touching auth must preserve all of them.

- **I1 — Token off React state.** The access token lives in module-level `__session`, never in `useState`. Reintroducing it into React state re-opens the vulnerability B15 closed.
- **I2 — `sbF` is the single gate.** All `/rest/v1/*` and `/rpc/*` traffic goes through `sbF()`. No direct `fetch` to those paths. It is the only place session-refresh-and-retry is correctly implemented.
- **I4 — One legal logged-out state.** Every path out of an authenticated session (logout, guest entry, expiry) must reach exactly one defined logged-out state. No residue, no half-authed "tokenless shell" (user object present, token gone).

**Ordering rule inside `clearUserState()`:** React state is nulled *first*, `clearAuth()` runs *last*. Clearing the token before the user object opens an observable window where a render sees user-without-token. This is the B11 bug — do not reintroduce it by "tidying" the order.

**Terminal-state rule:** logout sets `__sessExpired = true` (terminal). It must NOT call `sessionMarkActive()` — that re-arms the session guard and defeats it. This is the B16 bug.

`enterGuestMode()` calling `sessionMarkActive()` **is correct** and is not the same bug — guest is a fresh legal state with no token to go stale, and it must be able to reset the flag after a logout. Reason per-path; do not "fix" both to match.

---

## The three founder gates

Nothing ships without these. Claude Code does not self-approve any of them.

| Gate | Covers | Who signs |
|---|---|---|
| **Taste** | Anything visual — layout, type, color, motion | Founder |
| **Merge** | Nothing reaches `main` without explicit founder approval | Founder |
| **Invariant** | Any change touching auth, session, or security | Founder + smoke test |

**Auth smoke test** (required before any auth change merges to `main`):
1. Log in with real credentials → lands on page, handle shows
2. Log out → clean return to auth screen, no logged-in flicker
3. Log back in immediately → works *(catches B16 regression)*
4. Log out → Continue as Guest → enters clean *(catches B16 regression)*
5. Guest → Log in → works
6. Log in → hard refresh → still logged in
7. Log in → log out → repeated hard refresh → no tokenless shell *(catches B11 regression)*

Work on a branch. Push the branch. Vercel auto-builds a preview. Smoke on the preview. Merge only after founder sign-off.

---

## Working style

- **Chunk work small.** Long operations have historically timed out or been interrupted mid-write, which is precisely when App.jsx corrupts. Prefer many small verified steps over one large one.
- **Serialize App.jsx work.** It is a single file — parallel edits to it will collide. Only one workstream touches App.jsx at a time.
- **Explain in plain English.** The founder has no formal CS/design background and learns fast, but jargon without unpacking is friction, not signal. Skip obvious steps; don't skip reasoning.
- **Directness over validation.** Say what's actually true about tradeoffs and risk. Flag real problems early rather than agreeing and discovering them later.

---

## Sprint 3 status (current)

- ✅ **B15** — token off React state (I1), doAuth error handling (I5). Merged.
- ✅ **B16** — logout no longer re-arms `__sessExpired`. Merged (`edf1a78`).
- ✅ **B11** — no half-authed tokenless shell; clearAuth ordered last. Merged (`edf1a78`).
- ⏳ **App.jsx split / staged refactor** — the back half of Sprint 3. Next up.

**Refactor target shape:** `lib/auth` (owns `__session`, honors I1), `lib/supabase` (owns `sbF`, the single I2 gate), `lib/upload`, `components/*`. The auth invariants must survive the split — that is the primary risk of this refactor, not build breakage.

---

## Phase C — Glam template (parked, downstream)

Founder-created pink Y2K collage is the canonical Glam direction; the old A/B tile mockups are shelved. Optimized assets (`glam-bg.webp`, `glam-tile.webp`, `glam-thumb.webp`) belong in `public/templates/glam/` — not yet committed. Spec at `docs/phase-c/`. Three open questions pending founder Taste sign-off: cool-element choice (editable neon sign recommended — the sign is already in the source image), product-shelf flavor text field, tile crop framing.
