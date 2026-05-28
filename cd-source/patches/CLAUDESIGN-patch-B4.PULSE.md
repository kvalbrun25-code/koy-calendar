# CLAUDESIGN.md · PATCH · B4.PULSE close

**Patch authored:** Claudesign v5, 2026-05-27
**Scope:** Single-entry append to CLAUDESIGN.md (lane continuity doc). NOT a regen.
**Reason:** B4.PULSE closed inside Phase B mid-flight; full regen waits for Phase B close per protocol. Without this patch, the lane history loses B4.PULSE entirely.
**Apply at:** Insert as new section after the v4.2 B4 sign-state block, before any Phase B close summary. Bump CLAUDESIGN doc-version stamp to **v4.3** (patch-level bump, not phase-boundary regen).
**Doesn't supersede:** Anything in v4.2. B3 v2 canon, B4 §08 visual target sign, B4 v1 Seedance prompts, B4.BRIDGE rename, B4.GEOMETRY lock, B4.NAMING — all still canon, all still inherited.

---

## v4.3 patch · B4.PULSE close (2026-05-27)

### What B4.PULSE is

Pure CSS keyframe breathing on the B3 v2 settled mark. Ambient at-rest loop — answers the viewer question *"Wait, is this thing still there?"* without moving. Three synchronized effects on a 5.2s infinite cycle:

- **Scale** 1.000 → 1.012, anchored at `transform-origin: center 80%` (widened base, spring-not-drain)
- **Brightness** 0.94 → 1.06 via `filter: brightness()`
- **Blur** 0 → 0.4px via `filter: blur()` (Effect C, default included)

Asymmetric pacing via per-segment `animation-timing-function` declarations inside `@keyframes` (animation property is `5.2s linear infinite`; the asymmetry lives in the keyframe block):

