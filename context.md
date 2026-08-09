# context.md — The Shutter Bug

Read this before touching any code. This is the full history and current
state of the project. `plan.md` (same directory) is the actual task list
to execute — this file is background so decisions in `plan.md` make sense
and don't get silently reversed.

**For where the work actually stands right now, jump to "Phase/Stage
status" near the bottom** — it sits next to the six-stage plan it tracks.

## What this is
A personal photography portfolio website for a nature/object photographer.
Subject matter: seascapes, empty urban scenes, objects, monochrome
street/transit shots, occasional animals, rare human presence (never the
focus). Example: a sunset over open water with a single boat silhouette
centered in frame. Public site (Home, Gallery, About, Contact) plus an
admin area (branded "Studio") for managing photos, viewing contact
messages, and editing About-page content.

## Design philosophy (non-negotiable, carried from the original blueprint)
- Photography is the hero. UI is an invisible, elegant frame — never
  compete with the images for attention.
- Minimalism, generous negative space, restrained typography, 1-2 accent
  colors max.
- Dark mode only. Background near-black (~#0a0a0a-#121212, not pure
  black). Warm off-white text.
- Liquid Glass effect (Apple-style: backdrop-filter blur + subtle white
  top-border highlight + soft inner shadow, `-webkit-backdrop-filter`
  fallback for Safari) goes ONLY on UI chrome — navbar, filter pills,
  lightbox controls, admin toolbar/hamburger. NEVER directly over a
  photo. Keep glass instances to a small, fixed set of persistent
  elements — not per-card, not per-scroll-trigger (GPU cost).
- Masonry/staggered grid for photo layouts, not uniform squares —
  respects the variety of aspect ratios in the subject matter.

## Tech stack
- Frontend: Next.js (App Router), TypeScript, Tailwind CSS, Framer
  Motion for animation. Deployed on Vercel.
- Backend: Node.js + Express, MongoDB Atlas, Cloudinary (image storage,
  auto WebP/AVIF), JWT auth (single admin user, no public signup).
  Deployed on Render (free tier — kept alive via a cron-job.org ping to
  `/api/health` every 10 minutes).
- Admin auth: JWT stored client-side, `Authorization: Bearer` header on
  protected calls, redirect to `/admin` (soon "Studio") on 401.

## Build history, condensed

