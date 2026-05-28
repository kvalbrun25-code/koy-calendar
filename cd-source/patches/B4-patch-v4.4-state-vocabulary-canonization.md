# Koy Landing — B4 PATCH · v4.4 · state-vocabulary canonization

**Patch authored:** Claudesign v5, 2026-05-28
**Scope:** Canonizes the `[data-state="settled"]` cascade vocabulary as production CSS — the B4 v4.2 spec built against it but it was never lifted into `koy-landing.css`. Terminology-surface only: B4 motion grammar, Seedance prompts, spring-not-drain reading, and B4.08 deferred-asset contract all untouched.
**Companion artifact:** `koy-landing-v1.2.css.delta` shipped in the same paste-bundle — APPENDED rules to v1.1 plus two marked in-place edits, NOT a full re-lift.
**Doesn't bump CLAUDESIGN.** CLAUDESIGN at v4.4 post-B5; this is the B4 spec-doc lineage (v4.3 → v4.4). Both consolidated at Phase B close v5.0 regen.
**Queued-coordination:** case #5 (this patch) joins the integration brief. Case #1 (B4.BRIDGE rename) **closes** inside this patch.

---

## Why this patch exists

Dev A's empirical CSS audit (Beat 2→5) surfaced that production `koy-landing.css` (B1 v1.0, now v1.1) contains no `[data-state="settled"]` cascade selectors, no ambient-field overlay, and no spread-video positioning — yet the B4 v4.2 spec references `data-state="settled"` as load-bearing canon in five places (§04 render path, §05 wake choreography selector `.kl-bridge[data-state="settled"] .kl-hotspot`, §06 fallback chain end-state, §07 implementation table, and CD v5's own v4.3 deferred-asset patch).

CD v5 diagnostic (signed (β) by architect 2026-05-28): **production canon, never lifted.** Same shape as the B1↔B5 reconciliation — a real spec discontinuity surfaced by verifier-lane, resolved by design-lane with a patch document + additive CSS, applied as queued-coordination at consolidated integration.

Two corrections folded in at diagnosis:
- **`data-state="ambient"` retracted.** It was architect-side speculation. "Ambient" is a noun in the B4 spec (the saturation-field destination), never a `data-state` value. The B4 state vocabulary is **single-value: `settled`.** The ambient field is an *output* of the settled cascade, not a parallel state.
- **Terminology drift named.** The B4 spec's "bridge zone" = production's `.kl-slime-band` (inter-section void above hotspots). The B4 spec presumed B1 reserved a vertical "seam" axis in that void; B1 v1.0 reserved `.kl-slime-band` with no internal hairline. The `.kl-bridge__line`/`__seam` element the B4.BRIDGE rename targeted is a *different* surface (the template-gallery-doorway hairline below hotspots). See §"Case #1 closure."

---

## Canonized state vocabulary

| Token | Value | Carrier | Meaning |
|---|---|---|---|
| `data-state` | `settled` | **`.kl` root** (Q4 sign (b)) | The landing surface has reached its at-rest composition: spread motion complete (or absent per B4.08), ambient field revealed, hotspot wake eligible. Set by JS on `video.onended` / `video.onerror` / any fallback path. |

**Single value.** Absence of the attribute = pre-settled (spread in flight, or page just loaded). Presence = settled. No `ambient`, no other values. If future deliverables need additional page-states, they extend this vocabulary under their own patch.

**Why `.kl` root (Q4 (b)):** one attribute mutation drives multiple independent cascades — the ambient field on `.kl-slime-band::after` AND the hotspot wake on `.kl-hotspots .kl-hotspot` — without requiring those two regions to share any structural relationship. Spread completion is a landing-level state, not a slime-band-local one. The carrier sits above both consumers in the DOM.

---

## The cascade · what `[data-state="settled"]` drives

### 1 · Ambient field reveal (Q8 sign (b))