- **0% → 45% (inhale)** — `var(--ease-pulse)` from `koy-tokens.css` (token reuse, "organic asymm., breathes")
- **45% → 55% (peak hold)** — `linear` (cosmetic, values don't change)
- **55% → 100% (exhale)** — `cubic-bezier(0.25, 0.65, 0.45, 1)` (faster-out / slower-settle)

`prefers-reduced-motion: reduce` disables entirely — `animation: none; filter: none;`. Hard requirement, not optional.

### Sign state

| Decision | Status | Source |
|---|---|---|
| **B4P.SCALE** · max 1.012 anchored at `center 80% Y` | Inherited from architect | brief §07 |
| **B4P.DURATION** · 5.2s per cycle, ±0.4s tunable margin unused | Inherited from architect | brief §07 |
| **B4P.BRIGHTNESS** · synchronized 0.94 → 1.06 | Inherited from architect | brief §07 |
| **B4P.BLUR** · include (Effect C ON) | **CD v5 signed** | preview §03 compare frame; default position held — 0.4px peak doesn't register as defocus on the substrate, adds edge-breathing that disambiguates breath from UI-scale |
| **B4P.LOOP** · infinite, no triggering | Inherited from architect | brief §07 |
| **B4P.A11Y** · `prefers-reduced-motion: reduce` disables entirely | Inherited from architect | brief §07 |
| **B4P.INDEPENDENCE** · runs independently of B4 spread / B5 hotspots | Inherited from architect | brief §07 |
| **B4P.SHIP-PATH** · no Seedance dependency; ships when CD signs + Dev A integrates | Inherited from architect | brief §07 |
| **B4P.CURVES** · per-segment timing functions; animation property is `5.2s linear infinite`; inhale reuses `--ease-pulse` token | **CD v5 signed** + **architect-lane patch** | CD v5 Q2 catch (brief §02 keyframe block was inconsistent with prose), architect patch 2026-05-27 corrected; final shape preserves architect intent, fixes token-grammar reuse |
| **B4P.SUBSTRATE** · preview demo on CSS-built v2-shape mark; production applies same class to real `<img src="koy-rip-static-final-frame-v2.jpg">` | **CD v5 signed** | Q1 sign — pulse is a CSS contract, substrate-agnostic |
| **B4P.PROPOSE-EASEOUT** · `--ease-pulse-out` token candidacy logged | **Propose · CD → architect** | If exhale curve recurs in future deliverables, promote to token at next Phase A reconciliation; not file-scope inventing |

### Verifier discipline · novel pattern logged

**Grid-column overflow at moderate viewport with aspect-ratio'd children.** First time CD-lane has logged this. Pattern:

> A two-column grid (`grid-template-columns: 1.4fr 1fr`) containing a child with `aspect-ratio` + `min-height` produces overlap in the 890–1100px viewport band. The aspect-ratio child establishes an intrinsic min-width that the `fr` track can't undercut, and the grid silently overlaps the second column rather than reflowing.
>
> **Fix:** wrap each track in `minmax(0, Nfr)` — e.g. `grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr)`. The `minmax(0, …)` clamps the track's minimum below the child's intrinsic min-width, letting the column shrink and the aspect-ratio child contract proportionally.
>
> **Caught by:** verifier subagent on B4.PULSE preview pass.
>
> **Discipline forward:** any preview HTML with a two-column-grid hero containing a stage / artboard / aspect-ratio'd cell must clamp tracks with `minmax(0, …)`. Add to default scaffold patterns.

Adds a corollary to the existing CD-lane verifier checks — beyond the five-check standard (fade audit, console, mobile/desktop, reduced-motion, visual continuity), this is now part of mobile/desktop pass: **moderate-viewport overflow check at 890–1100px** when the layout includes aspect-ratio'd grid children.

### Bridge note · B4 spread / B5 / Phase B forward

**B4 spread** remains parked credit-blocked. Founder's Higgsfield credit refill expected ~Friday 2026-05-29. B4 v1 landscape + portrait Seedance prompts still signed by CD v4, still canon, ready for re-run on credit return. B4.PULSE shipping does **not** advance B4 spread state — they're independent surfaces with no coupling.

**B4.PULSE composes with B4 spread when spread lands:** spread happens BELOW the mark; the upper mark continues to breathe in landing-resolved mode throughout. Spring-not-drain reading reinforced (mass keeps breathing while slime descends below). No coupling, no synchronization, two simultaneous motions on different surfaces. This is the cleanest integration shape and the reading the architect signed in §04 of the B4.PULSE brief.

**B4.PULSE composes with B5 alive hotspots when hotspots arrive:** pulse continues throughout hotspot wake / rest / interaction states. Pulse is the mark's permanent at-rest condition while on screen, regardless of what hotspots do.

### What B4.PULSE means for Phase B sequencing

B4.PULSE shipping independently makes B4 spread parking **lower-cost** than it would otherwise be. The mark feels finished — alive, held, watching — without the spread render. If the spread re-run gets pushed past Friday for any reason (credit, prompt iteration, Seedance availability), the landing experience is still cohesive. Phase B can close on B4.PULSE + a deferred B4 spread without the landing reading as broken.

The architect's framing — *"highest-value Phase B deliverable per agent-cycle"* — held in execution. Surface small (one keyframe + one class + one media query), perceptual lift large (the mark transitions from screenshot to presence).

### Lane state at B4.PULSE close

- **CD v5** inheriting v4.2 cleanly; nothing re-litigated
- **B4.PULSE preview** built, verified, signed by architect (this patch is the close artifact)
- **Pause-and-report** held — preview was the only deliverable in the response, no bundling
- **Phase B not yet closed** — B4 spread parked, B5 queued; CLAUDESIGN full regen waits for Phase B close
- **Discipline patterns from CD v4** carried forward without exception:
  - Tonality-vs-genre sign-language scoping — not exercised on B4.PULSE (CSS surface, no Seedance prompts) but inherited intact for next motion deliverable
  - IP-discipline mascot-formless rule — not exercised on B4.PULSE (CSS surface) but inherited intact
  - Reset-line mandatory for Seedance — not exercised on B4.PULSE but inherited intact for B4 spread re-run when credits return

### Next deliverable (pending architect authorization)

CD v5 holds at pause-and-report. Architect calls next surface — B4 spread re-run on credit return, B5 alive hotspots spec, or another priority.

---

**Patch ends.**

— Claudesign v5, 2026-05-27
