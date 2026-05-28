# Koy Landing — B4 Preview · PATCH · v4.3 · Deferred-asset integration contract

**Patch authored:** Claudesign v5, 2026-05-27
**Scope:** Single-row addition to §09 decisions log + one-line addition to §07 render path of `Koy Landing - B4 Preview.html`.
**Reason:** Path C integration shape (Phase B closes before B4 spread MP4 lands; asset slot-in deferred to whenever Seedance render completes) requires the deferred-deployment lifecycle to be an explicit integration contract, not derived implicitly from the §06 runtime fallback chain. Dev A's consolidated Phase B integration brief needs a contract row to reference — not a runtime-failure-handling row that happens to also work for a deferred deployment.
**Apply at:** Append the new decision row to §09 decisions log table (sits between B4.07 fallback and B4.RENDER rows, OR appended as B4.08 at table end). Append the §07 prose line to the render-path section after the existing static-frame deliverables paragraph. Bump B4 spec doc-version stamp from **v4.2 → v4.3**.
**Doesn't supersede:** Anything in v4.2. B4 §08 visual target sign, B4 v1 landscape + portrait Seedance prompts, B4.GEOMETRY lock, B4.NAMING, B4.BRIDGE rename, B4.07 fallback chain — all still canon. This patch ADDS the deferred-deployment row alongside.

---

## What this patch addresses

