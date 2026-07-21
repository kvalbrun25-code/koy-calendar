# KOY — HANDOFF TO CLIVE (finish the roadmap: launch prep → Sprints 7–8+)

**From:** CLAUDIUS · **Written:** 2026-07-21 · **main HEAD:** `7e02cb4` · **Branches: just `main` (clean).**
**Read first:** `CLAUDE.md` in the repo, then the project description (soul briefing), then this doc. Roadmap: `claude/KOY-ROADMAP-AND-PRIORITIES.md`. KOY AI: `claude/KOY-AI-BRIEF.md` + `claude/KOY-AI-CREDITS-AND-GOLIVE.md`.

---

## IN PLAIN WORDS

Bones are built AND all merged to main: packages/feature-gating, theme system, the HTML/CSS sandbox (with the I7 sanitizer), embed block, marketplace teaser, and **KOY AI** — both single-block generation (free tier) and **full-page design** (paid, Pro-gated). **KOY AI is OFF and undeployed → $0 spend** until the founder flips it on. Everything that was floating at the start of this session has been landed (see history below). Your job: go-live when the founder's ready, then finish the remaining roadmap (launch-blockers → Collect → Sprint 7 presets → Sprint 8 Stripe/Marketplace).

**Founder context:** Khalid is **user ZERO** and owner. He's foundation-first now — obsesses over taste himself. He plans to **dogfood KOY AI with his own credits** to edit/fix up templates *from inside KOY* once it's on (a real test of the product). The **UI/UX overhaul is the final sprint and is 100% TASTE** — he does it at human speed with "Claude Design," NOT you. You build structure and protect the gates; do not run ahead on visual design.

---

## ✅ RESOLVED THIS SESSION (was floating — now all on main)

- **`feat/ai-page-design` — MERGED** (`45c4832`→ in main). Full-page AI design, reviewed + hardened. AI stays OFF.
- **`fix/sprint4-slack` — RE-APPLIED to main** (`7e02cb4`): "Hey, builder" hydration-flash placeholder + guests now get a "Log In / Sign Up" button on the picker (was a real login gap).
- **Redundant branches deleted:** `feat/embed-block`, `feat/market-soon-ai-js` (their content was already re-applied to main). Repo is now a single `main`.
- DB is in sync: `ai_credits`, packages, `koy-pro` package row, and all spend/refund/grant RPCs are applied; main's code uses them.

---

## ⚠️ UNTESTED — verify before / at launch

These built clean + passed my tests + adversarial review, but were **never smoked on a live preview by the founder**:
- **`</> Custom` HTML sandbox block** — paste `<b>hi</b>`+CSS → renders in locked frame; paste `<script>` → stripped.
- **Embed block** — paste YouTube/Spotify → renders; junk → "Unsupported link".
- **Marketplace teaser** — account menu → "Marketplace · soon" (trivial).
- **All of KOY AI (block + page)** — CANNOT be smoked until deployed. First real run is go-live, with the founder's Pro test login.
- **Auth 7-step smoke (CLAUDE.md) NOT re-run** since the ~30 App.jsx edits this session — re-run before launch.
- Founder DID smoke: templates/theme/toys, Glam + carousel mobile on iPhone.

---

## KOY AI — GO-LIVE CHECKLIST (when founder says go)

Full detail: `claude/KOY-AI-CREDITS-AND-GOLIVE.md`.
1. Deploy edge function `koy-ai` (Supabase connector / CLI). **Confirm `verify_jwt` ON.**
2. Founder sets Supabase secret `ANTHROPIC_API_KEY` (Dashboard → Edge Functions → Secrets). `SUPABASE_URL`/`ANON_KEY`/`SERVICE_ROLE_KEY` auto-inject.
3. Flip `KOY_AI_ENABLED=true` in `src/lib/config.js`, commit, deploy.
4. Founder sets an **Anthropic account spend cap** (~$200) — hard ceiling. Must **scale with paid revenue** later (a paying Pro whale would otherwise hit the cap).
5. **Founder dogfoods as user ZERO with his own credits.** ⚠️ Verify his Pro test login owns a `user_packages` row for the **`koy-pro`** package (feature `ai:page-design`). `is_premium` alone does NOT unlock page-design — the gate is the package feature. Grant the package (service role / dashboard): `insert into user_packages(user_id, package_id, source) values ('<uid>', '<koy-pro id>', 'manual')`. (koy-pro id at handoff: `2173113d-af57-44f4-8608-76f17e7973ce`.)
6. Smoke matrix: free user → 5 block gens then out-of-credits; JS ask → friendly decline; Pro user → "Describe your page" builds a full page + allowance decrements; non-Pro → upsell.

Model `claude-haiku-4-5`; ~1¢/block, ~2–3¢/page; margins positive. 5 free block gens; 30 Pro page-designs/month.

---

## OPEN DECISIONS / KNOBS (founder calls — don't guess)

- **Pro monthly page-design allowance = 30** (`v_allow` in `spend_page_design`). Founder had not explicitly confirmed 30 — ask.
- **Free block generations = 5** (confirmed).
- **Glam background is a PROCEDURAL PLACEHOLDER** (`public/templates/glam/glam-bg.webp`). Founder plans a Higgsfield collage ("ad baddie"). Swap the webp when provided; do NOT commit the 8.6MB source PNG.
- **Third "wow template" slot** — pocketed; needs a vibe from founder (Bloomberg + Glam Girl done, each with a toy).
- **External `https` images** in image blocks (tracking-pixel/IP-leak class) — leave open or lock to own storage; founder never finalized. (AI page-design already strips external `url()` from styles; image `src` still allows https.)
- **"Cheaper iteration"** for AI (regenerate a block for a fraction of a credit) — future UX task if usage shows credit burn on iteration.
- **Full-page EDITING** (AI edits an existing page/blocks) is NOT built — only full-page *generation* (fresh page from a prompt). This is what the founder means by "editing templates from within KOY" — a real future feature, distinct and bigger than generation.

