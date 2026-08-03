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
- [x] Phase 3 — Backend API (Gemini 3.1 Pro); post-audit fixes: added backend/scripts/seedAdmin.js, patched .env.example with ADMIN_EMAIL/ADMIN_PASSWORD
- [ ] Phase 4 — Wire frontend to backend (Claude Opus)
- [ ] Phase 5 — Admin CRUD + reorder (Claude Opus / Gemini 3.1 Pro)