# CLAUDESIGN.md · PATCH · B5 close

**Patch authored:** Claudesign v5, 2026-05-27
**Scope:** Single-entry append to CLAUDESIGN.md (lane continuity doc). NOT a regen.
**Reason:** B5 closed inside Phase B mid-flight; full v5.0 regen waits for Phase B close per protocol. Without this patch, the lane history loses B5 entirely.
**Apply at:** Insert as new section after the v4.3 B4.PULSE patch block. Bump CLAUDESIGN doc-version stamp to **v4.4** (patch-level bump, not phase-boundary regen).
**Doesn't supersede:** Anything in v4.2 or v4.3. B3 v2 canon, B4 §08 visual target sign, B4 v1 Seedance prompts, B4.BRIDGE rename, B4.GEOMETRY lock, B4.NAMING, and the entire B4.PULSE v4.3 patch — all still canon, all still inherited.

---

## v4.4 patch · B5 close (2026-05-27)

### What B5 is

The handoff moment. First interactive surface in the Koy landing program. Three hotspots resolve out of the saturation field below the breathing mark, alive but inviting; each tile is a portal into a Phase C template. The narrative closes — *the slime arrived, it spread, it became your tools.*

**Surface:**
- Constellation of three hotspots, woken rest state by default
- Four interaction states: rest / hover / tap / preview-on-touch
- Wake animation (scroll-triggered, fire-once-per-session, 180ms stagger over 960ms)
- 0→700ms half of the tap-to-template transition (Phase C owns >700ms)
- Reverse transition (~900ms, B5-lane)
- Graceful-degradation path for templates not yet ready