**Design origin:** Blueprint written from researching top-tier photography
portfolio sites (minimalism, staggered grids, immersive hero, scroll
animations). Screens then designed in Google Stitch (dark mode, liquid
glass) and later re-referenced through a Lovable prototype (see "Lovable
redesign reference" below) — Lovable's version is the most current visual
source of truth.

**Phase 1-2.5 (Antigravity, Gemini 3.1 Pro + Claude Opus verification):**
Literal port of Stitch-designed screens into Next.js — Home, About,
Contact, Work/Gallery, Lightbox. Hardcoded photo data at this stage.
Approach was deliberately mechanical translation (not a rebuilt design
system) to save tokens — Gemini did the port, Opus did a short
verification/bug-fix pass after each.

**Phase 3 (Gemini 3.1 Pro):** Backend built — Express + MongoDB +
Cloudinary + JWT, per the original functional spec. Deployed to Render.
Post-launch audit found and fixed: missing `backend/scripts/seedAdmin.js`
(one-time admin user creation), incomplete `.env.example`. Added
`GET /api/health` (no-auth, no-DB-call) for the Render keep-alive cron.

**Git incident:** Repo history briefly got stuck — a stray `temp-app/`
scratch folder had `node_modules` committed, exceeding GitHub's 100MB
file limit and blocking all pushes. Fixed via `git checkout --orphan` +
force-push to a single clean commit. **Full phase-by-phase commit
history before that point no longer exists.** `.gitignore`'s
`node_modules` pattern is now unanchored (catches any depth, any
subfolder) to prevent recurrence.

**Phase 4 (Claude Opus):** Wired the frontend to the live (initially
empty, intentionally not pre-seeded) backend. Replaced hardcoded
`data.ts` with real fetch calls. Built an empty-state UI for the gallery
since real photos would only arrive via the admin panel, not manual
seeding.

**Phase 5 (Claude Opus, on the original Antigravity plan):** Admin CRUD +
drag-to-reorder built at `/admin`. JWT login, dashboard with photo
upload/delete, dnd-kit drag-reorder writing to a `position` field.
Confirmed: Cloudinary cleanup happens on delete (not just the Mongo doc),
`revalidatePath` used so public gallery reflects admin changes without
redeploy, category values normalized lowercase matching the fixed enum
(nature/objects/monochrome/urban).

**Phase 6 (partial — 6.1, 6.2, 6.3 Part A only, rest superseded below):**
- 6.1 — Gallery/lightbox linking fixed, stray nav labels cleaned up.
- 6.2 — Admin link added to the public navbar (**note: this decision is
  superseded — see Lovable redesign reference below, admin access moves
  to the footer instead**).
- 6.3 Part A — Backend Contact model + `POST /api/contact` (public) +
  `GET /api/contact` (admin, JWT) built and deployed. ~~**Part B (wiring
  the public form + building an admin messages page) was NOT completed**
  — this is a real gap, not just an assumption to verify.~~
  **Corrected 2026-08-09 by the Stage 2 audit: Part B *is* complete.**
  `src/app/contact/page.tsx` POSTs to `/api/contact` with validation,
  per-field errors, disable-while-submitting and reset-on-success, and
  `src/app/admin/dashboard/messages/MessagesClient.tsx` GETs it with a
  Bearer token and handles 401. Both predate Stage 1 and Stage 1 did not
  disturb them. Do not rebuild them.
- 6.4 through 6.14 (admin hover-card cleanup, unified navbar component,
  admin sidebar cleanup, hamburger animation, hero polish, scroll
  animations, page transitions, About-content editor) were **planned but
  never executed** — work paused here in favor of exploring a Lovable
  prototype for design reference. These items are folded into the new
  Stage 1/2 plan below, refined with concrete specs from the Lovable
  screenshots rather than executed as originally written.

**Lovable exploration:** A full working prototype was built in Lovable
from a context-informed prompt (same design lineage as the Stitch
original, not a contradicting aesthetic). Result was strong enough to
use as the visual/structural reference for a redesign pass on the real
app. **Lovable's codebase itself is NOT being ported or merged** — only
used as a screenshot reference. It likely runs on a different stack
(React+Vite+Supabase-style) and has its own mock/prototype data, which is
why e.g. its Messages page shows a test message that doesn't exist in the
real MongoDB.

## Lovable redesign reference — what's changing and what isn't

Reference screenshots are saved at `/design-reference/lovable-redesign/`
(save them there before starting Stage 1 — filenames referenced in
`plan.md`). This section resolves what's kept, what's new, and what
supersedes earlier Phase 6 decisions.

**Explicitly NOT changing:** color scheme, background image, overall dark
theme. This is a structural/layout/interaction redesign, not a
re-skinning.

**Explicitly superseded from earlier phases:**
- Admin link in the main navbar (Phase 6.2) is removed. Admin/Studio
  access now lives ONLY as a "Studio Access" link in the footer.
- The admin area itself is rebranded "Studio" (matches Lovable's browser
  tab title "Studio — The Shutter Bug"). Gets a "Back to Site" button
  routing to the public homepage.
- Admin sidebar nav (Phase 6.7's cleanup target) is confirmed by the
  Lovable reference as: Gallery, Messages, Account, Sign Out — no
  Series/Analytics/Support (matches what was already planned, now
  visually confirmed).
- The About-content admin editor (Phase 6.14) is confirmed as the
  "Account" page: title "Account", three fields (quote, bio content,
  about-page image URL/path), Save Changes button.
- Google-Drive-styled upload dropzone: **visual styling only** — the
  drop-zone UI should look like a Drive-style drag/click uploader, but
  the actual upload still goes through the existing Cloudinary pipeline.
  No new storage integration.
- Hamburger menu is **admin/Studio-only** (not a public mobile nav). It
  combines: site title (as a button, routes to public home), Gallery,
  Messages, About, Sign Out, with the logged-in username shown at the
  bottom. Directional slide animation (items below current page slide in
  from below, items above from above) reusing whatever glass-click
  animation timing already exists on the public navbar, if built.

**Open/unresolved from earlier phases — confirm before building, don't
silently assume either way:**
- ~~Liquid glass effect on the Home page title text (Phase 6.11).~~
  **RESOLVED during Stage 1 — glass, and it is built.** The Lovable
  reference showed a plain title, so this was raised with the user rather
  than assumed; the user asked for it explicitly. Implementation is
  documented at length in `HeroParallax.tsx` and `globals.css`; the load-
  bearing rule is that the photograph is a *texture layered on* an opaque
  fill, never the fill itself. A first attempt filled the glyphs with the
  photo they sit on, which makes the letters match their own backdrop by
  construction — the wordmark rendered as a hollow outline. Do not
  reintroduce that. Note this is the one sanctioned exception to "glass
  never goes directly over a photo": it is glass *on letterforms*, not a
  glass panel over an image.
- Page-transition animation (Phase 6.13) — not explicitly re-specified
  in the Lovable brief beyond "smooth flow of texts and images" as the
  general animation language. Treat as a soft carry-forward, not a hard
  requirement.

**New in this pass (not from earlier phases at all):**
- Parallax scrolling on the Home hero.
- "Enter the Gallery" CTA button on the hero.
- "Selected Frames" section on Home (title/subtitle left, "View All"
  link right, grid of featured photos with bold title + genre label per
  image) — pulls from photos where `isFeatured: true` (field already
  exists in the Photo schema, just not yet exposed anywhere in the UI).
- Navbar restructure: order becomes Title, Gallery (icon button, not
  text), About, Contact. Title font changes to something curved/flowing.
  Navbar becomes slightly longer horizontally, slightly thinner
  vertically.
- Footer rebuilt to match Lovable's structure (site name + year left,
  right-aligned links) plus the new Studio Access link.
- Featured toggle added to admin photo cards (on hover, alongside
  existing Delete button) — controls Home page Selected Frames inclusion.
- Public gallery upload/photo-card interactions confirmed matching
  Phase 5's build closely (drag-reorder, hover-blur with Delete + name +
  genre + size) — mostly a confirmation pass, not new build, except for
  the added Featured toggle.

