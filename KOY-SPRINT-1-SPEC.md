# KOY CALENDAR — SPRINT 1 SPEC

Sprint name: "Koy is now real on mobile and shareable"
Goal: Public viewable pages with proper mobile rendering, plus security hardening.
Estimated scope: 4 features. Should ship as one cohesive update.

---

## SCOPE

This sprint includes:
- Mobile single-column re-render
- Public shareable URLs at `/u/{handle}`
- Header collapse to `← KOY ⋯` on mobile
- SQL hardening migration

This sprint does NOT include (deferred to later sprints):
- Image/video upload
- GIF integration
- Editable calendar
- Schema rename (`trading_days` → `calendar_entries`)
- Months archive rebuild
- Marketplace, contests, feeds

---

## 1. MOBILE SINGLE-COLUMN RE-RENDER

(see chat for full content — already on disk in agent sandbox)
