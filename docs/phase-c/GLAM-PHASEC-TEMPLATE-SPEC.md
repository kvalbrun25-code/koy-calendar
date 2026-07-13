# Glam Girl — Phase C Template Spec
**Lane:** CD (Claudesign) — visual design, taste-gated
**Status:** PROPOSAL — pending founder Taste-gate sign
**Source of truth:** `glam template.png` (founder's collage, sample text shown — read for content-zone intent) → superseded by the cleaned/text-removed collage as canonical Glam Girl direction.

---

## 0. What this collage already tells us

The founder's collage is not a moodboard, it's a wireframe in disguise. Every "prop" sits at a specific spot doing a specific content job: a photo booth (polaroid selfie), a data widget (phone to-do), a status card (mood meter), a message board (note papers, neon sign), and a title card (Glam Girl wordmark). That's the template. This spec turns each prop into a named, editable slot.

---

## 1. Editable Regions

| # | Zone (as seen in collage) | Content type | How it's edited |
|---|---|---|---|
| 1 | **Mirror-selfie polaroid** (large, top-left) | User's primary photo (avatar/hero image) | Standard image-upload slot, auto-cropped to polaroid aspect (4:5) with white border baked into the frame chrome, not the photo |
| 2 | **Polaroid caption** ("that girl ♡") | Short handwritten-style caption, 1 line | Text field, script font locked in (Design Constitution: font/voice stays on-brand; words are the user's) |
| 3 | **"GLOW UP" tag sticker** | Short badge/label (2-3 words) | Text field styled as a torn-paper sticker; this is the page's "tagline chip" — could map to a user's title/role |
| 4 | **Neon sign** ("you're like, really pretty") | Short phrase, 1 line, ~30 char cap | Text field rendered in the neon-tube SVG/CSS component (see §3 — this is also the cool element) |
| 5 | **Reminder note card** ("CONFIDENT / BEAUTIFUL / SUCCESSFUL / WORTHY") | Short list, 3-5 words/lines | Repeatable list field (add/remove line), rendered as pinned notepaper |
| 6 | **Second polaroid** (product/detail photo) | Secondary photo slot | Image upload, same polaroid-frame treatment as #1 but smaller |
| 7 | **Phone screen widget** ("tuesday / TODAY'S PLAN: coffee, content, glow up, go get it / REMINDERS: drink water, be productive") | Day label + checklist (2 groups) | Structured widget: editable day/header text + repeatable checklist items (checkable — see §3 alt) |
| 8 | **Mood/status card** ("MOOD: CEO,000,000 — loading bar") | Stat label + value + progress % | Small widget: label text, value text, and a 0-100 slider that sets the bar fill |
| 9 | **Discipline note paper** ("discipline / consistency / ambition / freedom") | Short list, freeform | Repeatable list field, torn-paper style, same component as #5 with a different paper skin |
| 10 | **Title wordmark** ("Glam Girl" in neon script) | Page title / user's name or brand | Text field in the same neon-script font used for the whole template — this is the page's H1, always present, always user-owned |
| 11 | **Subtitle** ("TEMPLATE" small caps under title) | Short tagline (1-3 words) | Text field, small caps, sits under title |
| 12 | **Product-shelf items** (perfume bottle label, "CHANEL / PRADA" book spines) | Optional flavor text (brand/interest tags) | Low-priority editable: label text on 1-2 props only, so the shelf can nod to the user's own faves without becoming a form fiesta |

**Editing model:** every slot above is a discrete component in Koy's block system (photo-slot, text-slot, list-slot, widget-slot), positioned by the template's fixed grid. Users never drag/resize — position and scale are locked to preserve the collage composition. This matches the "canvas, not a form" feel: you're filling in a scene, not building a layout.

---

## 2. Fixed Chrome vs. Editable

**Fixed (template identity — never user-editable):**
- Pink gradient wash + lighting (the "glow") across the whole canvas
- Sparkle / star / heart / lipstick-kiss decorative overlays
- Polaroid frame borders, tape scraps, torn-paper edges, pin/tack graphics
- Neon-tube glow style (color, flicker, font) — the *style* is fixed, the *words* are not
- Vanity backdrop scene (mirror, candle, flowers, desk) — atmosphere, not content
- Sunglasses, silver star sticker, and other pure props with no text
- Grid/composition — position, rotation, and scale of every element
- Overall canvas aspect ratio and corner-radius framing

**Editable (user's content):**
- Every item in §1 — 12 slots covering 2 photos, 1 title, 1 subtitle, 2 free-text fields, 1 tagged badge, 3 short lists, 1 structured checklist widget, 1 stat/mood widget, and 2 optional flavor labels.

**Design Constitution check:**
- *Floor is dignified:* every slot has a sensible default (placeholder photo silhouette, sample affirmations, "Monday / Add your plan" phone default) so an unfilled template never looks broken or empty — it looks like a fresh page waiting for you, not an error state.
- *Deviation is never an error:* a user can leave the neon sign blank, delete list items down to one, or upload a photo that clashes with pink — nothing validates against "matching the vibe." The template offers the frame; taste is optional, not enforced.
- *Unmistakably theirs:* the two photo slots + title + neon phrase + at least one list are the high-signal slots — once a real face, a real name, and a real phrase are in there, the page reads as a person, not a template. That combination is the minimum "make it yours" bar.

---

## 3. The ONE Interactive Cool Element

Phase C canon: one interactive element per template. Three candidates considered:

### Recommended: **The Neon Sign** — types the user's phrase, flickers on
- On page load (or on hover, TBD in build), the neon sign animates through a tube-flicker-on sequence (2-3 stutters then holds steady) before settling on the user's custom phrase, rendered in the same glowing script as the collage.
- Why this one: it's the single most iconic, most "Glam Girl"-coded prop in the collage — nothing else in the other vibe templates will look like it. It's low build complexity (SVG/CSS text-shadow + a CSS animation, no state or backend needed), so it's cheap to ship well inside Phase C's timeline. It's also the one element a visitor *notices first* — it does the "peek" job for the B5 tile too (see §4).
- Editing: same text field as §1.4, character-capped so the glow doesn't overflow the sign backdrop.

### Alternate 1: The Phone To-Do Widget
- Functional mini checklist (§1.7) — visitors could see live checked/unchecked state, closer to "Bloomberg" (real data) than pure decoration.
- Trade-off: more build effort (state, persistence, checkbox interaction model), and Koy may want checklist/schedule widgets to be a *shared* component across templates rather than Glam Girl's signature — worth checking against other Phase C templates before committing this as THE cool element here.

### Alternate 2: The Mood Meter
- Draggable/settable loading-bar stat (§1.8) — playful, gamified, on-brand for Y2K maximalism ("vibe: 87% loaded").
- Trade-off: cute but lower-impact than the neon sign as a first-glance "wow," and slider-as-cool-element is a pattern that could get reused elsewhere, diluting Glam Girl's specific claim to it.

**CD recommendation: ship the neon sign as the cool element.** It's the most visually distinct, cheapest to build well, and doubles as the B5 tile's hero preview. If the founder wants a *functional* (not just decorative) cool element instead, Alternate 1 (phone checklist) is the next pick.

---

## 4. B5 Landing Tile (`.kl-frag--glam`)

Frame-not-fill rule holds: the tile is a peek at the template, not a shrunk full page.

- **Crop:** top-left corner of the collage — the mirror-selfie polaroid corner + the neon sign corner, cropped so both are partially visible and the neon glow bleeds toward the tile edge. This is the two highest-signal elements (a real photo + the neon phrase) in one glance, which is exactly what should sell the vibe in a tile-sized peek.
- **Content in the tile:** use the cleaned/blank template art with a generic default photo (not the founder's own photo) and a placeholder neon phrase (e.g. "hey gorgeous") — the tile should read as "here's the vibe," not "here's someone's finished page."
- **Motion:** the neon-flicker-on animation (§3) can loop subtly in the tile (low frequency, e.g. once every 6-8s) since it's cheap CSS and it's the thing that signals "this template has a cool interactive element" before the user even clicks in.
- **Frame:** same corner-radius, border, and sizing as every other `.kl-frag--*` tile on B5 — no bespoke frame treatment for Glam Girl, so the landing grid stays consistent across vibes and this template doesn't visually "shout" over its neighbors.
- **Label:** tile caption stays "Glam Girl" (matches title slot default), no subtitle needed at tile scale.

---

## 5. Open questions for founder sign-off

1. Confirm neon sign vs. phone checklist as the cool element (§3).
2. Confirm whether product-shelf flavor text (§1.12) is worth the extra editable-field complexity, or should be fully fixed chrome to keep the editing surface simpler.
3. Confirm tile crop framing (§4) — corner-crop as proposed, or a different pair of elements (e.g. neon sign + mood card) reads better at thumbnail size.

---

*Companion file: `preview.html` in this folder — a labeled-zone mockup of the layout above, structure only, not final art.*
