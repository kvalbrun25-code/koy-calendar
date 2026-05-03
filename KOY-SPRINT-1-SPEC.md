KOY CALENDAR — SPRINT 1 SPEC
Sprint name: "Koy is now real on mobile and shareable"
Goal: Public viewable pages with proper mobile rendering, plus security hardening.
Estimated scope: 4 features. Should ship as one cohesive update.
---
SCOPE
This sprint includes:
Mobile single-column re-render
Public shareable URLs at `/u/{handle}`
Header collapse to `← KOY ⋯` on mobile
SQL hardening migration
This sprint does NOT include (deferred to later sprints):
Image/video upload
GIF integration
Editable calendar
Schema rename (`trading\_days` → `calendar\_entries`)
Months archive rebuild
Marketplace, contests, feeds
---
1. MOBILE SINGLE-COLUMN RE-RENDER
Problem
Current Koy renders the same absolute-positioned canvas on mobile as desktop. On a 390px iPhone screen this produces:
Header bar overflows right (controls cut off)
Blocks extend beyond viewport on both sides
Calendar shows only 3 of 7 day columns
Drag-and-drop conflicts with scroll, causing accidental block moves
Page is unsharable because viewers see broken layouts
Solution
Mobile is a different rendering of the same `blocks` JSON, not a rescaling of the desktop canvas.
Detection
Use a viewport width breakpoint at 768px.
`≥ 768px` = desktop mode (current canvas behavior, draggable, free-positioned)
`< 768px` = mobile mode (new behavior, defined below)
Detect via `window.matchMedia('(max-width: 767px)')` and a state flag. Re-evaluate on resize and on orientation change.
Mobile rendering rules
Layout:
Single vertical scrollable column
Each block becomes a full-width card with `width: 100%; max-width: 100vw`
Horizontal padding: 12px on the page container
Vertical gap between cards: 16px
No horizontal scroll anywhere on the page (test with `overflow-x: hidden` on root)
Block ordering:
The order of cards top-to-bottom is computed at render time from desktop `x, y` coordinates:
Sort blocks by `y` ascending (lowest y first)
For blocks within 60px of each other on `y`, sort by `x` ascending
This produces the natural reading order without requiring designers to set anything
Block-specific behavior:
Calendar block: Renders as full-width 7-column grid. Cells are `(viewport\_width - 24px) / 7` wide. Day labels (S M T W T F S) abbreviate to single letters. Numbers and emoji/labels stay visible. No scaling glyphs to illegibility.
Sticky note / text block: Full width, content reflows naturally. Font size unchanged from desktop.
Stats block: Full width, stats stack vertically inside the card if too narrow horizontally.
Comments block: Full width. Comment list scrolls within block if long. Input field full-width with POST button on the right.
Sticker blocks (floating emoji): Become a horizontal-scroll strip at the very top of the page (above all cards). Strip height: 56px. Each sticker is a 40px tile. Strip is decorative — no interaction other than scrolling.
Image block: Full width, height auto-scaled by aspect ratio.
YouTube/SoundCloud embed blocks: Full width, 16:9 aspect ratio for video, 100px height for SoundCloud.
Backgrounds:
Page background still applies as full-bleed behind cards
Cards inherit their `style.bg` from desktop config (transparent or colored)
If a sticker becomes a card on mobile (edge case for very large stickers), give it a transparent background
Interaction (mobile):
NO drag-and-drop on mobile, ever. Touch events on blocks should not trigger position changes.
Tap a block opens a small bottom sheet with three options: 🗑 Delete, ✏️ Edit content, 🎨 Style.
Reorder is rare on mobile. Bottom sheet includes ↑ Up / ↓ Down arrows that move the block one slot in the sort order. Persist this by adjusting the block's `y` coordinate (decrement to move up, increment to move down). Save on click.
Add block via the `+` in the collapsed header menu (see section 3).
Edit mode:
No separate edit mode on mobile. Tapping enters edit-via-sheet directly.
This means there is no accidental drag because there's no drag at all.
Public-view rendering on mobile
When a non-logged-in user views `/u/{handle}` on mobile, the page renders in read-only mobile mode:
Same single-column stack
No tap-to-edit (taps do nothing or scroll)
Comments block input is visible but disabled with placeholder "log in to comment"
A pinned bottom CTA: "Make your own page → koy.app"
---
2. PUBLIC SHAREABLE URLS
Routes
`/u/{handle}` — public read-only view of a user's active page
`/u/{handle}/edit` — owner-only edit view (redirects to login if not authenticated, or to `/u/{handle}` if authenticated as different user)
`/` — current behavior (start screen for new visitors, or own page for logged-in users)
Handle resolution
`handle` is the `profiles.handle` column
If a user has a handle set (e.g., `khalid`), URL is `koy.app/u/khalid`
If a user has no custom handle, the auto-generated `user\_xxxxxxxx` is used as the URL
Handles are case-insensitive for lookup (store as lowercase, accept any case in URL)
Onboarding addition
Add a "claim your handle" step to onboarding. After persona pick + template pick, before landing on the page:
"Pick your koy handle"
Input field with `koy.app/u/` prefix shown next to it
Validation: 3-20 chars, alphanumeric + underscore + hyphen, lowercase enforced
Live availability check against `profiles` table
"Skip for now" button keeps the auto-generated handle
Page visibility
All pages are publicly viewable by default at their `/u/{handle}` URL
No private/listed toggle in this sprint
The default `pages.is\_active` flag continues to control which page is the user's "live" page (only one page is shown at the public URL — the active one)
Share button behavior
Top-bar share button (current placeholder) now copies the real URL: `https://koy-calendar-ecek.vercel.app/u/{handle}`
Show "✓ COPIED" confirmation toast for 2 seconds
If user has no handle yet, the button opens the "claim your handle" modal instead of copying
Public page viewer
Renders the user's active page (`pages` row where `user\_id = X AND is\_active = true`)
Read-only: no edit affordances, no `+ block` menu, no style panel
Shows the user's display name and handle in a small header strip
Comments block is interactive for logged-in viewers (they can post comments) but read-only for anonymous viewers
"Make your own page" CTA pinned at the bottom for non-logged-in viewers
SEO and metadata
Each public page sets `<title>` to `{display\_name} on Koy` and a meta description of the user's bio
Open Graph tags for Twitter/Facebook/iMessage previews:
`og:title` = display name + " on Koy"
`og:description` = user's bio (truncated to 200 chars)
`og:image` = a generated preview image (deferred — for v1, use a default Koy logo image)
`og:url` = the canonical URL
This makes shared links look good in iMessage/Twitter/Discord previews
---
3. HEADER COLLAPSE ON MOBILE
Current state
Top bar shows: `← ● KOY ↩ ↪ 🔗 📅 💾 bg + 📎` (10+ items, overflows iPhone width)
Mobile state (< 768px)
Top bar shows: `← ● KOY ⋯`
`←` Back arrow (returns to start screen if in editor)
`●` Status dot (saved/saving indicator)
`KOY` brand
`⋯` Menu trigger (opens bottom sheet)
Bottom sheet contents (when ⋯ tapped)
A sheet slides up from the bottom of the screen containing all the controls that used to live in the header:
↩ Undo
↪ Redo
🔗 Copy share link
📅 Open Months archive
💾 Save page
🎨 Change background
➕ Add block (opens block-type picker as nested sheet)
📎 Attach (currently unused — preserve for future)
Each item is a row with icon + label, 56px tall, full-width tappable.
Desktop state (≥ 768px)
Header keeps current behavior (all controls visible in top bar).
Status dot behavior (both mobile and desktop)
Green: saved
Yellow: saving in progress
Red: save failed
Gray: no changes since load
---
4. SQL HARDENING MIGRATION
Three vulnerabilities in the current schema must be fixed before public pages ship:
Issue A: `user\_events` insert policy is wide open
```sql
-- current (BAD):
create policy "Anyone can insert events"
  on public.user\_events for insert with check (true);
```
Anyone can insert events with arbitrary `user\_id`, poisoning the data table that's intended for AI training revenue.
Issue B: `pages.is\_active` allows multiple "active" pages per user
Nothing prevents a user from having two pages both flagged active. This breaks the "show me my live page" lookup at `/u/{handle}`.
Issue C: `updated\_at` columns don't auto-bump on update
Both `profiles.updated\_at` and `pages.updated\_at` are set on insert but never updated. Timestamps lie.
Migration
A standalone SQL file (`sprint-1-migration.sql`) must be run in Supabase SQL Editor. Provided separately. Contents:
Tighten `user\_events` insert policy
Add partial unique index on `pages` for `is\_active = true`
Add trigger function `update\_updated\_at\_column()` and attach to `profiles` and `pages`
Add DELETE policies for `comments` and `trading\_days` (also missing)
Mirror page visibility rule onto comments SELECT policy
The migration is idempotent (safe to run multiple times) and non-destructive (no data loss).
---
ACCEPTANCE CRITERIA
Mobile rendering
[ ] Open `koy-calendar-ecek.vercel.app` on iPhone Safari (or Chrome DevTools at 390px viewport). Header shows only `← ● KOY ⋯`.
[ ] All blocks render in a single vertical column with no horizontal scroll.
[ ] Calendar block shows all 7 day columns.
[ ] Sticky notes show full content (no left-edge or right-edge clipping).
[ ] Comments block shows full username and message text.
[ ] No accidental block drags occur during normal scrolling.
[ ] Tapping a block opens the action sheet (delete/edit/style/up/down).
Share layer
[ ] Click 🔗 in top bar → real URL copied to clipboard.
[ ] Open `koy.app/u/{your-handle}` in a logged-out browser → page loads correctly without auth.
[ ] Public page on iPhone renders identically to logged-in mobile view, minus edit affordances.
[ ] iMessage preview of shared URL shows display name and bio.
[ ] Anonymous viewer cannot edit or post comments.
SQL hardening
[ ] Run migration in Supabase SQL Editor → no errors.
[ ] Attempt to insert into `user\_events` with mismatched `user\_id` from authenticated session → fails.
[ ] Update a `profiles` row → `updated\_at` reflects the new time.
[ ] Attempt to set two pages as `is\_active = true` for the same user → second update fails.
Header
[ ] On desktop (≥768px), header is unchanged from current.
[ ] On mobile (<768px), header shows `← ● KOY ⋯` only.
[ ] Tapping ⋯ opens a bottom sheet with all moved controls.
[ ] Bottom sheet dismisses on outside tap or swipe-down.
---
TECHNICAL NOTES FOR THE IMPLEMENTOR
React import pattern is critical: Use `import { useState, useEffect } from "react"` — NEVER `import React, { useState } from "react"`. The artifact renderer breaks on the latter. All components must use `function ComponentName()` declarations and `export default App` as a separate line at the bottom.
Existing file: `src/App.jsx` in the `koy-calendar` repo. Edit in place.
Routing: Add React Router (`react-router-dom`) for the `/u/{handle}` routes. Currently the app is a single-page state machine; this becomes the first real route.
Supabase client: Already configured. Use the existing client for handle lookups and page reads. Use `auth.getUser()` to check if viewer is logged in.
Mobile detection: Use a custom hook `useIsMobile()` returning a boolean from a `matchMedia` listener. Avoid user-agent sniffing.
No external animation libraries for the bottom sheet. CSS transitions on transform: translateY are sufficient.
Handle uniqueness: The `profiles.handle` column already has a unique constraint. Live availability check during onboarding does a SELECT against this column.
---
DEFERRED TO LATER SPRINTS (do not build now)
Image and video upload (Sprint 2)
Giphy/Tenor GIF integration (Sprint 2)
Editable calendar with bottom-sheet date editor (Sprint 2)
Schema migration `trading\_days` → `calendar\_entries` (Sprint 2)
Months archive rebuild with real page snapshots (Sprint 3)
Marketplace (`templates\_marketplace` table, purchase flow) (later)
Public/private/listed visibility toggle (later)
Per-month shareable URLs (later)
Discovery feeds and algorithmic ranking (later)
Contest mechanics and feat