## Model/agent assignment for this pass
Previous phases split work between Gemini 3.1 Pro (mechanical/low-risk)
and Claude Opus (judgment-heavy) via Antigravity. **This pass uses Claude
Code — Sonnet 5 (medium/high effort) as the default for all stages,
Opus reserved for anything Sonnet genuinely struggles with**, not a
pre-assigned split. Sonnet is expected to be sufficient for both the
visual restructure and the audit stages given their similarity to
already-completed phase work.

## Operational notes carried forward
- Commit and push after every stage/checkpoint, before starting the next
  — this is the actual lesson from the earlier git incident, not just
  the recovery steps taken at the time.
- CORS on the backend should be locked to the actual Vercel domain, not
  a wildcard, once that domain is confirmed stable.
- `backend/.env` is gitignored and was never committed — Render's
  environment variables are set manually via its dashboard, not pulled
  from a file.

## Phase/Stage status

### Stage 1 — Visual & Structural Restructure: **COMPLETE** (2026-08-08)
Audited against the Lovable reference screenshots; the review captures used
for that comparison are in `/design-reference/stage1-review/`. All
outstanding design-quality issues from that audit are resolved.

Final state includes:

- **Shared nav + footer.** One `SiteNav` and one `SiteFooter` used
  identically on Home, Gallery, About, Contact. Nav order is Title,
  Gallery (icon button), About, Contact — no Home item, no Admin link.
  Footer carries site name + year left, links right, including the
  "Studio Access" link that replaced the Phase 6.2 navbar admin link.
- **Home hero rebuilt.** Parallax on the photograph, "Enter the Gallery"
  CTA, and the glass wordmark (see the resolved open question above).
  "Selected Frames" sits below the hero and is wired to `isFeatured`.
  It rendered nothing at the time by design — the live API returned `[]`
  because the database was empty. (Stage 2 found the cause of that empty
  database: broken Cloudinary credentials, so no upload had ever
  succeeded. Fixed — see the Stage 2 entry.)
- **Studio rebrand.** The admin area is labelled "Studio" throughout
  (page titles, tab title, headers) with `/admin` kept as the route.
  "Back to Site" button, Studio-only hamburger with the directional slide
  animation, Drive-style upload dropzone (visual only — still the existing
  Cloudinary pipeline), Featured toggle on the photo-card hover overlay,
  and the Account page (quote / bio / about-image + Save Changes).
