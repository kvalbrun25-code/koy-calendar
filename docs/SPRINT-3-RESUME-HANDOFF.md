# SPRINT 3 — RESUME HANDOFF (Windows → Ubuntu transition)

**Written by Prime at the OS-transition boundary. Everyone was mid-work; this captures exact state so we resume cleanly on Linux.**

## Production state (all safe on GitHub)
- **`main` = `a1dd647`** — LIVE at koy-calendar-z2kf.vercel.app. Contains: Phase B + **iOS patch** (GIF hero on all devices, scroll-cue illumination, spread hide-until-loaded, reversible tile zoom) + **B15** (access token off React state, I1 closed; doAuth error-handling hardened, I5).
- **Supabase** `iydmygawfvpotxmxddju` = ACTIVE_HEALTHY (was paused → restored this session; that pause was the real cause of the "B15 login broken" scare).
- Branches on GitHub: `ios-patch-phase-b` (merged), `b15-token-isolation` (merged), and this handoff branch. Everything code-side is in the cloud — nothing to lose on reboot.

## Sprint 3 status (the auth block)
| Item | Status | Notes |
|---|---|---|
| **B15** | ✅ DONE, LIVE | token off state (I1) + login error messages (I5) |
| **B16** | ⏳ NOT STARTED | Dev A was interrupted before output. Fix: `clearUserState()` calls `sessionMarkActive()` mid-logout, re-arming `__sessExpired` and defeating the terminal guard. Make logout reach ONE clean logged-out state. (`enterGuestMode()` also calls it — that one is likely correct; reason per-path.) File: `src/App.jsx`. Invariant I4. |
| **B11** | ⏳ NOT STARTED | Half-authed "tokenless shell" (user present, token gone). Enforce legal session states; every logout/guest/expiry path reaches one defined logged-out state, no residue. File: `src/App.jsx`. Invariant I4. |
| **Staged refactor + App.jsx split** | ⏳ back half of Sprint 3 | Do AFTER B16/B11 (same file — must serialize). |

## Parallel prep (Sprint 4 / Phase C)
| Lane | Status | Notes |
|---|---|---|
| **Dev B — Sprint 4 refactor blueprint** | ⏳ NOT STARTED | Never dispatched. Task: file-split map for App.jsx → `lib/auth`, `lib/supabase`, `lib/upload`, `components/*` + skeleton scaffolds. Non-colliding (no App.jsx edits). Respect I1 (token in auth module) + I2 (sbF single gate). |
| **CD — Glam Phase C template spec** | ✅ DONE | `cd-glam-phasec/GLAM-PHASEC-TEMPLATE-SPEC.md` + `preview.html`. 12 editable slots; recommended cool element = **editable neon sign** (types the user's phrase on load); B5 `.kl-frag--glam` tile = crop of selfie+neon corner. PENDING founder Taste sign. 3 open Qs: cool-element choice, product-shelf flavor text field, tile crop framing. |

## The Glam template asset (founder-created — IMPORTANT)
- Founder made a superior Glam Girl template (pink Y2K collage) and had the sample text removed via AI. **This is the canonical Glam direction; the old A/B tile mockups are shelved.**
- Original (with text): `C:\Users\wizkh\Downloads\glam template.png` (persists locally, Windows side).
- **Cleaned (text removed):** Higgsfield job `e69a37d3-f24a-4249-a170-2e4bcaafdb30` (re-view via `job_display`). Raw URL: `https://d8j0ntlcm91z4.cloudfront.net/user_3DyVHCDcT95kzNrtncPPFh4jUMR/hf_20260711_223204_e69a37d3-f24a-4249-a170-2e4bcaafdb30.png`
- ⚠️ **Founder action before reboot:** download the cleaned version from the Higgsfield widget — the sandbox can't reach cloudfront to cloud-save it, and Windows Downloads won't carry to Ubuntu.

## Founder directives (carry forward — canon now)
1. **Chunk all work small.** Agents and Prime split tasks into small pieces / short bash commands to avoid timeouts and interrupts.
2. **Don't gate internal coordination.** Lanes work autonomously among themselves; Prime does not pause for the process. The three founder gates still apply to what ships: Taste (look), Merge (nothing to `main` without founder), Invariant (auth/security). For auth changes specifically, keep the practical login smoke before a production merge.
3. **Moving to Ubuntu/Linux** — Windows sandbox was flaky.

## Environment gotchas seen on Windows (watch for on Linux)
- bash sandbox stalled/locked repeatedly (ENOTEMPTY on `npm install`; "process already running"). Workaround: build from `/tmp`, retry, keep commands short.
- Mount writes to large files (App.jsx 83KB) truncated / injected null bytes via the Edit tool AND once via my own Edit. Use **Python scripted writes** for App.jsx + verify after every write (no null bytes, `tail -1`==`export default App;`, ~103 lines).
- Vercel connector is read-only (can't create projects); deploys happen via git push → auto-preview. GitHub PAT is wired for pushes.

## First moves next session (Linux)
1. Dev A → **B16** (chunk 1), then **B11** (chunk 2) — small edits, Python writes, build, push branch, founder login smoke, merge.
2. Dev B → **Sprint 4 blueprint** (parallel, no App.jsx).
3. Founder → review CD's Glam Phase C spec (Taste), answer the 3 open Qs.
4. Then: staged App.jsx refactor → Sprint 4 package arch → Phase C (Glam template ships).

— Prime
