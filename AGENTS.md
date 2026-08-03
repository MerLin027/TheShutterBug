# AGENTS.md — Photography Portfolio

## Project
Dark-mode personal photography portfolio, Next.js (App Router) + Tailwind +
Framer Motion frontend, Express + MongoDB backend, Cloudinary for images.
Apple-style "Liquid Glass" UI accents on chrome elements only (nav, filter
pills, lightbox controls, admin toolbar) — never directly over a photo.
Subject matter: nature/seascapes, objects, monochrome urban/transit shots,
occasional people in frame but not the focus.

Full functional spec: `/docs/photography-portfolio-spec.md`
Visual reference (Google Stitch exports, HTML/CSS/JS): `/design-reference/`

## Stack
- Frontend: Next.js 14+ App Router, TypeScript, Tailwind CSS, Framer Motion
- Masonry: react-masonry-css
- Drag-reorder (admin): dnd-kit
- Backend: Node.js + Express, MongoDB Atlas
- Images: Cloudinary (WebP/AVIF, next/image Cloudinary loader)
- Auth: JWT, single admin user
- Deploy: Frontend → Vercel, Backend → Render

## Build Approach: Literal Port (locked decision)
We are NOT extracting a design system and rebuilding components from
scratch. We are porting each Stitch HTML/CSS/JS export into Next.js as
literally as possible — mechanical syntax translation only:
- `class` → `className`, `for` → `htmlFor`, self-close void tags
- CSS ported ~verbatim into globals.css, values kept as Stitch generated them
- Vanilla JS interactions preserved via `useEffect` (or a `<script>` tag if
  that's more reliable) rather than rewritten as idiomatic React state
Do not restructure, redesign, or "improve" the Stitch layout during a port.
Fidelity to the reference > cleanliness of the code, for this project.

## Design Reference (source of truth)
Every screen's ground truth is its folder in `/design-reference`. When in
doubt about a color, spacing value, or interaction, check the original
export — don't re-derive or guess.

## Rules for every session
1. **Read this file and the relevant phase scope before writing any code.**
   Do not attempt to build the whole app in one session — work only within
   the phase you've been given.
2. **Literal port, not redesign** — see Build Approach above.
3. **Don't touch working code outside your assigned phase's scope.** If an
   earlier phase's pages already match the reference, a later session should
   only add what its phase calls for, not restructure existing pages.
4. **One change at a time on corrections.** If something looks wrong after
   generation, fix the single specific thing — don't regenerate the whole
   screen/feature.
5. **Commit to git after every working checkpoint**, with a clear message
   (e.g. `phase-1: home/about/contact ported`, `phase-1.5: opus fixes`).
6. **Flag responsive/mobile issues** in the Stitch reference before building
   it as-is rather than silently reproducing a layout that won't collapse
   well on small screens.
7. If a task looks like it needs more context than what's been provided for
   the current phase, ask rather than guessing or pulling in unrelated parts
   of the spec.

## Model Assignment Logic
Gemini 3.1 Pro handles mechanical, low-judgment work (literal ports,
backend CRUD boilerplate) — cheap and low-risk because output is easy to
verify by eye or by testing an endpoint. Claude Opus is reserved for
judgment-heavy work where mistakes are expensive and hard to spot: short
verification/bug-fix passes after a Gemini port, backend-to-frontend
integration, and admin drag-reorder logic.

## Phase Status
Update this section as phases complete — next session reads current state
here instead of re-deriving it from the whole codebase.

- [x] Phase 1 — Literal port: Home, About, Contact (Gemini 3.1 Pro)
- [x] Phase 1.5 — Verification/bug-fix pass on Phase 1 (Claude Opus)
- [x] Phase 2 — Literal port: Work/gallery + lightbox, hardcoded data (Gemini 3.1 Pro)
- [x] Phase 2.5 — Verification/bug-fix pass on Phase 2 (Claude Opus)
- [x] Phase 3 — Backend API deployed to Render (Gemini 3.1 Pro)
  - Post-audit fixes applied: created missing `backend/scripts/seedAdmin.js`,
    completed `backend/.env.example` with admin credential keys
  - Added `GET /api/health` — lightweight, no-DB-call endpoint, used by an
    external cron-job.org ping every 10 min to prevent Render free-tier
    idle spin-down. Not a substitute for real uptime monitoring.
- [x] Phase 4 — Wire frontend to backend (Claude Sonnet 4.6 Thinking)
  - `src/lib/data.ts` — hardcoded array replaced with `fetchPhotos()` /
    `fetchPhoto()` / `fetchPhotoNeighbours()`. Adapter maps DB shape
    (lowercase category, `aspectRatio` number, `imageUrl`) → frontend
    `Photo` type. `next: { revalidate: 60 }` on all fetches.
  - `src/app/work/page.tsx` — converted to async Server Component; data
    fetched server-side and passed to new `GalleryClient.tsx` (client
    component that owns filter state).
  - `src/app/work/GalleryClient.tsx` — [NEW] empty-state UI ("No photos
    yet" with camera icon) when DB is empty; category-filter empty state
    ("No photos in this category yet") when filter matches nothing.
  - `src/app/lightbox/[id]/page.tsx` — converted to async Server
    Component; fetches photo + neighbours in parallel; uses `notFound()`
    for missing IDs; prev/next arrows gracefully disabled when only one
    photo exists.
  - `next.config.ts` — added `remotePatterns` for `res.cloudinary.com`
    and `lh3.googleusercontent.com` (home hero).
  - `.env.local` — `NEXT_PUBLIC_API_URL=https://theshutterbug.onrender.com`
  - Home page (`/`) left untouched — uses inline hardcoded images, not
    data.ts, and is outside Phase 4 scope.
- [x] Phase 5 — Admin CRUD + reorder (Claude Opus 4.6 Thinking)
  - `src/app/admin/page.tsx` — [NEW] JWT login screen, literal port of
    `design-reference/admin-login.html`. Blurred background, liquid-glass
    card, email/password form → `POST /api/auth/login`. Stores token in
    `localStorage`, redirects to `/admin/dashboard`. Loading spinner while
    checking existing token (no content flash).
  - `src/app/admin/layout.tsx` — [NEW] Minimal layout, sets metadata title.
  - `src/app/admin/actions.ts` — [NEW] Server Action calling
    `revalidatePath('/work')` and `revalidatePath('/')` so the public
    gallery reflects admin changes without waiting for the 60s ISR TTL.
  - `src/app/admin/dashboard/page.tsx` — [NEW] Thin server component
    wrapper.
  - `src/app/admin/dashboard/DashboardClient.tsx` — [NEW] Main client
    component, literal port of `design-reference/admin-dashboard.html`.
    Sidebar nav + top app bar + masonry grid. Auth guard with loading state
    before rendering any dashboard content. Features: category filter,
    upload/edit/delete modals, dnd-kit drag-to-reorder → `PUT
    /api/photos/reorder`. Sign Out clears `localStorage` token and
    redirects to `/admin`. All mutations call `revalidatePublicPages()`.
  - `src/app/admin/dashboard/PhotoCard.tsx` — [NEW] dnd-kit `useSortable`
    wrapper. Drag handles (top-left `drag_indicator` + bottom-right
    `drag_pan`), glass overlay on hover with edit/delete buttons.
  - `src/app/admin/dashboard/UploadModal.tsx` — [NEW] File upload via
    FormData → `POST /api/photos`. Client-side validation: max 10 MB,
    `image/*` type only. Computes `aspectRatio` from image dimensions.
    Category select values `['nature','objects','monochrome','urban']`
    match DB enum exactly.
  - `src/app/admin/dashboard/EditModal.tsx` — [NEW] Edit metadata modal
    (category, caption, location, tags, isFeatured) → `PUT /api/photos/:id`.
    Same category enum as upload.
  - `src/app/globals.css` — Added admin styles: `.glass-overlay`,
    `.liquid-hover`, `.image-scale-hover`, `.bg-moody-overlay`, modal
    backdrop/animation, loading spinner, drag overlay.
  - Dependencies added: `@dnd-kit/core`, `@dnd-kit/sortable`,
    `@dnd-kit/utilities`.
  - Backend `DELETE /api/photos/:id` already calls
    `cloudinary.uploader.destroy(photo.cloudinaryId)` before
    `photo.deleteOne()` — no orphaned Cloudinary images. No backend
    changes needed.

## Operational Notes
- **Git history was squashed once** (repo previously had `node_modules`
  committed inside a stray `temp-app/` scratch folder, which exceeded
  GitHub's 100MB file limit and blocked all pushes). Repo was reset to a
  single clean commit via `git checkout --orphan` + force-push. Full
  phase-by-phase commit history prior to that point no longer exists.
  Going forward: **commit and push after every phase, before starting the
  next agent session** — this is the actual fix, not just the cleanup.
- `.gitignore` uses an unanchored `node_modules` (not `/node_modules`) so
  it's caught at any depth, in any subfolder, going forward.
- Backend health/keep-alive: `GET /api/health` → cron-job.org pings every
  10 minutes.
- Admin UI is now live at `/admin` — photo uploads are possible through
  the dashboard. The admin route is client-rendered (no SSR for auth
  state); JWT token is stored in `localStorage`.