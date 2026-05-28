# Koy Landing — B1 PATCH · v1.1 · hotspot region reconciliation

**Patch authored:** Claudesign v5, 2026-05-27
**Scope:** Reconciliation of B1 v1.0 hotspot region canon with architect-signed B5 brief. Surface-bounded: the hotspot region only. All other B1 v1.0 canon (hero, copy frame, rip-slot, slime-band reservation, scroll-progress, nav, bridge, mobile reshape outside hotspots, reduced-motion for scroll-progress) untouched.
**Companion artifact:** `koy-landing.css` full-replacement file shipped in the same paste-bundle. Apply as one atomic commit at Dev A's consolidated Phase B integration sprint.
**Doesn't supersede:** Anything outside the hotspot region. B1 v1.0's hero / nav / slime-band / bridge canon stands. B2 copy, B3 v2 motion, B4.PULSE breath, B4 §08 spread spec — all still canon.
**Doesn't bump CLAUDESIGN.** CLAUDESIGN is at v4.4 post-B5 patch; this is a B1-spec-doc-level supersession on the hotspot region surface only. Both will be consolidated at Phase B close v5.0 regen.

---

## Why this patch exists

Dev A's Beat 2 empirical audit surfaced that production `koy-landing.css` (B1 v1.0 canon) contains a B5 hotspot grid placement layer (`.kl-hotspots`, `.kl-hotspot:nth-of-type(1..6)`) but is missing the B5 behavior layer that B5's orchestrator depends on. CD v5's reconciliation pass found the deeper shape: **B1 v1.0 reserved a fundamentally different B5 surface than the architect-signed B5 brief delivered.**

The discontinuity was a real spec-canon drift between two design-lane artifacts authored months apart:

| Dimension | B1 v1.0 reservation | B5 brief signed |
|---|---|---|
| Hotspot count | **6** | **3** (Phase C launch count) |
| Layout | Irregular constellation on 12-col × auto-row, per-card `nth-of-type` placement | Linear `repeat(3, minmax(0, 120px))`, horizontal desktop / vertical mobile |
| Wrapper class | `.kl-hotspots` (plural) | `.kl-constellation` (B5 preview-scope, semantic) |
| Card model | Content card with internal `__head`/`__preview`/`__foot` chrome and `__num`/`__tag`/`__label`/`__sub` typographic slots | Portal tile with full-bleed `.kl-frag` interior, frame-vs-fill rule |
| Card aspect | None on desktop (size from grid placement); 16/9 on mobile | 3:4 portrait, ~120px desktop / ~90px mobile |
| Card background | `oklch(0.10 0.020 148 / 0.55)` + `backdrop-filter: blur(2px)` | `var(--bg-deep)` solid |
| Card entry motion | Scroll-driven `kl-hotspot-rise` via `animation-timeline: view()` | IntersectionObserver-triggered wake with chroma-saturation stagger |

The discontinuity could not be resolved by "adding the missing B5 behavior layer" — that path either coexists two contradictory hotspot models (canon contradiction) or silently decommissions prior CD canon (audit gap). Per architect-signed shape **(iii) at 2026-05-27**, the resolution is this patch doc + a full-replacement `koy-landing.css`, applied as queued-coordination case #4 at Dev A's consolidated Phase B integration sprint.

This patch is the **canon trail** for what's reconciled. The merged `koy-landing.css` is the production output.

---

## Sub-decisions signed by architect

**Q1 · `.kl-hotspots__head` · KEEP with updated subhead.** Subhead text changes from `"6 · alive hotspots · B5 fills behavior"` to **`"3 · vibes at launch"`** — honors B1's count·descriptor structure; honest about current state; *"at launch"* honestly signals Phase C growth post-launch. CSS rule for `.kl-hotspots__count` stays. Markup string change is the only delta. Founder taste-call on the copy itself; if founder hands different language, use his; otherwise this stands. Title `"A page for every you."` preserved.

