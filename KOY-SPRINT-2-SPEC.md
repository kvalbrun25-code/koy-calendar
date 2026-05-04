# KOY CALENDAR — SPRINT 2 SPEC

**Sprint name:** "Calendar comes alive, account becomes real, media uploads land"
**Goal:** Editable calendar, image/GIF uploads, account management, login/logout, branding fixes, YouTube fix.
**Estimated scope:** 10 chunks, each independently committable.

---

## SCOPE

This sprint includes:
1. Login/logout button + account dropdown (UI control)
2. Account settings page (edit display name, handle, email)
3. Schema migration: `trading_days` → `calendar_entries` (additive, non-destructive)
4. Editable calendar: per-day fields (emoji, label, numeric, count, journal)
5. Calendar freeform mode: per-cell mini-canvas with placeable elements
6. Image upload (Supabase Storage)
7. Tenor GIF search and embed
8. Green K branding: favicon + OG image
9. YouTube embed fix (iframe sandbox + autoplay policy)
10. Public page: anonymous viewers see uploaded images

This sprint does NOT include (deferred):
- Video upload (deferred to a later sprint — too expensive for free tier without transcoding)
- Months archive rebuild (Sprint 3)
- Marketplace, contests, feeds (later sprints)
- `trading_days` table drop (deferred to Sprint 3 after one cycle of stability on `calendar_entries`)

---

## CHUNK 1: SCHEMA MIGRATION (do this first)

This chunk is SQL only — no app code changes. Run before any other chunk so subsequent chunks have the new table to write to.

### File: `sprint-2-migration.sql`

Provided as a separate file. Creates `calendar_entries` table additively (does NOT drop `trading_days`), copies existing rows, sets up RLS policies, adds the new columns required for editable calendar (emoji, label, freeform_blocks). Idempotent.

### Acceptance
- Run in Supabase SQL Editor → "Success. No rows returned."
- `select count(*) from calendar_entries` returns same count as `trading_days`.
- `\d calendar_entries` shows new columns.

---

## CHUNK 2: LOGIN/LOGOUT CONTROL

### Desktop top bar
Add an account control to the right end of the top bar:
- If user is anonymous: a "Log in" button → opens existing auth modal
- If user is authenticated: shows `@{handle}` with a small chevron → click opens dropdown:
  - "Account" → routes to `/account`
  - "Log out" → calls `supabase.auth.signOut()`, redirects to `/`

### Mobile bottom sheet
Add to the bottom sheet (the one we built in Sprint 1):
- Same control, full-width row
- Logged out: "Log in / Sign up" row
- Logged in: shows `@{handle}` at top of sheet, with "Account" and "Log out" rows below

### Acceptance
- Anonymous viewer sees clear way to log in.
- Authenticated user always sees their handle and can log out in 2 taps.

---

## CHUNK 3: ACCOUNT SETTINGS PAGE

### Route: `/account`
Owner-only. If not logged in, redirect to `/`.

### Fields
- **Display name** — editable text input, no uniqueness required, max 50 chars
- **Handle** — editable text input, must be unique (live availability check using existing onboarding logic), 3-20 chars, `[a-z0-9_-]`, lowercase enforced
- **Email** — editable text input. Changing requires Supabase email change confirmation (`supabase.auth.updateUser({ email })` triggers a confirmation email to both old and new addresses)
- **Save changes** button — disabled until something is actually changed, shows yellow "saving" state, then green "saved" toast

### Validation
- Handle availability checked on blur and on submit
- Email format validated client-side
- All errors shown inline below the relevant field

### Acceptance
- User can update display name, see it reflected on their public page within 5 seconds
- User can change handle, public URL updates accordingly (`/u/{old}` returns 404, `/u/{new}` works)
- User can change email, receives confirmation in inbox

---

## CHUNK 4: BRANDING FIXES (favicon + OG image)

### The K logo
Use this exact SVG (Khalid's brand mark):

```svg
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <rect width="64" height="64" rx="12" fill="#22c55e"/>
  <path d="M18 14h8v18l16-18h10L34 33l18 17H42L26 34v16h-8z" fill="white"/>
</svg>
```

(Green rounded square with white K. Adjust path slightly if needed for visual balance — let the dev fine-tune.)

### Files to update
- `public/favicon.svg` — the SVG above
- `public/favicon.ico` — fallback PNG version (32x32 and 16x16)
- `public/og-image.png` — 1200x630 social preview, green background with white K centered, "koy" wordmark below in the same white
- `index.html` `<head>` — link tags pointing to the new favicons, `<meta property="og:image">` updated

### Acceptance
- Browser tab shows green K icon
- Sharing a page link to iMessage/Twitter/Discord shows the green K preview image
- Public page (not just home) also uses the green K

---

## CHUNK 5: YOUTUBE EMBED FIX

### Problem
YouTube embeds aren't playing on Vercel deployment.

### Likely causes (debug in this order)
1. Iframe missing required `allow` attributes for autoplay/fullscreen
2. URL format wrong — must use `youtube.com/embed/{video_id}`, not `youtube.com/watch?v={id}`
3. Missing `referrerpolicy="strict-origin-when-cross-origin"` (Vercel hosts on a subdomain that some YouTube videos block by default)

### Required iframe pattern
```jsx
<iframe
  src={`https://www.youtube.com/embed/${videoId}?rel=0`}
  title="YouTube video player"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  referrerPolicy="strict-origin-when-cross-origin"
  allowFullScreen
  style={{ width: '100%', aspectRatio: '16/9', border: 0 }}
/>
```

### Helper function for URL parsing
```js
function extractYouTubeId(url) {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([\w-]{11})/);
  return match ? match[1] : null;
}
```

### Acceptance
- User pastes any of these and it embeds and plays:
  - `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
  - `https://youtu.be/dQw4w9WgXcQ`
  - `https://www.youtube.com/embed/dQw4w9WgXcQ`
