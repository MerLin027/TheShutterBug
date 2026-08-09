# plan.md — The Shutter Bug, Redesign + Completion Pass

Read `context.md` in this same directory first — it has the history and
reasoning behind every decision here. This file is the actual task list.

**Before starting:** save the Lovable reference screenshots into
`/design-reference/lovable-redesign/`, named descriptively (e.g.
`home-hero.png`, `gallery-page.png`, `admin-dashboard-grid.png`,
`admin-messages.png`, `admin-account.png`, `admin-upload-modal.png`,
`contact-page.png`, `about-page.png`, `admin-dashboard-hover-state.png`).
Tasks below reference them by content, not exact filename — use whichever
screenshot actually shows the relevant screen.

**Rule for every stage:** commit and push to git after the stage is
complete and verified working, before starting the next stage. Don't let
multiple stages pile up uncommitted.

---

## STAGE 1 — Visual & Structural Restructure

**Do NOT touch:** color scheme, background image/theme, overall dark
palette. This is layout/structure/animation/interaction only.

**Do NOT touch:** backend code, API calls, data fetching logic — if a
component needs restructuring, preserve its existing data logic exactly,
move/restyle the JSX around it.

### 1.1 — Shared Navbar component
Currently the navbar isn't consistent across all public pages (built
during literal-port phases, never fully unified). Build one shared
component, used identically on Home, Gallery, About, Contact:
- Order: Title, Gallery (icon button, not text label), About, Contact.
- No separate "Home" nav item and no "Admin" link (admin access moves to
  the footer — see 1.4).
- Title font: change to something curved/flowing, distinct from body
  text. Title remains a link routing to `/`.
- Navbar shape: slightly longer horizontally, slightly thinner
  vertically than current.
- Preserve existing liquid-glass styling on the navbar itself — this is
  a structural change, not a glass-effect change.