- **Font pairing.** Playwrite VN — a variable calligraphy face with
  weights 100–400 only, no bold and no italic, so 400 is the heaviest
  available — for the wordmark and display headings; Jost for body and
  labels. Root font-size scaled to 90%. The hero wordmark's size and
  placement are derived by measurement against the boat in the hero
  photograph rather than from the type scale, which is why they are
  expressed in viewport units and must not be converted to `rem`.
- **Polish-round additions.** `StudioTopBar`, `StudioSkeletons`,
  `LightboxKeys`, and a real `not-found` page; the five Next.js starter
  SVGs in `public/` deleted.

**Skills pass.** The three local packs in `.claude/skills/` —
`genjutsu-main`, `taste-skill-main`, `ui-ux-main` — are files on disk with
no registered slash commands in this environment, so they were read and
applied by hand, not invoked. `genjutsu:paint` in particular was
deliberately *not* followed: its Existing-Project Protocol replaces the
current design tokens outright, which contradicts Stage 1's "do not touch
colour scheme / background / dark palette" constraint. They did drive
further changes, landed across `b571d981`, `f418fc04`, `ecfacf74` and
`1f23f0dd`: a large `globals.css` restructure, the radius scale rebuilt to
ascend properly, accent-colour and page-transition work, hydration
mismatches fixed in `Reveal`/`PageTransition`, `data-scroll-behavior`, the
skip-link target on `/admin`, and Material Symbols set to `'wght' 250`
site-wide.

Two traps that came out of that pass and will silently reappear:
1. **Never hand-author `-webkit-backdrop-filter` in `globals.css`.**
   Lightning CSS auto-prefixes it, but when both forms are already present
   it collapses the pair and emits only the `-webkit-` one — dropping the
   blur in Firefox. After any `globals.css` change, confirm
   `count(-webkit-backdrop-filter)` is **0** — that is the load-bearing
   invariant, not the delta. (This note previously said the delta should
   be "~19", then "12"; the real figure is 13 as of `1de43304`. It moves
   whenever glass recipes are merged or split, so don't treat it as fixed —
   only the zero matters.)
2. **`font-variation-settings` is one declaration, not several.** An
   inline `'FILL' 1` replaces the whole line and reverts the icon to
   weight 400, so every filled icon restates `'wght' 250` alongside it.

**Git state:** the backlog described here is cleared. `b3151139` commits
the hero glass-text rework plus `context.md` and `design-reference/`
(which includes `plan.md` — it lives at
`design-reference/lovable-redesign/plan.md`, not the repo root).
`.claude/` is now gitignored: ~12 MB of vendored third-party skill packs,
not project code.

### Stage 2 — Functional Completion: **COMPLETE** (2026-08-09)
Opened with the §2.1 audit. Headline: far less was missing than this
document predicted — see the 6.3 correction above, and note the Featured
toggle was traced end to end (star → optimistic update with rollback →
`PUT /api/photos/:id` → `revalidatePublicPages()` → Home's
`fetchFeaturedPhotos`) and needed no changes. Selected Frames rendering
empty is the deliberate `photos.length === 0` guard against an empty DB,
not a bug.

What landed:
- **Site content is editable.** New `SiteContent` singleton model +
  `GET /api/site-content` (public) and `PUT /api/site-content` (admin).
  `/about` is now an async server component reading `fetchSiteContent()`
  with `revalidate = 60`, and the Account page's Save Changes button —
  the only dead control in all of `src/` — is wired to the PUT with
  loading/saving/saved/error states and 401 handling.
  `revalidatePublicPages()` gained `/about`.
- **Defaults, not blanks.** `DEFAULTS` in `backend/models/SiteContent.js`
  holds the copy that used to be hardcoded in About. `GET` returns it
  when no document exists, and `fetchSiteContent` falls back to a mirror
  of it on any network/HTTP failure, so a fresh DB or a sleeping Render
  instance renders the original page rather than an empty one. Keep the
  two copies in sync.
- **The About image is a full URL, not a path.** `public/` is empty; the
  old `/photos/portrait.jpg` seed pointed at a file that never existed.
  The Account field is a free-text URL box (deliberate — no upload
  plumbing in Stage 2).
