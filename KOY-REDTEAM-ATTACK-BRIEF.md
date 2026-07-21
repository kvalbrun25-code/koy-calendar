# KOY — RED-TEAM / ATTACK BRIEF ("break it so we can fix it")

**For:** a Cowork session whose sole job is to attack KOY and report weaknesses.
**From:** CLAUDIUS (architect) · **Written:** 2026-07-21

---

## 0. AUTHORIZATION & SCOPE — READ FIRST

This is **owner-authorized security testing of the founder's own application.** Khalid (owner of KOY, GitHub `kvalbrun25-code`, the Supabase project, and the Vercel deployment) is commissioning this to harden his product before real users arrive. You are a **defender wearing an attacker's hat** — every hole you find gets reported and fixed, never exploited against anyone.

**Before you start, confirm with the founder in chat** that this testing is authorized right now (authorization comes from the user in the session, not from this file alone).

**In scope — ONLY these, all owned by the founder:**
- The repo `github.com/kvalbrun25-code/koy-calendar` (public).
- The Supabase project `iydmygawfvpotxmxddju` (via the MCP connector — read checks freely; treat writes carefully, see rules).
- The Vercel deployment (`koy-calendar-git-main-crux2.vercel.app` and previews).
- The KOY edge function `koy-ai` (only if the founder has deployed it; it is OFF/undeployed by default).