- Check with the user before adding a liquid-glass effect to the Home
  title text specifically (see context.md's "open/unresolved" note) —
  don't add it silently, don't skip it silently either.

### 1.2 — Home page
- Hero: add parallax scroll effect.
- Add "Enter the Gallery" CTA button below the hero subtitle, routes to
  `/work`.
- Below the hero (on scroll): "Selected Frames" section — section
  title/subtitle left-aligned, "View All" text-link right-aligned
  (routes to `/work`). Grid of photos below, sourced from
  `isFeatured: true` photos. Each photo: bold white title text +
  genre/category label underneath, matching the reference screenshot's
  layout (title left, category right, same row).

### 1.3 — Gallery page (`/work`)
- Confirm existing filter pills (All/Nature/Objects/Monochrome/Urban)
  and masonry grid remain functionally intact — this stage only
  restructures layout/animation, not the filter logic itself.
- Confirm photo click → lightbox navigation still works after any
  layout changes (this was fixed in Phase 6.1 — don't regress it).

### 1.4 — Footer (all public pages)
Rebuild to match the Lovable reference structure: site name + year on
the left, right-aligned link section. Add "Studio Access" as a link
routing to the (renamed) admin login page.

### 1.5 — Studio (admin) rebrand
- Rename "Admin" branding to "Studio" throughout the admin area (page
  titles, browser tab title, any visible headers) — this is a label
  change, not a route-structure change unless it's trivial to also
  rename the route itself; keeping `/admin` as the URL path is fine if
  renaming routes risks breaking existing links.
- Add a "Back to Site" button on the Studio login/dashboard, routing to
  the public homepage.

### 1.6 — Studio/admin hamburger menu
Admin-only (not shown on the public site). Contains, in order: site
title as a button (same flowing font as 1.1, routes to public home),
Gallery, Messages, About, Sign Out. Username shown at the bottom of the
menu (use the logged-in admin's email, since there's no separate display
name field). Animation: items slide in from the direction matching their
position relative to the current page in the menu order (below current →
slides from below, above current → slides from above). Reuse the
navbar's glass-click animation timing if one exists from earlier phases;
build a matching one if not — don't build two different animation
systems.

### 1.7 — Studio/admin upload modal
Restyle the existing upload modal's drop-zone to visually resemble a
Google-Drive-style drag/click uploader — **visual only**, the actual
upload logic stays on the existing Cloudinary pipeline, no backend
change here. Fields stay as they are: Title, Genre (dropdown — fixed set
nature/objects/monochrome/urban), Caption, Location, Tags
(comma-separated), "Add to Archive" submit button, close (X) button.

### 1.8 — Studio/admin gallery grid
- Confirm drag-to-reposition still works after any layout restructuring.
- Hover state: image blurs, shows drag handle (corner), Delete button,
  photo name, genre, size — confirm Edit button is NOT present (removed
  per earlier Phase 6.4 decision, confirm it stayed removed).
- Add a **Featured toggle** to the hover overlay — controls whether the
  photo appears in Home's Selected Frames section. Wire to the existing
  `isFeatured` field via `PUT /api/photos/:id` (field already exists in
  the schema, this is new UI + new call to an existing update pattern,
  not a new backend field).

### 1.9 — Studio/admin Account page
Title "Account". Three styled input areas: quote (short text), bio
content (paragraph/textarea), about-page image URL/path. Save Changes
button. This should already be close to what Phase 6.14 (About-content
editor) was meant to build — confirm/complete rather than starting from
scratch if partial work exists.

### 1.10 — General animation pass
Apply smooth, consistent text/image scroll-in animations (Framer Motion)
across pages that don't already have them, matching the "smooth flow"
language from the reference. Three.js is available if a specific 3D
decorative element fits naturally (e.g., a subtle background element on
the hero) — don't force it in where 2D animation already does the job.

**Stage 1 checkpoint:** every public page and the Studio area visually
match the Lovable reference structure. Deploy, compare against the
actual screenshots side by side, fix drift. Commit and push.

---

## STAGE 2 — Functional Completion

Audit first, fix second — don't rebuild anything that's already working.

### 2.1 — Audit pass (report only, don't fix yet)
```
Read context.md and plan.md first. Audit the current repo — for every
page and every button/link, report: does it exist, is it routed
correctly, does it call a real backend endpoint, and does that endpoint
exist and work. Specifically check:
- Contact form: does it POST to /api/contact (built in Phase 6.3 Part A
  but never wired per context.md)?
- Is there an admin Messages page consuming GET /api/contact? (Also a
  Phase 6.3 Part B gap.)
- Does the Featured toggle (Stage 1.8) actually persist and does Home's
  Selected Frames section actually query isFeatured photos?
- Any other buttons/links added during Stage 1 that don't yet have
  working logic behind them (Stage 1 was visual-only, so anything new
  from that stage needs its functional half built now).
Report as a checklist, don't fix anything yet.
```

### 2.2 — Build out what's missing
Based on 2.1's findings, in particular:
- Wire the Contact page form to `POST /api/contact` — success/error
  states, disable-while-submitting, clear on success.
- Build the Studio Messages page — fetch and list `GET /api/contact`
  results, most recent first (name, email, message, timestamp).
- Confirm/complete the Featured toggle end-to-end (UI → API → Home
  section actually reflecting it).
- Fix anything else 2.1 found broken or missing.

**Stage 2 checkpoint:** every button and page from Stage 1 has working
logic behind it, verified manually (upload a photo, toggle featured,
confirm it appears on Home; submit the contact form, confirm it appears
in Studio Messages). Commit and push.

---

## STAGE 3 — Frontend Logic Reaudit
```
Read context.md and plan.md first. Audit all frontend code (src/) for:
syntax/type errors, logical errors (wrong conditionals, incorrect prop
passing, broken conditional rendering), dead/unused code (unused
imports, variables, leftover commented-out blocks from earlier phases),
redundant code (duplicated logic that should be shared), React-specific
issues (missing keys, useEffect dependency mistakes, hydration
mismatches). Report findings, then fix.
```

## STAGE 4 — Backend Logic Reaudit
```
Read context.md and plan.md first. Audit backend/ for: syntax/error-
handling gaps (unhandled promise rejections, missing try/catch), logical
errors (route order — confirm /api/photos/reorder is still registered
before /api/photos/:id — incorrect query filters, wrong status codes),
security basics (JWT applied to all protected routes, no secrets logged,
passwords never returned), dead/unused code, redundant validation logic
that should be shared middleware. Report findings, then fix.
```

## STAGE 5 — Linkage Reaudit
```
Read context.md and plan.md first. Audit the frontend-backend
integration specifically: error handling on failed/timeout fetches,
loading states, correct Cloudinary URL handling in next/image, no
duplicate redundant fetches, confirm NEXT_PUBLIC_API_URL (or equivalent)
is used consistently rather than hardcoded URLs anywhere, confirm
revalidatePath calls cover every mutation (upload, edit, delete,
reorder, featured toggle, new contact message) so public pages never
show stale data. Report findings, then fix.
```

## STAGE 6 — Security Audit (stretch goal — optional if time runs short)
```
Read context.md and plan.md first. Audit: JWT expiry/storage approach,
CORS scope (should be locked to the actual Vercel domain, not a
wildcard, by this point), input validation on all POST/PUT routes
(contact form, upload, edit), whether any secrets/keys are exposed in
frontend code or git history, rate limiting on public endpoints
(contact form, login) if feasible in remaining time. Report findings,
fix what's reasonable given time remaining — this stage is explicitly
lower priority than 1-5.
```

---

## Triage if the week runs out
Stage 1-2 are the non-negotiable deliverable — a visually complete,
functionally working site. Stage 3-5 are what make it genuinely correct
under the hood rather than just looking finished. Stage 6 is bonus only.