- **New uploads append.** `POST /api/photos` now assigns max(position)+1
  when no position is sent, instead of 0. Previously every upload got 0
  and `sort({ position: 1 })` tie-broke arbitrarily, so gallery order was
  undefined until the first manual drag. max+1 rather than a count, so
  deletes leaving gaps can't cause a collision.
- **`POST /api/auth/register` removed.** It was public and ungated —
  anyone could mint an admin account and a 30-day JWT against the live
  API. Confirmed by grep that nothing in `src/` ever called it. Admin
  creation is `node scripts/seedAdmin.js` (idempotent, reads
  `ADMIN_EMAIL`/`ADMIN_PASSWORD`).
- **CORS allows localhost outside production.** It was pinned to the
  Vercel origin only, which meant every client-side Studio call (upload,
  edit, featured toggle, account save) was blocked on `npm run dev` and
  could only be tested against a deployed build.
- **Cloudinary credentials fixed — this was the real reason the photo
  database had always been empty.** `CLOUDINARY_API_KEY` and
  `CLOUDINARY_API_SECRET` were malformed (they looked swapped: the key
  was a 27-char alphanumeric string where Cloudinary expects ~15 digits),
  so every `POST /api/photos` died with `Invalid api_key`. Not a code
  defect — an environment problem, corrected by the user in
  `backend/.env` and in Render's dashboard. **Render's env vars are set
  through its dashboard, not from any file in the repo**, so they must be
  changed in both places; a git push cannot carry them. The upload path
  is now verified end to end: real uploads return ascending positions
  with valid Cloudinary URLs, the Featured toggle persists on and off,
  and DELETE removes both the Mongo document and the Cloudinary asset.
  Selected Frames on Home now has real data behind it.

### Studio + gallery UI/UX pass: **COMPLETE** (2026-08-09)
A separate 8-task polish pass run after Stage 2's functional work, driven
by review captures in `design-reference/studio-ux-review/` (`a4dffc74`).
Landed as `6a04a70f` (WIP) then `1de43304` (verified). Covered the Studio
hamburger menu, the Studio gallery header, button sizing/consistency
site-wide, the lightbox chrome, the Edit modal, and the public gallery
header. Verified with a measurement harness that walks every button on
the public pages, the Studio, both modals, the mobile menu and the
lightbox.

Two more traps from that pass, in the same class as the two above:
3. **`.btn-icon-glass` lives in `@layer components` and must stay there.**
   Every other custom class in `globals.css` is unlayered, which outranks
   everything Tailwind emits — unlayered, its `display: inline-flex` beat
   `md:hidden` and the Studio hamburger rendered on desktop. The same
   latent conflict exists for every other unlayered class in that file
   (`.btn-accent` vs `bg-*`, etc.); it simply hasn't bitten yet.
4. **Icon buttons must set explicit width and height, not padding.**
   `p-2 rounded-full` on a block element is not a circle — the glyph is
   1em wide but the line box adds the strut's descent below it, so boxes
   came out 38.4 x 45. Every icon-only control on the site had this. They
   are 36 x 36 (Studio) and 43.2 x 43.2 (lightbox) now.

Found in passing and deliberately **not** fixed, as it belongs to Stage 3:
`/admin/dashboard` throws a hydration mismatch whenever a token exists —
`DashboardClient`'s `useState(() => localStorage.getItem("admin_token"))`
makes the server render `StudioBoot` and the client render the dashboard.
Confirmed pre-existing, not introduced by this pass. The same pattern is
in `MessagesClient`, `AccountClient` and the admin login page.

### Stage 3 — Frontend Logic Reaudit: **COMPLETE** (2026-08-09)
`tsc --noEmit` was already clean and `eslint src` already at 0 errors / 4
warnings (all four are deliberate `<img>` and webfont advisories, marked
in-file), and the audit found no broken conditionals, no missing keys, no
wrong prop passing and no commented-out leftovers. What it did find:

- **The reorder payload corrupted gallery order whenever a category
  filter was active.** `DashboardClient` sent absolute positions `0…n-1`,
  but `photos` holds only the filtered set — the filter refetches with
  `?category=`. Dragging inside Nature rewrote every Nature photo to
  `0…k`, colliding with the Urban and Objects photos already holding those
  numbers; `GET /api/photos` sorts on `position`, so public order went
  arbitrary. Stage 2's max+1 upload fix made this *more* reachable, not
  less. It now permutes the positions the visible set already holds, which
  is correct filtered or not and cannot touch an off-screen photo.
  **Reproduced before fixing** (two photos landed on position 0 and two on
  position 1) and re-run after.
- **Hydration mismatch in all four Studio surfaces**, the one carried over
  from the UI/UX pass. `useState(() => localStorage.getItem(…))` runs on
  the server too, where `window` is undefined, so the server painted
  `StudioBoot` and the client painted the dashboard. There is no
  initialiser that can read localStorage and match — the fix is to make
  both passes render the boot screen and let an effect supply the answer.
  That is `src/lib/useAdminToken.ts`, which also owns the redirect and
  sign-out. Cost is one extra frame of "Checking your session".
- **The type scale was dead, and is now live.** `@theme` declared
  `--font-size-*` / `--font-family-*`; Tailwind v4's namespaces are
  `--text-*` / `--font-*`, so all 16 `text-headline-*` class names were
  unknown utilities and every heading rendered at the 14.4px root while
  `font-headline-*` still applied its weight. Renamed to `--text-*` with
  `--text-X--line-height` / `--text-X--letter-spacing` sub-properties.
  The six `--font-family-*` tokens were **deleted** rather than renamed:
  all six read `"Jost", sans-serif`, which `body` already sets, and
  `--font-*` would have collided with `--font-weight-*` over the same
  `font-headline-md` utility name. Public `<h1>`s now measure 28.8px
  mobile / 43.2px desktop. The two workarounds that existed because the
  tokens were dead (`text-4xl md:text-6xl` on `/work`, `text-2xl` in
  `StudioTopBar`) are gone.
- **An object-URL leak** in `UploadModal` — every preview was created and
  never revoked — plus a `FormData.get() as string` cast on the contact
  form that would have hidden a real `TypeError` from `tsc`.
- **Escape and a body-scroll lock** for all three Studio dialogs and the
  mobile menu, via the new `StudioModal`. They previously closed on
  backdrop click only, while the lightbox had full keyboard control.
- **Fetch error handling landed early from Stage 5.** `fetchPhotos` and
  `fetchPhoto` had no `try/catch`, so a rejected fetch threw out of the
  Server Component. Verified: with the backend stopped, `/` and `/work`
  returned **HTTP 500** before and **200** after. `/about` always survived
  because `fetchSiteContent` already did this.
- **Duplication removed:** `API_URL` (8 copies → `src/lib/api.ts`), the
  session read (4 → `useAdminToken`), the category list (3 →
  `src/lib/categories.ts`), the spinner markup (6 → `Spinner`), the modal
  shell (3 → `StudioModal`). The glass/button *CSS* vocabulary was already
  properly shared by the UI/UX pass and was left alone; no
  `<GlassButton>` wrapper was introduced.

Third trap, in the same class as the two above:
3. **Tailwind v4 generates utilities from the variable's namespace
   prefix, not its name.** `--text-X` makes `text-X`; `--font-size-X`
   makes nothing at all and fails silently. If a `text-*` class ever stops
   having an effect, check the token's prefix first.

### Stages 4–6: not started
Each stage is gated on its own planning prompt. Do not open Stage 4 off
the back of Stage 3 being closed.

## The six-stage plan (see plan.md for the actual task breakdown)
1. Visual/structural restructure (Lovable reference) — layout,
   animation, buttons, gallery layout. Colors/bg/theme untouched.
2. Functional completion — audit what's routed/built vs. missing
   (including the Phase 6.3 Part B gap above), build out what's missing.
3. Frontend logic reaudit — component/state correctness.
4. Backend logic reaudit — route/model/business-logic correctness.
5. Linkage reaudit — frontend-backend integration, contracts, env vars,
   revalidation, error handling, end to end.
6. Security audit — stretch goal if time allows. Auth handling, JWT
   storage/expiry, CORS scope, input validation, exposed secrets.

Triage if time runs short: Stage 1-2 are non-negotiable for a working
submission. Stage 3-5 make it genuinely correct, not just visually done.
Stage 6 is bonus.