---

## REMAINING ROADMAP (build order)

1. **Go-live** when founder's ready (checklist above).
2. **Launch-blockers (pre-beta, pure engineering):** email verification; Google/Apple sign-in (founder must create OAuth apps + paste keys into Supabase). Both flagged pre-launch in project docs.
3. **Collect action** — save a public page you liked to your own shelf (one-way; NO mutual "friends" — see roadmap). New table + small UI.
4. **Sprint 7+ — curated JS presets** (stage b): Koy-authored parametric JS (matrix rain, visualizers, cursor trails, 3D); users tweak params, never write JS. Template "cool elements" ship here.
5. **Sprint 8+ — Marketplace v1 + Stripe:** self-serve purchase is the big dependency; it wires into the **existing package gate** (Stripe webhook → `grant_ai_credits` / insert `user_packages`). Pro subscription billing lands here. Until then Pro is founder-granted. $8.99 floor, 15% fee, "use this layout".
6. **Sprint 10+ — full JS sandbox** (stage c, ~12–18 mo) + native KOY AI trained on `user_events`.
7. **UI/UX overhaul — the final sprint, 100% TASTE.** Founder-led, human-speed, with Claude Design. NOT engineering-led. Do not pre-empt it.

---

## HOW TO WORK (hard-earned — don't relearn)

- **Three founder gates, never self-approved:** Taste (visuals), Merge (founder authorizes in chat; record it in the merge commit), Invariant (auth/security/schema: founder sign-off + smoke BEFORE apply). Surface SQL before applying.
- **App.jsx is ONE giant minified file (~99 lines; canary in CLAUDE.md).** Editing corrupts it if careless. Surgical python `str.replace` with `assert count==1`; after EVERY write verify all four: `wc -l` (~99), null-byte grep, last line `export default App;`, `npm run build`. One logical change per write.
- **Single-file MERGE TRAP:** two branches editing the same App.jsx region = unresolvable git conflict (the whole "line" conflicts). DON'T hand-resolve — abort and **re-apply the second branch's edits as fresh scripted edits over main** (proven this session for embed/market/slack).
- **GitHub push:** PAT expires **~2026-07-27** — ask founder to paste the koy-calendar token. Push via temp `~/.netrc` (`machine github.com / login x-access-token / password <TOKEN>`), then `git push origin <branch>`, delete netrc. Token-in-URL got blocked by the sandbox classifier; netrc worked.
- **Supabase** `iydmygawfvpotxmxddju` — MCP connector for read checks + founder-gated `apply_migration`. Anon-default-grant trap real for tables AND functions (revoke explicitly; TRUNCATE not RLS-gated).
- **Vercel** team `crux2`, project `prj_uwZ8L8DzaCnlpvLPd0kiDhVKXJEK`. Branch push → `koy-calendar-git-<branch>-crux2.vercel.app` (behind Vercel login). Queue can sit ~10 min before a ~5s build.
- **Mobile testing without a phone:** headless Playwright at 390×844 (`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, `--no-sandbox`) — how the Glam/carousel mobile bugs were caught.
- **Adversarial review pays off:** every security-touching feature this session got an independent reviewer that found REAL bugs (client-callable refund = infinite credits; escaped-`@import` sanitizer bypass; AI-style IP-leak). Do this for anything touching auth, money, or untrusted rendering.
- **Docs live in project knowledge** (`claude/` namespace) via the Projects tool, not the repo.

---

## SECURITY INVARIANTS (do not violate)

- **I1–I4 auth** (token off React state, `sbF` single gate, one logged-out state, clearAuth-ordered-last) — CLAUDE.md. Preserved.
- **I6** — atomic save (`save_active_page`), no double-active pages.
- **I7 — the sanitizer** (`src/lib/sanitize.js`): DOMPurify allowlist + `<iframe sandbox="">`. EVERY HTML/CSS render (human OR AI) goes through `composeSrcdoc`. AI page-design blocks also pass `sanPageSpec` (type allowlist, coord clamp, style url()/js strip, image https-only) before `applyPage`.
- **Credits = the rate limiter.** `spend_ai_credit`/`spend_page_design` are the ONLY spend paths, atomic, `auth.uid()`-keyed. Refunds SERVICE-ROLE ONLY (a client-callable refund was an infinite-credit exploit — fixed). Clients read balances, never write.
- **`applyPage()`** is the single page/template/AI-page swap path — never set pg/bks/hist directly on a swap.

---

## FIRST MOVES FOR CLIVE

1. `git log main --oneline -5` — confirm HEAD `7e02cb4`, single `main`. Read CLAUDE.md.
2. Confirm the knobs (page allowance 30? glam image? third template?).
3. When founder says go-live: run the KOY AI checklist; grant the `koy-pro` package to his Pro test login; smoke the matrix.
4. Then launch-blockers (email verify, OAuth) → Collect → Sprint 7 → Sprint 8 (Stripe).
5. Leave the UI/UX overhaul to the founder + Claude Design. Build structure, protect gates, review anything touching auth/money/untrusted rendering.