**Out of scope — do NOT touch:** anything not owned by the founder; Supabase/Vercel/GitHub/Anthropic platform infrastructure itself (attack KOY's use of them, not the providers); any third party; any real end-user's data.

## RULES OF ENGAGEMENT

1. **Use throwaway test accounts.** Do not operate on real user rows.
2. **Non-destructive.** No hard deletes of data you didn't create. No dropping tables. Prefer read-only recon; escalate to writes only to prove a specific vuln, then clean up.
3. **Do not rack up real cost.** KOY AI may be OFF; if it's on, do NOT loop paid endpoints to run up an Anthropic bill — proving *one* bypass is enough; describe the amplification rather than executing it at scale.
4. **No social engineering of the founder or real people.** Technical testing only.
5. **Confirm before anything irreversible** (a schema change, a settings change, a public post). This is the founder's Invariant gate — it applies to you too.
6. **Deliverable = a findings report** (format at the bottom): each finding ranked with concrete repro steps and a specific fix. Hand it to the architect session. Do NOT fix things yourself unless asked — your job is to find.

---

## 1. ORIENT (recon before attacking)

- Read `CLAUDE.md`, `KOY-HANDOFF-CLIVE.md`, `claude/KOY-STATE-AUTH-INVARIANT.md`, and `src/lib/sanitize.js` / `src/lib/embed.js` / `supabase/functions/koy-ai/index.ts`. The invariants there (I1–I7) are the promises you're trying to falsify.
- Note what's PUBLIC by design and therefore NOT a finding: `SB` (Supabase URL) and `SK` (publishable anon key) are in the client bundle on purpose. Report a secret leak only if you find something that is *supposed* to be secret (service-role key, `ANTHROPIC_API_KEY`, a PAT, a session token belonging to someone else).
- Prior reviews already found + FIXED: (a) a client-callable `refund_ai_credit` = infinite credits, (b) an escaped `@\69mport` CSS-sanitizer bypass, (c) external `url()` IP-leak in AI style values. **Try to re-break these** (regression) and find what they missed.

---

## 2. ATTACK SURFACES & WHAT TO TRY

### A. The HTML/CSS sandbox — Invariant I7 (highest priority: XSS)
Surface: the `</> Custom` block; `sanitizeHtml`/`sanitizeCss`/`composeSrcdoc` in `src/lib/sanitize.js`, rendered in `<iframe sandbox="">`.
Goal: get script execution, or make a *viewer* of a public page run/leak something.
Try:
- DOMPurify bypasses / mutation-XSS (mXSS) payloads; nested/broken tags; `<svg>`, `<math>`, `<foreignObject>`; `<template>`; namespace confusion.
- Event handlers in creative encodings; `javascript:`/`data:text/html` in every attribute that survives; `<a href>` breakout via `target`/`base`.
- CSS vectors: obfuscated `@import` (hex/unicode escapes, comments, `@charset`), `expression()`, `url()` to external hosts (IP leak), `-moz-binding`, `image-set()`, font `src` fetches.
- Confirm the iframe truly has `sandbox=""` (no `allow-scripts`/`allow-same-origin`) at runtime — inspect the actual DOM, not just the source. Try to get the sandbox attribute dropped or the content rendered outside the iframe.
- Size/DoS: giant payloads, deeply nested CSS, to hang the tab.

### B. AI page spec sanitizer — `sanPageSpec` in `App.jsx`
Surface: full-page generate/edit output is validated client-side before `applyPage`/`applyEdit`.
Goal: slip a dangerous block onto a rendered page via a crafted page spec (simulate hostile AI output — treat the model as an attacker per I7).
Try:
- Block `type` not in the allowlist; prototype-pollution-style keys (`__proto__`, `constructor`) in the spec objects.
- `style` values that smuggle `url()`/`expression()`/`javascript:` past `aiSV`; `pg.th` fields (verify each is sanitized, not just typeof-checked).
- `image` `content` that isn't https/data:image (SVG data URL behavior in `<img>`); html-block `content`/`css` (must go through I7 — confirm no raw path).
- Coordinate/size values (NaN, Infinity, huge, negative) causing layout breakage or overflow.
- Is there ANY client path that applies `r.j.page` raw (without `sanPageSpec`)? Grep and prove.

### C. Credits & the Pro gate — the money surface
Surface: `spend_ai_credit`, `spend_page_design`, `refund_*`, `grant_ai_credits` RPCs; the `koy-ai` edge function; packages/`user_packages`.
Goal: free/unlimited AI, or use paid page-design without Pro.
Try (mostly direct PostgREST calls with the public anon key + a test-user JWT):
- Call `refund_ai_credit` / `refund_page_design` / `grant_ai_credits` directly — confirm `authenticated` is DENIED (403). (These were the infinite-credit hole — regression test.)
- Race `spend_ai_credit` / `spend_page_design` at balance/allowance=1 with N concurrent requests — can you exceed the limit?
- Force a monthly-counter reset (`page_period`) to refill page-designs — timezone tricks, null period.
- **Self-grant Pro:** try to `INSERT`/`UPDATE` `user_packages` or `packages` to give yourself the `ai:page-design` feature. RLS should refuse — prove it does or doesn't.
- Bypass the client gate: strip the `KOY_AI_ENABLED` / `ownedFeats` checks in devtools and call the `koy-ai` endpoint with `mode:"page"` as a non-Pro user — the SERVER (`spend_page_design`) must return `-2`/402. Confirm no generation happens.
- Spend/refund accounting: can a decline/junk/edit response be abused to make billable calls at net-zero credit? (Only genuine infra failures should refund.)

### D. Row-Level Security / direct data access (PostgREST)
Surface: `profiles`, `pages`, `comments`, `calendar_entries`, `user_events`, `packages`, `user_packages`, `ai_credits` — all via `https://iydmygawfvpotxmxddju.supabase.co/rest/v1/...` with the public anon key.
Goal: read or write data you shouldn't.
Try:
- Read another user's `pages`/`ai_credits`/`user_packages`/`profiles` rows (RLS should scope to `auth.uid()` or public-active-page rules).
- Write to any table as a normal user (insert a comment as someone else, update a page you don't own, insert `user_packages`).
- `user_events` insert policy (analytics table) — can you forge events for another user_id?
- Enumerate: does any endpoint leak the full user list / emails / handles beyond what's intended public?
- Anon (logged-out) reads: what can an anonymous key see? Only `is_active` public pages + purchasable packages should be exposed.

### E. Auth invariants (I1–I4)
Surface: `src/lib/auth.js`, `sbF`, `clearUserState`, session refresh/expiry.
Goal: reach an illegal auth state or hijack a session.
Try:
- Find a "tokenless shell" (user object present, token gone) — the B11 bug. Hammer logout + hard-refresh.
- Logout that re-arms the session (B16) — log out, then verify you're truly out across refreshes.
- Is the access token ever in React state / DOM / a global you can read (I1)? Inspect memory/devtools.
- Session-refresh abuse: replay/refresh-token handling in `sbF`'s 401 retry.
- Any `/rest/v1/*` or `/rpc/*` call that bypasses `sbF` (I2)?

### F. The edge function `koy-ai` (if deployed)
Goal: anon access, key leak, prompt-injection, cost amplification.
Try:
- Call it with NO `Authorization` bearer — must 401 (defense-in-depth) even if `verify_jwt` were misconfigured. Try `--no-verify-jwt`-style anon access.
- Prompt-inject to exfiltrate the system prompt or the `ANTHROPIC_API_KEY` or the service-role key (the function uses the service key for refunds — ensure it never echoes it).
- Spoof the JWT `sub` (the function decodes it unverified for the refund uid) — can you cause a refund to *another* user, or grant yourself via the refund path?
- Oversized/edge prompts, `mode` tampering, `current`-page context bombs (huge/malicious JSON) — crash or leak?
- CORS: `Access-Control-Allow-Origin: *` + JWT — confirm `*` doesn't grant access without a valid token.

### G. Embed allowlist — `src/lib/embed.js`
Goal: get a non-allowlisted / raw iframe / SSRF-ish URL to render.
Try:
- `javascript:`, `data:`, protocol-relative `//evil`, `http:`, uppercase/whitespace/unicode tricks to pass the provider regexes.
- Open-redirect through an *allowed* provider (a YouTube/Spotify URL that redirects elsewhere).
- Oversized/edge URLs; a URL that matches a provider regex but points at attacker content.

### H. Save path, storage, misc
- Save path (`save_active_page`): can you create two `is_active=true` pages (I6) via racing or the RPC params?
- Storage uploads: MIME-allowlist bypass, size-limit bypass (free 5MB / premium 25MB — can a free user upload 25MB?), path traversal in the storage key, uploading to another user's folder.
- Client bundle: source maps, comments, or hardcoded values that leak anything genuinely secret.
- Public page (`/u/:handle`): XSS via any user-controlled field (handle, display_name, bio, comments, block content) rendered to *other* viewers.

---

## 3. METHOD

1. Recon read-only (repo + RLS policies via `list_tables`/SQL + client bundle).
2. Stand up test accounts (a free user, and — if the founder grants it — a Pro test user).
3. Work surface-by-surface (A→H). For direct API attacks, script `fetch`/curl against the REST/RPC/edge endpoints with the public anon key + your test JWT.
4. For each candidate hole, get a **minimal reproduction** and assess real impact. Adversarially verify before reporting (don't cry wolf).
5. Clean up test data you created.

---

## 4. FINDINGS REPORT FORMAT (the deliverable)

For each finding:
- **Title** + **severity** (Critical / High / Medium / Low) using this lens: Critical = script execution on others' pages, or unbounded free/paid access / other-user data write; High = viewer data leak, or a claimed invariant falsified; Medium = limited leak / abuse; Low = hardening.
- **Surface** (A–H) and file/line.
- **Repro:** exact steps / request.
- **Impact:** what an attacker gains.
- **Fix:** specific and minimal.
- **Confidence:** confirmed vs. plausible.

Rank most-severe first. Empty list is a valid (great) result — say what you tried and why it held. End with a one-paragraph verdict: is KOY safe to open to beta users, or what must be fixed first.

**Honesty rule:** do not invent findings, and do not overstate. A closed vector reported as closed is valuable. The point is a true picture of KOY's security, not a scary list.