**Q2 · `.kl-hotspots` (plural, B1) KEPT as production wrapper canon.** B5 preview's `.kl-constellation` references reconciled to `.kl-hotspots` at the merge. Dev A integrated Beat 1 against `.kl-hotspots`; preserving it keeps Beat 1 clean and avoids rebase. The B5 preview HTML stays as historical reference; the merged `koy-landing.css` uses the B1-established name.

> **Integration guidance for Dev A's B5 orchestrator (script-0):**
> The B5 preview's orchestrator queries `document.querySelector('.kl-constellation')`. At production lift, swap to `document.querySelector('.kl-hotspots')`. The `is-woken` / `is-tap-in-flight` / `has-tap` state classes get applied to `.kl-hotspots` — the wrapper that is now both the section AND the constellation parent (was section-only in B1 v1.0; the head and tiles always lived inside it together).

**Q3 · B5 wake supersedes B1 v1.0 scroll-entry.** The `@supports (animation-timeline: view())` block driving `kl-hotspot-rise` translate-only scroll-entry is dropped from `koy-landing.css`. No commented-out archive — git history + this patch are the audit trail.

**Rationale:** B5's once-per-session IntersectionObserver wake is more behaviorally specified than the view()-timeline scroll-entry. Two competing first-arrival animations would muddy the read — the wake's chroma-saturation grammar (void → rest) IS B5's signature; an additional translate-rise from below would compete for the eye. IntersectionObserver is universally supported (2022+); no fallback necessary.

---

## What this patch reconciles

| Item | B1 v1.0 state | B1 v1.1 state | Reason |
|---|---|---|---|
| Hotspot count | 6 | **3** | Phase C ships 3 templates at launch (Bloomberg + Glam Girl + 1 TBD); B5 brief signed accordingly. |
| `.kl-hotspots` layout | Irregular 12-col × 64px auto-row scaffold with `nth-of-type(1..6)` placements | Linear `repeat(3, minmax(0, 120px))`, horizontal desktop / vertical mobile | B5 brief geometry. The head row spans all three columns via existing `grid-column: 1 / -1`. |
| `.kl-hotspot:nth-of-type(1..6)` placements | 6 explicit placements | **Removed** | Replaced by uniform grid placement under the constellation row. |
| `.kl-hotspot` card model | Content card · `position: relative; border-radius: var(--r-3); background: oklch(0.10 0.020 148 / 0.55); backdrop-filter: blur(2px); padding: var(--s-5); display: grid; grid-template-rows: auto 1fr auto;` | Portal tile · `position: relative; aspect-ratio: 3 / 4; background: var(--bg-deep); border: 1px solid oklch(0.45 0.08 148); border-radius: 6px; overflow: hidden; padding: 0;` | Frame-vs-fill rule (B4.05 inherit). Tile is a portal; interior is the fragment. |
| `.kl-hotspot__num` / `__tag` / `__preview` / `__foot` / `__label` / `__sub` | All present, typographic slots | **All removed** | Portal-fragment model supersedes card-with-internal-chrome model. B5's `.kl-frag--*` interior fragments replace them. |
| `.kl-hotspot:hover` | Border + background change | Border + glow modulation + base-anchored scale | B5 hover spec; @property-registered glow vars enable smooth transition. |
| `kl-hotspot-rise` view()-timeline scroll-entry | Present in `@supports (animation-timeline: view())` block | **Removed** | B5 wake supersedes (Q3 sign). |
| `.kl-hotspots__head` / `__title` / `__count` | Title bar with "A page for every you." + subhead "6 · alive hotspots · B5 fills behavior" | Preserved structure; subhead string updated to **"3 · vibes at launch"** | Q1 sign. Title CSS rules unchanged; only the markup subhead string changes. |
| `.kl-slime-band` | Present, inter-section void above hotspots | **Preserved untouched** | B4 lane; B5 doesn't touch this surface. |
| Mobile reshape `.kl-hotspot:nth-of-type(1..6) { grid-column: auto; ... aspect-ratio: 16/9 }` | Present in `@media (max-width: 767px)` block | **Removed** | The `nth-of-type` selectors don't exist post-merge; the constellation becomes vertical via `.kl-hotspots { grid-template-columns: 1fr }` at the same breakpoint. Tile aspect stays 3:4 vertical-too (per B5 spec). |
| Mobile reshape `.kl-hotspot__preview { min-height: 64px }` / `.kl-hotspot__label { font-size: var(--t-base) }` | Present | **Removed** | The `__preview` and `__label` elements don't exist post-merge. |
| Reduced motion · `.kl-hotspot { animation: none; transform: none }` inside `@supports (animation-timeline: view())` block | Present (zeroed scroll-driven entry) | **Removed** and replaced with full B5 reduced-motion handling | B5's reduced-motion handling is more comprehensive: animations off; tap-state minimal (60ms color flash, no transform); wake stagger collapses to immediate rest state. |