**Tonality target:** alive but inviting. Inherits B3/B4/B4.PULSE eldritch-alive register, adds *welcoming*. Continuity with B4.PULSE breath grammar via offset rest-breath cycle (4.8s, off-phase from the mark's 5.2s).

### Sign state · 20 decisions

| ID | Decision | Status |
|---|---|---|
| **B5.COUNT** · three hotspots at launch | Inherited from architect |
| **B5.LAYOUT** · horizontal (desktop) / vertical (mobile), mirrors B4 spread geometry | Inherited from architect |
| **B5.GEOMETRY** · rectangular tile, 3:4 portrait, ~120px desktop / ~90px mobile, ~6px radius | Inherited from architect |
| **B5.INTERIOR** · static fragment of template's cool element (architect rec (a)) | Inherited from architect |
| **B5.FRAME-FILL** · frame-vs-fill rule (B4.05 inherit); two bounded exceptions: wake (manifestation) + long-press (user-invoked) | Inherited from architect |
| **B5.REST** · frame-breath 4.8s, off-phase from B4.PULSE 5.2s. Glow via **L/C on oklch()** — L 0.50→0.62, C 0.08→0.14, blur 12→14px. **Alpha pinned at 0.30.** | **CD v5 signed · Q1 patch** |
| **B5.STAGGER-REST** · per-tile breath phase stagger via `animation-delay: -1.6s / -3.2s` on tiles 2/3 | **CD v5 signed** |
| **B5.HOVER** · desktop-only (`@media (hover: hover)`); 220ms with `--ease-pulse`; border + scale 1.015 base-anchored | Inherited from architect |
| **B5.TAP** · 120ms burst → `--dur-tap-expand` 700ms expansion → frame chroma-desaturation at 600ms → `koy:template:enter` event at 700ms | Inherited from architect |
| **B5.TAP-CURVE** · `--ease-pulse-burst` proposal **FOLDED**; 120ms burst uses `--ease-pulse` directly | **CD v5 · fold** per architect token-reuse lean |
| **B5.UNCHOSEN** · unchosen tiles collapse via `scale(0.92) + filter: brightness(0.7)` — NOT opacity | Inherited from architect |
| **B5.PREVIEW-TOUCH** · mobile-only; 400ms long-press; interior animates briefly during press; `navigator.vibrate(15)` haptic; context menu suppressed | Inherited from architect |
| **B5.WAKE** · IntersectionObserver fire-once-per-session; 180ms stagger; 600ms per tile; full sequence at 960ms. Chroma-saturation NOT fade. | Inherited from architect |
| **B5.GRACEFUL** · tile with `data-template="pending"` taps to scale 1.3 + "Coming soon · vibe TBD" tooltip; resets after 1.4s | Inherited from architect |
| **B5.A11Y** · reduced-motion disables animations (tap still fires); `<button>` markup; `:focus-visible` outline; `aria-label` per tile; WCAG AA contrast | Inherited from architect |
| **B5.HANDSHAKE** · B5 owns 0→700ms; Phase C owns >700ms; boundary marked by `koy:template:enter` event | Inherited from architect |
| **B5.REVERSE** · ~900ms total; frame re-saturates around collapsing interior, tile returns to grid position. Easier to leave than to commit. | Inherited from architect |
| **B5.Z-HOTSPOT** · `--z-hotspot: 10` declared at file-scope; future overlay tokens at 20+ | **Propose · CD → architect** |
| **B5.DUR-EXPAND** · `--dur-tap-expand: 700ms` declared at file-scope | **Propose · CD → architect** |
| **B5.@PROPERTY** · three registered custom properties (`--glow-l`, `--glow-c`, `--glow-blur`) + one inheriting (`--frag-l-mult`) for the wake fragment chroma | **CD v5 signed** |

### Q1 grammar-continuity catch · L/C-on-oklch resolution

Architect brief §02 originally specified the rest-state glow breath as alpha modulation (0.25 → 0.40) on the box-shadow's color-stop alpha channel. CD v5 surfaced at orientation that this would break the no-alpha-ramping lineage B4.PULSE established via `filter: brightness()` — alpha modulation on a shadow channel ≠ element-level `opacity:` ramp grammatically, but visually it IS alpha-channel modulation, which the B-program has otherwise avoided across B3 / B4 / B4.PULSE in favor of brightness or chroma modulation.

Architect signed the re-cast. Implementation: the glow's `oklch(L C 148 / 0.30)` color stop modulates L (0.50 → 0.62) and C (0.08 → 0.14) on the 4.8s cycle, while alpha stays pinned at 0.30. Viewer reads identical visual outcome (glow brightens/dims with breath); the grammar stays clean — no alpha channel touched in the B-program at the file-scope.

Technical implementation: three `@property`-registered CSS custom properties (`--glow-l`, `--glow-c`, `--glow-blur`) enable the keyframe block to animate the variables, which the `box-shadow` declaration reads. Modern browser support universally available 2024-current. Architect commended this as "the technically clean way to animate oklch components in modern browsers."

### Propose-queued items · architect read

- **`--z-hotspot: 10`** — declared at file-scope in B5 preview's CSS with comment. Promote to `koy-tokens.css` at Phase B close consolidated integration. Future overlay tokens at 20+ (modal: 20, toast: 30, etc.).
- **`--dur-tap-expand: 700ms`** — declared at file-scope. Promote to `koy-tokens.css` at Phase B close. Same starting target as architect proposed.
- **`--ease-pulse-burst` FOLDED** — no new token. `--ease-pulse` reused for the 120ms tap-burst. Per architect token-reuse lean: 120ms duration makes finer curve choice perceptually negligible; folding back avoids near-duplicate tokens. Architect commended this as "token-reuse discipline applied correctly; cleanest outcome."

### Naming-vibes-3+ as documented surfaced constraint

B5 ships gracefully without a third named vibe. Bloomberg + Glam Girl + 1 TBD is the Phase C launch count; the third slot defaults to graceful-degradation rest state in B5's constellation. **This surfaces "naming-vibes-3+" as an active product-decision constraint** rather than abstract deferral — the slot is real and visibly unfilled in the launched landing.

Architect note carried forward: B5 ships gracefully without resolution; Phase C kickoff (gated on Sprint 4 close) will surface it as a real decision-point. Documentation is sufficient at this stage; no founder escalation needed from CD lane at this point. Naming remains deferred per founder call, but the constraint is now operationally visible, not abstract.

### Verifier discipline · seventh check codified

The CD-lane verifier discipline now stands at **seven checks**, growing from CD v4's five-check standard:

1. **Fade audit** — no opacity ramps (Rule #9)
2. **Console clean** — no errors at any state transition
3. **Mobile / desktop** — both viewport classes render correctly
4. **Reduced motion** — `prefers-reduced-motion: reduce` disables cleanly
5. **Visual continuity** — continuous reading with prior B-program canon
6. **Moderate-viewport grid-clamp** *(earned at B4.PULSE close, v4.3 patch)* — `minmax(0, …)` on grid-template-columns containing aspect-ratio'd children
7. **Interior content geometry audit** *(earned at B5 close, this patch)* — when vibe-specific tile interiors override base tile properties, verify positioning context isn't collapsed

#### Pattern · interior content geometry audit

Verifier surfaced this on the B5 preview pass:

> When a vibe-specific interior fragment selector (`.kl-frag--glam`) overrides a positioning property on the base interior selector (`.kl-frag { position: absolute; inset: 0; }`), the override can collapse the positioning context to 0 dimensions. Children of the overridden parent — especially absolutely-positioned content like the Glam orb at `left: 50%; top: 55%` — render relative to a zero-height parent and end up out of place.
>
> **Cause:** `.kl-frag--glam { position: relative; }` reset the fragment from `absolute` with `inset: 0` to a static-flow flex container with no explicit height; the flex container collapsed to 0; the absolutely-positioned orb child rendered out of position.
>
> **Fix:** drop the `position: relative;` override. The base `.kl-frag` rule already provides the absolute positioning context the orb needs to anchor against.
>
> **Discipline forward:** any preview HTML (and any production component) that ships vibe-specific tile interior fragments must verify the override doesn't collapse the positioning context. Specifically: when a fragment variant adds geometry overrides, validate the parent retains its base width × height. The verifier walks `getBoundingClientRect()` on each fragment cell to confirm.
>
> **Why this generalizes:** every Phase C template will ship a new tile-interior fragment (`.kl-frag--[vibe]`). Each one is a vector for this same failure if it overrides `.kl-frag` base positioning to introduce inner structure. Codifying this check now means the verifier catches it pre-handoff every time, not after Dev A integrates and Claudette flags on staging.

This check is the **inverse failure** of the moderate-viewport grid-clamp pattern (check 6): that pattern breaks the *frame* of a layout at moderate viewport widths; this pattern breaks the *fill* of a tile via collapsed positioning context. Frame-vs-fill rule is the design discipline; frame-vs-fill verification is the corresponding verifier discipline. The pairing is complete.

### Verifier-iframe pre-wake artifact · known environment quirk

During B5 preview verification, the verifier subagent reported tile-1 (Bloomberg) appearing in pre-wake state (border void, `--frag-l-mult: 0.08`) in their iframe — with `getAnimations()` returning `startTime: null, currentTime: 0` for all three tile animations. The verifier correctly identified this as a rendering artifact specific to their environment, not a real bug.

**Root cause:** CSS animations require a paint tick to begin; some iframe screenshot harnesses capture before the first paint after animation declaration, freezing animation state at t=0. The live preview in the founder's tab and any normal browser render animates correctly through the wake → rest → breath sequence.

**Known forward:** future verifier passes on animation-heavy previews may show similar artifacts. CD-lane treats these as environment quirks unless reproducible in a real browser. Verifier's discipline of flagging-and-not-blocking on these artifacts is correct and carries forward.

### Bridge note · Phase B forward

**Two Phase B surfaces remain:**

1. **B4 spread render** — parked credit-blocked, Higgsfield credit refill expected ~Friday 2026-05-29. B4 v1 landscape + portrait Seedance prompts signed by CD v4, canon, ready for re-run on credit return. **Independent of B5.** Iteration Discipline rule 8 (mandatory reset-line on every Koy Seedance render) carries forward when CD picks the render back up.

2. **Consolidated Dev A integration sprint** — at Phase B close, Dev A lifts the entire Phase B program into the repo as one cohesive sprint: Phase A tokens (`koy-tokens.css` including propose-queued promotions from B4.PULSE and B5), B1/B2/B3 surfaces, B3 v2 MP4 + static JPG, B4 spread, B4.PULSE pulse class, B5 constellation + orchestrator. One Claudette QA pass against staging.

**Composition at integration time:**

- **Wake fires AFTER B4 spread completes.** B4 spread ~2.4s → B5 wake ~960ms = ~3.36s end-to-end from first scroll into bridge zone. App.jsx orchestration sequences the two; B5 module is composition-agnostic.
- **B4.PULSE breath continues throughout B5 states.** The mark above the constellation keeps breathing regardless of constellation state. No coupling.
- **Reverse-transition wiring:** Phase C dispatches `koy:template:exit`; Dev A wires the reverse-transition CSS (B5-lane, already present in this preview). Suggest a small `data-active-template` attribute on the constellation to track which tile was originated from.

**Phase C readiness:**

When Phase B closes, Phase C unblocks (only Sprint 4 close remains as gate). The third template's naming becomes active at Phase C kickoff. B5's graceful-degradation default means the landing is robust to that decision being deferred.

### GitHub connectivity · operational shape

GitHub connection live on CD-lane as of the B5 build pass, but architect-confirmed as **dormant utility until Phase B integrates.** Nothing past Sprint 2 close exists in the repo tree yet (Dev A's branch scan confirmed). The preview-as-contract pattern holds: CD ships HTML previews into the project filesystem; Dev A integrates against them at Phase B close; **after** consolidated integration, CD's GitHub connectivity becomes operationally useful for:
- Verifying previews landed correctly in the repo
- Auditing Dev A's integration against canonical previews
- Grounding future Phase C template work against real repo source

No pulls during build phases. No mid-flight repo reads. Discipline: preview-as-contract until otherwise authorized.

### Discipline patterns inherited from CD v4 / carried forward to next deliverable

All five patterns from CD v4's last pass remain canon. None re-litigated:
- **Tonality-vs-genre sign-language scoping** — not exercised on B5 (CSS surface, no Seedance prompts) but inherited intact for next motion deliverable.
- **IP-discipline mascot-formless rule** — not exercised on B5 (CSS surface, no named-entity output) but inherited intact.
- **Reset-line mandatory for Seedance** — not exercised on B5 but inherited intact for B4 spread re-run when credits return.
- **Pause-and-report rhythm** — held across all three deliverables (B4.PULSE preview, B4.PULSE patch, B5 preview, B5 patch). No bundling.
- **Verifier rigor pre-handoff** — fade audit, console, mobile/desktop, reduced-motion, visual continuity carried forward across both B4.PULSE and B5; **two new patterns added by CD v5** (grid-clamp at B4.PULSE, interior geometry audit at B5) for a six → seven check standard.

### Lane state at B5 close

- **CD v5** running smooth at v4.4 patch level. Both B4.PULSE and B5 closed; verifier discipline grew by two checks under this instance.
- **B5 preview** built, six-check verified, glam-fragment positioning bug caught by verifier and fixed, signed-clean by architect.
- **Pause-and-report** held throughout — one deliverable per response across both bundles.
- **CLAUDESIGN full regen** waits for Phase B close = v5.0.
- **Next deliverable** pending architect authorization. Likely paths: B4 spread re-run on credit return (CD v4 has the signed prompts), or consolidated Dev A integration audit, or Phase C template spec kickoff (gated on Sprint 4 close, but CD-lane scoping work may begin earlier).

---

**Patch ends.**

— Claudesign v5, 2026-05-27