- Plays on iPhone Safari and desktop Chrome

---

## CHUNK 6: EDITABLE CALENDAR (basic fields)

### What changes
The calendar block becomes truly interactive. Tapping/clicking a date cell opens an editor.

### Per-day fields (all optional)
Stored in `calendar_entries` table:
- `emoji` — single emoji character
- `label` — short text (max 60 chars), shown in the cell
- `numeric_value` — number (e.g., trader's P&L)
- `count_value` — integer (e.g., trade count)
- `journal` — long text (no limit), shown in editor only

### Mobile editor (date tap → bottom sheet)
- Sheet slides up showing the date as header ("May 12, 2026")
- Quick-pick emoji row at top: 💅 🧋 📚 🎂 ✨ 💰 📈 📉 🍳 🎨 🌟 (11 common ones) + "more" button → full emoji picker
- Label input field (placeholder: "what's happening?")
- Numeric and count fields (collapsed by default, "Add P&L" button reveals them — keeps the editor uncluttered for non-trader personas)
- Journal textarea (auto-expanding)
- Save and Delete buttons at bottom
- Tap outside or swipe down to dismiss

### Desktop editor (date click → popover)
- Anchored to clicked cell
- Same fields as mobile but laid out horizontally where possible
- Click outside to dismiss-and-save

### Cell rendering
- If `emoji` set, show it
- If `label` set, show it below emoji (truncate with ellipsis)
- If `numeric_value` set and persona is trader, show colored (green/red)
- Date number always visible in corner

### Acceptance
- Trader fills in emoji + numeric value for May 1 → cell shows it
- It Girl persona fills in emoji + label for May 12 → cell shows "🧋 boba"
- Working mom fills in journal note for May 17 → tapping cell shows journal text in editor
- Data persists across page reload

---

## CHUNK 7: CALENDAR FREEFORM MODE (the big one)

### What this is
The user's vision: each calendar cell is its own mini-canvas where users can place text/emoji/sticker freely positioned within the cell. Like a sticky note on each day, but with multiple elements.

### Storage
New JSONB column on `calendar_entries`: `freeform_blocks`
Format: `[{type: 'text'|'emoji'|'sticker', content: string, x: 0-100, y: 0-100, fontSize?: number, color?: string}, ...]`
Coordinates are percentages relative to cell dimensions (so they work whether the cell is 50px or 200px).

### Desktop interaction
- Cell has two modes: "structured" (the chunk 6 fields) and "freeform" (this canvas)
- Toggle button in cell editor: "📋 Quick edit" / "🎨 Freeform"
- In freeform mode, user can:
  - Click to add text at click position
  - Drag emoji/sticker from a palette into the cell
  - Drag existing elements within the cell
  - Click element → small popover with delete/font size/color
- Cell auto-expands vertically if freeform content overflows (max 3x normal height)

### Mobile interaction
- Tap cell → bottom sheet with same toggle
- In freeform mode on mobile, tap-to-add only (no drag — too imprecise on small screens)
- Long-press an element to get delete/style options
- Use ↑↓←→ nudge buttons in the sheet to fine-position
- Trade-off acknowledged: full freeform on mobile is hard. Best UX is "add elements via tap, position via nudge buttons"

### Performance
- Don't render freeform elements unless cell has any (most cells will be empty)
- Lazy-render: only cells in viewport calculate their freeform layout
- Limit: 20 freeform elements per cell (enforce client-side, hard cap)

### Acceptance
- User can add 3 text elements + 2 emoji to May 5, position them anywhere in the cell
- Saves and persists across reload
- Public viewer sees the same arrangement
- Works on iPhone (with nudge buttons) and desktop (with drag)

---

## CHUNK 8: IMAGE UPLOAD

### Supabase Storage setup (do in Supabase Dashboard, not in app code)
- Create bucket: `user-uploads`
- Public read: ON
- Storage policies (run as SQL in Supabase):

```sql
-- anyone can view images
create policy "Public read on user-uploads"
  on storage.objects for select
  using (bucket_id = 'user-uploads');

-- authenticated users can upload to their own folder
create policy "Users upload to own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'user-uploads'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- users can delete their own files
create policy "Users delete own files"
  on storage.objects for delete
  using (
    bucket_id = 'user-uploads'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
```

### App-side
- New block type: `image`
- Upload UI: in the "+ Add block" sheet, "Image" option opens file picker
- Path convention: `{user_id}/{block_id}/{timestamp}-{filename}`
- Client-side validation BEFORE upload:
  - File size: 5MB free tier, 25MB premium tier (read `profiles.is_premium`)
  - MIME type: jpeg, png, webp, gif only
  - Show inline error if rejected
- After upload, get the public URL via `supabase.storage.from('user-uploads').getPublicUrl(path)`
- Store URL in `block.content.url` and `block.content.alt` (alt text for accessibility, defaults to filename)

### Image block rendering
- Desktop: respects block dimensions (width/height from blocks JSON), `object-fit: cover` if dimensions don't match aspect ratio
- Mobile: full-width card, height auto-scaled by aspect ratio
- Click image to open full-size lightbox (deferred — basic display first)

### Acceptance
- User uploads a 2MB JPEG → appears as image block on page
- User tries to upload 8MB image as free user → error: "Image too large. Free tier: 5MB max."
- User uploads PNG → renders correctly
- Public viewer (anonymous) sees the image on a shared page

---

## CHUNK 9: TENOR GIF INTEGRATION

### Setup
- Get free Tenor API key from `developers.google.com/tenor`
- Add to env vars: `VITE_TENOR_API_KEY=...`
- Add to Vercel environment variables (so production has it too)

### App-side
- New block type: `gif`
- "+ Add block" sheet → "GIF" option opens search interface
- Mobile: bottom sheet covers most of screen
- Desktop: modal centered on screen
- Search bar at top, debounced (300ms)
- API call: `https://tenor.googleapis.com/v2/search?q={query}&key={API_KEY}&limit=20&media_filter=tinygif,gif`
- Results in a 2-col grid (mobile) or 3-col (desktop), tap to insert
- "Trending" results shown by default before user types

### GIF block storage
```js
{
  type: 'gif',
  content: {
    url: 'https://media.tenor.com/.../full.gif',
    preview_url: 'https://media.tenor.com/.../tiny.gif',
    width: 480,
    height: 270,
    tenor_id: '...'
  }
}
```

### Acceptance
- User searches "celebrate" → sees 20 GIFs in seconds
- Tapping a GIF inserts it as a block on their page
- GIF plays on mobile and desktop
- Public viewer sees the GIF

---

## CHUNK 10: PUBLIC PAGE — UPLOADED MEDIA VISIBILITY

This is mostly verified-by-testing, since the bucket policies in Chunk 8 already allow public read. But verify:

### Acceptance
- Log in as User A, upload an image to your page
- Open `/u/{userA-handle}` in incognito (anonymous) → image loads
- Same for GIFs
- No 403/401 errors in console

---

## TECHNICAL NOTES FOR THE IMPLEMENTOR

- **React import pattern still mandatory:** `import { useState, useEffect } from "react"`. NEVER `import React, { useState }`. `function App()`, `export default App` on its own line. Same as Sprint 1.
- **Vercel env vars:** When adding `VITE_TENOR_API_KEY`, add it both to local `.env` AND to Vercel project settings. Otherwise production breaks.
- **Storage bucket creation is manual:** Khalid creates the `user-uploads` bucket in Supabase Dashboard before testing Chunk 8. Document this clearly so he knows to do it.
- **Don't break Sprint 1:** All Sprint 1 functionality must continue working. Test the public `/u/{handle}` URL after every chunk.
- **Commit after each chunk:** "Sprint 2 (X/10): {description}". Push after every chunk so progress isn't lost to stream timeouts.
- **Stream timeout mitigation:** If a chunk is taking too long and you hit the stream idle timeout, commit what you have, push, and tell Khalid which sub-task you stopped at. He'll restart you on that specific sub-task.

---

## ORDER OF EXECUTION

Strict order (each chunk depends on prior):
1. Chunk 1 (SQL migration) — Khalid runs this manually before app changes
2. Chunk 4 (Branding) — quick win, no dependencies
3. Chunk 5 (YouTube fix) — quick win, no dependencies
4. Chunk 2 (Login/logout control) — small, foundational
5. Chunk 3 (Account settings page) — depends on Chunk 2
6. Chunk 6 (Editable calendar basic fields) — depends on Chunk 1
7. Chunk 7 (Freeform calendar) — depends on Chunk 6
8. Chunk 8 (Image upload) — Khalid creates bucket first
9. Chunk 9 (GIF integration) — Khalid adds API key first
10. Chunk 10 (Public page media verification) — final test pass

Chunks 4, 5, 2, 3 can ship as one PR since they're small. Chunks 6 and 7 ship together as the "calendar update." Chunk 8 ships standalone. Chunk 9 ships standalone. Total: ~4 PRs across the sprint.