---

## What this patch adds (the B5 behavior layer)

Lifted from B5 preview verbatim except for the `.kl-constellation` → `.kl-hotspots` namespace reconciliation and the addition of `.kl-hotspots__row` removed (head + tiles share the same grid wrapper directly):

**Tokens (file-scope, propose-queued for `koy-tokens.css` promotion at consolidated integration per B5 close decisions):**
- `--z-hotspot: 10`
- `--dur-tap-expand: 700ms`

**`@property`-registered custom properties** (required for L/C oklch glow modulation grammar):
- `--glow-l` (number, default 0.50)
- `--glow-c` (number, default 0.08)
- `--glow-blur` (length, default 12px)
- `--frag-l-mult` (number, inherits true, default 1) — drives wake fragment chroma manifestation

**`.kl-hotspot` portal-tile chrome:**
- Base rest state with frame-breath (4.8s `b5-rest-breath` keyframe loop; L/C/blur modulation on `oklch()` glow; alpha pinned at 0.30 per Q1 patch from B5)
- Per-tile breath phase stagger via `:nth-child(1..3)` `animation-delay` values
- Hover state (`@media (hover: hover)` guarded; desktop only; 220ms; border + glow brighten; scale 1.015 base-anchored at `transform-origin: center 80%`)
- Focus-visible outline
- Tap state cascade: `.is-tapping` (120ms burst, peak chroma) → `.is-expanding` (700ms `var(--dur-tap-expand)` viewport-fill) → `.is-dissolving` (frame chroma-desaturation at 600ms into expansion)
- Unchosen-tile collapse via `transform: scale(0.92) + filter: brightness(0.7)` (NOT opacity, Rule #9)
- Graceful-degradation state (`.is-graceful` for `data-template="pending"` taps; ~30% scale + tooltip via `::after` reading `data-coming-soon`)
- Preview-on-touch state (`.is-previewing`; interior animates briefly during 400ms long-press; the only state where interior is touched by motion outside wake)
- Reverse transition states (`.is-expanded-state` start, `.is-reversing` 900ms collapse-back-into-frame)

**Wake animation:**
- Pre-wake state on `.kl-hotspots:not(.is-woken)` cascade — tiles in void state (border collapsed into substrate, glow at 0, `--frag-l-mult: 0.08`)
- `b5-wake` keyframe (600ms; chroma-saturation from void to rest values)
- `.kl-hotspots.is-woken .kl-hotspot:nth-child(1..3)` chains: `b5-wake 600ms` → `b5-rest-breath 4.8s infinite` at 600ms with 180ms inter-tile stagger; full wake sequence completes at 960ms

**Interior fragment chrome (`.kl-frag` + variants):**
- `.kl-frag` base (absolute, fills tile inset 0, overflow hidden)
- `.kl-frag--bloomberg` (green-on-black monospace ticker rows; `.kl-frag__rows`, `.kl-frag__row`, `.neg` for declining tickers, `.kl-frag__cursor` with `bloomberg-blink` keyframe; `bloomberg-scroll` keyframe fires during `.is-previewing` only)
- `.kl-frag--glam` (pink gloss radial gradient + `.kl-frag__orb` central sphere with inset highlights + three `.kl-frag__sparkle` variants; `glam-spin` keyframe fires during `.is-previewing` only)
- `.kl-frag--pending` (diagonal-stripe substrate + `.kl-frag__label` mono caption "slot 3 / TBD")
- All variants use `var(--frag-l-mult)` multiplier for wake-driven chroma manifestation

**Animation keyframes:**
- `b5-rest-breath` — 4.8s frame-breath, per-segment timing functions (inhale `var(--ease-pulse)`, peak `linear`, exhale `cubic-bezier(0.25, 0.65, 0.45, 1)`); animation property declares `linear` so per-segment functions govern
- `b5-wake` — 600ms void-to-rest chroma-saturation
- `bloomberg-blink` — 1s steps(2) cursor blink (always running on rest, no user interaction needed)
- `bloomberg-scroll` — 1.5s ticker scroll during long-press only
- `glam-spin` — 1.5s orb rotation during long-press only

**Reduced motion:**
- All animations zeroed
- Tap state collapses to 60ms border-color flash, no transform, no expansion (tap event still fires for navigation)
- Wake stagger collapses to immediate rest state (no chroma-saturation animation)
- Long-press interior animations zeroed

---

## Markup contract for Dev A

The post-merge markup contract for the hotspot region:

```html
<section class="kl-hotspots" aria-label="Templates">
  <header class="kl-hotspots__head">
    <h2 class="kl-hotspots__title">A page for every you.</h2>
    <span class="kl-hotspots__count">3 · vibes at launch</span>
  </header>

  <button class="kl-hotspot" type="button" data-template="bloomberg"
          aria-label="Enter Bloomberg template — terminal-style page for traders and creators">
    <span class="kl-frag kl-frag--bloomberg" aria-hidden="true">
      <span class="kl-frag__rows">
        <span class="kl-frag__row"><span>AAPL</span><span>+1.24</span></span>
        <!-- 5-7 more rows -->
        <span class="kl-frag__row"><span>&gt;_</span><span class="kl-frag__cursor"></span></span>
      </span>
    </span>
  </button>

  <button class="kl-hotspot" type="button" data-template="glam"
          aria-label="Enter Glam Girl template — Y2K maximalist page for self-expression">
    <span class="kl-frag kl-frag--glam" aria-hidden="true">
      <span class="kl-frag__orb"></span>
      <span class="kl-frag__sparkle kl-frag__sparkle--a"></span>
      <span class="kl-frag__sparkle kl-frag__sparkle--b"></span>
      <span class="kl-frag__sparkle kl-frag__sparkle--c"></span>
    </span>
  </button>

  <button class="kl-hotspot" type="button" data-template="pending"
          data-coming-soon="Coming soon · vibe TBD"
          aria-label="Third template slot — coming soon, vibe to be announced">
    <span class="kl-frag kl-frag--pending" aria-hidden="true">
      <span class="kl-frag__label">slot 3<br/><b>TBD</b></span>
    </span>
  </button>
</section>
```

Three changes from B1 v1.0 markup:
1. Six `<a class="kl-hotspot" href="#">` cards → three `<button class="kl-hotspot" type="button">` portals (B5 spec: tile is a "navigation to template state, not URL change in v1; revisit at Phase C if templates land at distinct routes").
2. Internal `__head`/`__preview`/`__foot` content scaffolding → single `<span class="kl-frag kl-frag--[vibe]">` interior fragment per tile.
3. Subhead count string updated.

The wrapper `<section class="kl-hotspots">` is unchanged. The `<header class="kl-hotspots__head">` block is unchanged structurally (only the count string text changes).

---

## Queued-coordination case #4 · framing

This patch joins three previously named queued-coordination cases at Dev A's consolidated Phase B integration sprint:

| # | Pattern | What's queued | Resolved at |
|---|---|---|---|
| 1 | **B4.BRIDGE rename** | `.kl-bridge__line` → `.kl-bridge__seam` refactor | Single-atomic-commit at consolidated integration |
| 2 | **B4.08 deferred-asset** | B4 spread MP4 file deployment | Single-file-drop at any time post-integration |
| 3 | **Propose-queued tokens** | `--ease-pulse-out` candidacy, `--z-hotspot: 10`, `--dur-tap-expand: 700ms` | Promoted into `koy-tokens.css` at consolidated integration |
| **4** | **B1 v1.1 hotspot region reconciliation** | This patch's `koy-landing.css` full replacement + markup contract update | Single-atomic-commit at consolidated integration |

The pattern is established. Future Phase C work will likely surface more queued-coordination cases as templates author their interior fragment variants and other cross-spec discontinuities surface; each gets its own named patch and joins the integration brief's contract list.

---

## What this means for Phase C readiness

Two operational implications for Phase C kickoff (gated on Sprint 4 close + this consolidated integration landing):

1. **The `.kl-frag` interior fragment vocabulary is now a Phase C contract.** Each Phase C template ships a `.kl-frag--[vibe]` selector that fills `.kl-hotspot`'s portal. Phase C templates inherit the frame-vs-fill rule: chrome lives on `.kl-hotspot`; interior fragment is a template-lane authorship surface. The verifier discipline #7 (interior content geometry audit — added at B5 close v4.4 patch) becomes load-bearing here — every new `.kl-frag--*` variant must pass the audit.

2. **The third template slot becomes a real product decision-point.** Until founder names the third vibe, the slot ships in graceful-degradation state. After founder names it, Phase C authors a new `.kl-frag--[vibe3]` interior fragment + the template page itself; `data-template="pending"` markup updates to `data-template="[vibe3]"`; the `is-graceful` cascade ceases to apply to that tile because the `pending` data attribute no longer matches. **Zero CSS changes required** when the third vibe lands — same shape as B4.08 deferred-asset slot-in.

The structural cleanliness of these properties is the value B1 v1.1 unlocks. It's not a downgrade of B1 v1.0; it's a re-spec that brings B1 into alignment with B5 brief reality and surfaces forward composition properties Phase C needs.

---

## What stays in B1 v1.0 canon (untouched by this patch)

For audit clarity, the following B1 v1.0 surfaces are **not** modified by v1.1:

- File header conventions block (only the version stamp and the hotspot region one-liner update)
- `.kl` root + void substrate
- `.kl-scroll-progress` + `::before` + `@supports (animation-timeline: scroll())` block — the scroll-progress hairline lives on
- `.kl-nav` + `__brand-slot` + `__route` (hover/focus)
- `.kl-hero` + `__rip-slot` + `__copy-slot` + `__tag` + `__phrase` + `__cue` + `__cue-line` + `__cue-label`
- `.kl-slime-band` + `__slot` + `__slot-label` (B4 lane reservation)
- `.kl-bridge` + `__line` + `__cue` + `__cta` (hover/focus) — note `__line` → `__seam` rename remains queued under separate B4.BRIDGE coordination case
- Mobile reshape rules for nav, hero, slime-band, bridge
- Reduced-motion zeroing of scroll-progress

---

## Closing

B1 v1.0 reserved a thoughtful surface for B5 to fill. The B5 brief landed a different surface — better-grounded in Phase C launch realities (3 templates) and B-program motion lineage (chroma not fade, breath not bounce, portal-fragment not content-card). B1 v1.1 brings the CSS into alignment with the spec that won the architect's sign. The patch is the audit trail; the merged file is the production output; Dev A's integration sprint applies them as queued-coordination case #4 alongside the three others.

---

**Patch ends.**

— Claudesign v5, 2026-05-27