The B4 v4.2 spec was authored under the assumption that B4 spread MP4 would land before consolidated integration (founder's Higgsfield credit refill expected ~Friday 2026-05-29; integration sprint would then proceed against the live asset). Architect's Path C decision changes the integration shape: **Phase B closes architecturally without waiting for the asset.** Dev A's consolidated integration sprint wires the full B4 spread render path — video element, `onended` swap, saturation field classes, B5 wake compose-against-spread integration — but with no MP4 asset file initially present. When Seedance render completes (Friday, next week, whenever), the asset drops into `public/` with the specced filename and slots in with zero code change.

The end-state is already covered by the existing §06 runtime fallback chain (a missing MP4 = 404 = `onerror` = `data-state="settled"`). But the deferred-deployment framing was implicit; this patch makes it explicit.

**Architectural shape (per architect's call):** integration-time graceful default = B3 v2 settled state with B4.PULSE breathing composes directly into B5 constellation wake, **no spread motion in between**, until the MP4 lands. No CSS placeholder motion (we don't downgrade signed canon — the B4 §08 visual target is the visual target, full stop). The slot is reserved; the absence is silent.

---

## Patch · §09 decisions log row

Append the following row to §09 decisions log table. Place after the B4.07 fallback row, before B4.RENDER (or appended as B4.08 at end — table-sort indifferent):

| ID | Decision | Rationale | Status |
|---|---|---|---|
| **B4.08 · deferred-asset** | **Deferred-asset integration contract.** B4 spread MP4 may be intentionally absent at consolidated Phase B integration time; landing must compose cohesively in its absence and slot the asset in seamlessly when it lands. Integration-time graceful default: B3 v2 settled state with B4.PULSE breathing composes directly into B5 constellation wake — no spread motion, no CSS placeholder motion. Static field-still PNG (§07) does NOT render in deferred-asset state (it's a fallback for users whose runtime fails to load an asset that IS deployed; not for the deployment-absent case). When MP4 lands, drop into `public/` at the specced filename (`koy-spread-motion-{landscape,portrait}-v{N}-CANON.mp4`); video element resolves; spread renders on next page load; no code change required. | Path C integration shape per architect 2026-05-27. Distinct from B4.07 runtime fallback chain: that handles per-session asset-load failures of a deployed asset; B4.08 handles intentional deployment-absent state of an asset queued for later delivery. Operationally identical at the render layer; semantically distinct at the integration contract layer. Parallels B4.BRIDGE rename as a queued-refactor case: both are queued-coordination items resolved at consolidated integration. | Locked · v4.3 |

## Patch · §07 render path one-line addition

Append the following paragraph to §07, after the existing static-frame deliverables paragraph (immediately before the §07 architect-failure-modes block):

> **Deferred-asset deployment.** When B4 spread MP4 has not yet landed at consolidated Phase B integration (Path C shape), the production deployment proceeds without the asset present in `public/`. The video element's `src` resolves to a 404; `onerror` fires; the `data-state="settled"` branch sets directly on the bridge zone — bypassing the static field-still PNG substitute (that substitute is for runtime asset-load failures of a deployed asset, not for the deployment-absent case). B3 v2 + B4.PULSE composes directly into B5 constellation wake until the asset lands. Asset slot-in is single-file-drop at `public/koy-spread-motion-{landscape,portrait}-v{N}-CANON.mp4`; no code, no markup, no CSS changes required. The deferred-asset state is the **integration contract**, not a fallback — silent, intentional, and resolvable on first asset delivery without redeploy of integration code.

---

## Implementation notes for Dev A (per architect's consolidated integration brief)

(Not changes to the spec; clarifications for Dev A's lift. Lives in Dev A's integration brief, not in the B4 preview file itself.)

1. **Video element renders unconditionally** — markup unchanged whether MP4 is present or absent. The element loads; `onerror` handles the 404 case. Do not conditionally render the video element based on asset presence; that would introduce branching that breaks the zero-code-change slot-in property.

2. **`onerror` and `onended` route to the same branch** — both set `data-state="settled"` on the bridge zone. The deferred-asset case fires `onerror`; the successful-render case fires `onended`. Same CSS cascade triggers.

3. **`data-state="settled"` cascade fires the B5 wake-against-spread compose path** — even without spread motion having actually played. The wake reads correct because the B5 spec is "defensible standalone" (per B5 brief §04, CD v5 signed at Q3); B5's wake fires its own animation regardless of what happened above.

4. **Static field-still PNG (§07) is NOT a placeholder for deferred-asset.** It's the substitute for runtime asset-load failures of an asset that IS deployed (low-bandwidth timeout, network failure on a single session, etc.). In deferred-asset state, there's no asset to substitute for; the bridge zone simply transitions to `data-state="settled"` without intermediate visual. The static PNG remains required as a `public/` deliverable for the post-deployment runtime fallback chain — but it is NOT rendered in the deferred-asset state.

5. **Slot-in is a no-op for integration code.** When `koy-spread-motion-landscape-v1-CANON.mp4` and `koy-spread-motion-portrait-v1-CANON.mp4` land in `public/`, the next user session's video element resolves the request, `onload` / `onloadeddata` fires, and the spread motion renders on the standard scroll-trigger path. No redeploy of `App.jsx`, `koy-landing.css`, or any orchestration code. **This is the architectural property the patch enforces:** the deferred-asset state is not an alternate code path but the same code path running against an absent asset.

6. **No regression in §06 runtime fallback chain.** A user whose connection is slow on a session where the MP4 IS deployed still hits the low-bandwidth / asset-load-fail fallback per B4.07; the static PNG renders; same end-state. The §06 chain and B4.08 deferred-asset state are independent layers of the same end-state composition.

---

## Lane discipline · queued-asset-coordination case

This patch establishes a **third queued-coordination pattern** at consolidated Phase B integration, alongside two already in flight:

| Pattern | What's queued | Resolved at |
|---|---|---|
| **B4.BRIDGE rename** | `.kl-bridge__line` → `.kl-bridge__seam` refactor | Single-atomic-commit at consolidated integration |
| **B4.08 deferred-asset** | B4 spread MP4 file deployment | Single-file-drop at any time post-integration |
| **Propose-queued tokens** (B4P, B5) | `--ease-pulse-out` candidacy, `--z-hotspot: 10`, `--dur-tap-expand: 700ms` | Promoted into `koy-tokens.css` at consolidated integration |

Common shape: **the consolidated integration sprint is the resolution venue for spec-canon items queued during Phase B mid-flight.** Each item lands its resolution atomically at integration; integration brief lists them as explicit contract items so nothing slips.

Lane discipline forward: **queued-coordination items get explicit names and decision rows.** Implicit coverage isn't sufficient at the contract layer — Dev A needs a list to check against. The CD-lane verifier discipline (now seven checks + the verifier-prose pattern as #8) extends to: **at consolidated integration time, verify every queued-coordination item resolved as specified.** This is a new CD-lane discipline that the v5.0 regen will codify alongside the rest.

---

## Effect on v5.0 regen

This v4.3 patch on the B4 preview doc-version stamp does NOT bump CLAUDESIGN. CLAUDESIGN is at v4.4 post-B5 patch; B4 v4.2 → v4.3 is a doc-internal version stamp on `Koy Landing - B4 Preview.html`, independent of the CLAUDESIGN lineage. The two version sequences are distinct artifacts:

- `Koy Landing - B4 Preview.html` · spec doc · v4.3 after this patch
- `CLAUDESIGN.md` · lane continuity · v4.4 after the B5 close patch · v5.0 at Phase B close

At Phase B close, CLAUDESIGN v5.0 regen will incorporate B4.08 (this patch) alongside the rest of the Phase B canon. No mid-flight CLAUDESIGN bump needed for this patch; it's bounded to the B4 spec doc only.

---

## Closing note

The deferred-asset case isn't a downgrade; it's an integration shape choice. The brief's signed visual target (§08), the locked geometry (B4.GEOMETRY), the signed v1 Seedance prompts — all hold. **Path C just decouples deployment timing from spec resolution.** When the asset lands, it slots into a code path that's already been verified-against-its-absence. This is the cleanest possible integration shape for a queued-asset case, and it generalizes for any future asset that needs to ship before its file is ready (e.g. Phase C templates, if a template's hero video is queued separately from its layout code).

CD v5 holds. Pause-and-report.

---

**Patch ends.**

— Claudesign v5, 2026-05-27