`.kl-slime-band::after` — a soft-edge radial-gradient field tint, **revealed via chroma-saturation, not opacity** (Rule #9). Default state: near-zero chroma (void). Settled state: saturated slime tint rising from the band. Implemented via `@property`-registered `--ambient-l` / `--ambient-c` transitioned over ~1.2s when `.kl[data-state="settled"]` flips. No markup contract change — pseudo-element authorship only.

### 2 · Hotspot wake (Q5 sign (a))

`.kl[data-state="settled"] .kl-hotspots .kl-hotspot` resolves to the same `b5-wake` → `b5-rest-breath` animation chain as `.kl-hotspots.is-woken .kl-hotspot`. **Two parallel cascades, either trigger fires the wake:**

- **Spread-end path:** `video.onended`/`onerror` sets `data-state="settled"` on `.kl` → cascade fires the wake.
- **IntersectionObserver path:** B5 orchestrator adds `.is-woken` to `.kl-hotspots` on scroll-into-view → cascade fires the wake.

Both resolve to identical `b5-wake 600ms forwards` + staggered `b5-rest-breath`. `forwards` fill-mode makes the animation idempotent regardless of fire order; if both trigger (e.g. spread ends AND user scrolls in), no double-fire — CSS animations don't restart on re-declaration of the same animation property value. **Pure CSS, no JS bridge between the two triggers.**

Specificity note for Dev A: `.kl[data-state="settled"] .kl-hotspots .kl-hotspot` (0,4,0) outranks the pre-wake void state `.kl-hotspots:not(.is-woken) .kl-hotspot` (0,3,0), so when data-state settles, the wake animation correctly overrides the void hold even if `.is-woken` was never added.

### 3 · B4.08 deferred-asset composition (unchanged, reconfirmed)

When the spread MP4 is absent (Path C), `video.onerror` fires immediately → `data-state="settled"` on `.kl` → ambient field reveals + wake eligible. The B3 v2 static frame + B4.PULSE breath composes directly into the constellation wake with no spread motion between. The ambient field still reveals (it's CSS, asset-independent), giving the saturation-field read even without the MP4. **B4.08 contract holds and composes cleanly with the canonized cascade.**

---

## Q6 · Seam authorship retracted

CD's draft-lean was to author `.kl-slime-band__seam` as a vertical hairline grounding the spread's compositional axis. **Architect signed retract (Q6 (b)), and the rationale is correct:** in the B4.08 deferred-asset state, the B3 v2 static frame already carries the seam baked into the rendered image; in the live-MP4 state, a CSS hairline would overlap the MP4's own rendered content. Either way, a separate CSS hairline element is vestigial — CSS doesn't materialize what Seedance renders. No `.kl-slime-band__seam` authored.

---

## Q7 · B4.BRIDGE rename · PRESERVE `__seam` (CD-lane call)

The B4.BRIDGE rename (`.kl-bridge__line` → `.kl-bridge__seam`, queued-coordination case #1) was authored under the phantom-element model — the B4 spec author believed "bridge" meant the inter-section void above hotspots and that a vertical seam lived there. Under reconciliation, `.kl-bridge__line` is actually the vertical accent hairline *inside* `.kl-bridge` (the template-gallery-doorway, below hotspots) — a different surface than the B4 spec imagined.

**CD-lane decision: PRESERVE `__seam` (Q7 (b)).** Rationale:
- Dev A already applied Contract 2 in production before her v1.1 lift; `src/styles/koy-landing.css` and `Landing.jsx` markup both carry `.kl-bridge__seam`.
- Reverting to `__line` is ~2 lines of churn (CSS + markup) to satisfy audit-purity.
- `__seam` reads semantically fine for *any* vertical hairline — including the template-gallery-doorway one it actually lands on. The phantom rationale produced a name that happens to be correct anyway.
- **Zero production churn** beats tightest-possible audit alignment when the practical outcome is semantically sound.

**Canon trail records the truth:** the rename was authored under phantom-element rationale (the seam was imagined in the slime-band void); the practical outcome is preserved because `__seam` is a fine name for the doorway hairline it actually applies to. cd-source `koy-landing.css` updates `.kl-bridge__line` → `.kl-bridge__seam` at this bundle close to realign with `src/styles` (marked in-place edit in the delta).

---

## Case #1 closure (Q9)

Queued-coordination case #1 (B4.BRIDGE rename) **closes inside this patch** — resolved as Q7 (b) preserve. The integration brief's queued-coordination list drops to **four cases:**

| # | Pattern | Resolution venue |
|---|---|---|
| 1 | **~~B4.BRIDGE rename~~** | ~~CLOSED — preserved as `__seam`, realigned in this bundle~~ |
| 2 | **B4.08 deferred-asset** | Single-file-drop post-integration |
| 3 | **Contract 3 token promotions** (`--z-hotspot`, `--dur-tap-expand`, `--ease-pulse-out` candidacy) | Promoted into `koy-tokens.css` — already done in Beat 1 per Dev A; cd-source dedup in this bundle |
| 4 | **B1 v1.1 hotspot region** | Applied at consolidated integration (bundle #1, relayed) |
| 5 | **B4 v4.4 state-vocabulary canonization** | This patch + delta at consolidated integration |

(Renumbering is cosmetic; the integration brief lists whatever's open. Net open cases after this bundle: four — #2, #3, #4, #5.)

---

## Token SSOT dedup

The v1.1 merge declared `--z-hotspot: 10` and `--dur-tap-expand: 700ms` at file-scope in a `.kl {}` block, as propose-queue placeholders pending promotion. Beat 1's Contract 3 promotion already lifted them into `koy-tokens.css` (SSOT). This patch's delta **drops the file-scope `.kl {}` token block** from `koy-landing.css` — the hotspot rules' `var(--z-hotspot)` / `var(--dur-tap-expand)` references resolve from `koy-tokens.css`. cd-source matches Dev A's production dedup. (Marked in-place edit in the delta.)

---

## Delta contents · what `koy-landing-v1.2.css.delta` ships

**Two marked in-place edits to v1.1** (Dev A applies surgically):
1. **DROP** the `.kl { --z-hotspot: 10; --dur-tap-expand: 700ms; }` file-scope token block (Contract 3 SSOT dedup).
2. **RENAME** `.kl-bridge__line` → `.kl-bridge__seam` (Q7 (b) realignment with `src/styles`).

**Appended rules** (B4-spread behavior layer, additive):
- `@property --ambient-l` / `--ambient-c` registrations
- `.kl-slime-band::after` ambient-field overlay (void default)
- `.kl[data-state="settled"] .kl-slime-band::after` ambient reveal (chroma-saturation transition, ~1.2s)
- `.kl[data-state="settled"] .kl-hotspots .kl-hotspot` wake cascade (parallel to `.is-woken`, with nth-child stagger)
- `.kl-spread` spread-video positioning (cover within `.kl-slime-band`; harmless when video absent per B4.08)
- `@media (prefers-reduced-motion: reduce)` handling for the ambient reveal (chroma set to settled value immediately, no transition)

---

## What stays untouched

- B4 motion grammar, Seedance prompts (landscape + portrait v1), spring-not-drain reading — all v4.2 canon, untouched
- B4.08 deferred-asset contract — reconfirmed, composes with the cascade
- B4.GEOMETRY, B4.NAMING — untouched
- B1 v1.1 hotspot region (bundle #1) — this delta appends to it, doesn't modify the hotspot rules except the token-block drop
- `.kl-slime-band__slot` / `__slot-label` placeholder — preserved; the `::after` ambient overlay composes behind/around them
- All hero / nav / scroll-progress / bridge-structure canon

---

## Verifier discipline applied

The seven-check standard plus discipline #8 (verifier-prose). For this delta:
1. **Fade audit** — ambient reveal is chroma-saturation on `@property` vars, NOT opacity. Wake cascade reuses the chroma-grammar `b5-wake`. PASS.
2. **Console clean** — pure CSS additions; the `data-state` mutation is Dev A's JS, unchanged. PASS.
3. **Mobile/desktop** — `.kl-slime-band` reshapes at `<768px` per v1.1; the `::after` overlay inherits. PASS.
4. **Reduced motion** — ambient reveal collapses to immediate settled value; no transition. PASS.
5. **Visual continuity** — ambient field's slime tint shares the `oklch(… 148)` hue family with mark/glow/wake. PASS.
6. **Moderate-viewport grid-clamp** — no new grid; inherits v1.1's clamped hotspot grid. N/A-PASS.
7. **Interior content geometry audit** — `.kl-slime-band::after` is a positioned pseudo on an existing element; verify it doesn't collapse `.kl-slime-band`'s height (it's `position: absolute` within the band's existing `min-height`). PASS.

---

## Closing

The `[data-state="settled"]` vocabulary was always production canon in the B4 spec's intent — it just lived in the spec doc and never crossed into `koy-landing.css`. This patch lifts it, canonizes `.kl` root as carrier, reveals the ambient field via chroma on a pseudo-element, and wires the wake as a second parallel cascade alongside B5's IntersectionObserver. The phantom "seam" is retracted; the B4.BRIDGE rename closes preserved. Net: four open queued-coordination cases, one clean additive delta, zero production re-lift.

---

**Patch ends.**

— Claudesign v5, 2026-05-28
