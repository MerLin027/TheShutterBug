# REDESIGN.md: frontend redesign tracker

**Branch:** `redesign/unslop`, cut from `main` at `9585aa65` on 2026-11-14.
**Purpose:** two jobs.
1. **Rollback registry.** It records every major piece of the old design, where it lived, and how to get it back.
2. **Task tracker and activity log.** It holds the sub-plans and their status, and gets updated after every task.

`context.md` is still the project's long-term record. This file covers the redesign only, and a summary goes into `context.md` at close-out (task E2).

---

## 1. How to roll something back

Everything listed in §3 exists unchanged on `main` at `9585aa65`.

```bash
# Restore one file from before the redesign
git checkout 9585aa65 -- src/components/HeroParallax.tsx

# Show the old version without touching the working tree
git show 9585aa65:src/components/SiteFooter.tsx
```

`globals.css` is shared by everything, so restore a **section** from it rather than the whole file. §3 gives the line ranges at `9585aa65`.

"Before" screenshots, taken 2026-11-14 at 1440px and 390px, are in `design-reference/redesign-before/` (23 WebP files, under 1 MB in total). **They exist only on this machine:** `.gitignore:37` ignores all of `design-reference/`, so they aren't in git. Back the folder up if you switch machines.

---

## 2. Decisions made for this redesign (2026-11-14)

| # | Question | Answer |
|---|---|---|
| 1 | Atlas cluster status | Paused, now resumed. Live API answers `/api/health` 200 (22 s cold start). |
| 2 | Where the work happens | Branch `redesign/unslop` only, for now. Direction in §4 is approved. |
| 3 | Hero | **Try** dropping the glass-letter title and parallax. If it doesn't work out, restore it from §3.1. Read as: also try a Jost wordmark in place of the Playwrite VN script, with the script kept in §3.3 for rollback. |
| 4 | Footer "Studio Access" link | **Remove.** The Studio is reached from a bookmark at `/admin`. This reverses context.md §8's locked decision "Admin access lives in the footer". |
| 5 | `lucide-react` dependency | Approved. |
| 6 | Content | Keep the current demo photos, About copy and portrait. The owner swaps in real content once the design is ready. No generated imagery. |

Still in force from `context.md` §8: Edit button and `EditModal` stay, the drag handle stays, the category set is fixed, the About portrait stays a URL field, nothing sends email, dark only, Lovable is a reference only.

---

## 3. Rollback registry: what existed before

Line numbers refer to `9585aa65`.

### 3.1 Home hero (glass-letter title over a parallax photo)
- **Files:** `src/components/HeroParallax.tsx` (306 lines), `src/app/globals.css` 711–816 (`.hero-title-svg`, `.hero-title-line`, `-shade`, `-fill`, `-frost`, `-sheen`), `src/app/page.tsx`.
- **What it was:** an SVG wordmark in four layers:
  1. shade: a dark aura behind the letters
  2. fill: solid #f5f2ee
  3. frost: a blurred copy of the hero photo, masked to the glyph shapes
  4. sheen: a top-edge highlight
  
  These sat over a Framer Motion `useScroll` parallax (image moves 0→30%, content 0→60%, fades out by 80% of the scroll). The `<h1 class="sr-only">` holds the text for screen readers.
- **Image:** AI-generated Stitch placeholder `lh3.googleusercontent.com/aida-public/AB6AXuBN4W…=w2400`, 1376×768 master (that's the CDN ceiling).
- **Placement:** title anchored at `x 50.6%`, baseline `y 48%`. Font size `min(max(2.24vw, 4.01vh), 9.35vw)` holds the wordmark at 1.09× the boat's width. The boat's bounding box is x 569–823, y 397–517 in source pixels. Subtitle and CTA sit at `bottom: 8vh`. Verified at 14 viewports (full derivation in agent memory `shutterbug-hero-title-geometry`).
- **Copy:** subtitle "A quiet study of light, absence, and the edges of the day.", CTA "Enter the Gallery" → `/work`.
- **Screens:** `desktop_home.webp`, `desktop_home_fold.webp`, `mobile_home.webp`.

### 3.2 Footer "Studio Access" link
- **File:** `src/components/SiteFooter.tsx` (30 lines). Left: "The Shutter Bug — {year}". Right: `<Link href="/admin">Studio Access</Link>`. Both uppercase, `tracking-widest`, 70% opacity.

### 3.3 Script wordmark (Playwrite VN)
- `.font-title` at `globals.css` 697. Loaded through a Google Fonts `<link>` in `src/app/layout.tsx` (with Jost). Used in the hero title, the Studio sidebar wordmark and the Studio login title "Studio Access".
- Metrics: wght 100–400 only, no italic. "The Shutter Bug" is 9.407em wide.

### 3.4 Icons (Material Symbols Outlined)
- A variable icon font from a Google `<link>` in `layout.tsx`, `.material-symbols-outlined` at `globals.css` 318, **49 usages** across `src/`.
- Glyphs used include grid_view, chevron_left/right, close, location_on, camera_alt, filter_list_off, photo_library, mail, person, arrow_back, logout, plus the Studio card controls.

### 3.5 Public navbar (glass pill)
- `src/components/SiteNav.tsx`, `.nav-pill` at `globals.css` 704.
- Layout: Home | hairline | grid-icon Gallery, About, Contact. Uppercase tracked labels. Active state is accent text on a `bg-accent/10` wash, hover is on-surface text on `bg-white/10`. Stacks to two rows below 360px.

### 3.6 Gallery grid and filters
- `src/app/work/GalleryClient.tsx`. Masonry built from CSS `columns-1/2/3/4`. Note: this fills **column by column**, not in reading order.
- Cards: `rounded-2xl`, `group-hover:scale-[1.03]`, caption row of bold title plus uppercase category.
- Filters: `.filter-group` (`globals.css` 817) segmented glass pill with `.glass-pill-active` (361). Labels All / Nature / Objects / Monochrome / Urban. Overflows at 390px.

### 3.7 Motion system
- `src/components/Reveal.tsx`: scroll-in fade, rise and optional blur, used ×10. Gallery stagger `min((i % 8) * 0.06, 0.36)`.
- `src/components/PageTransition.tsx`: opacity-only route fade, 0.3 s, `[0.25, 1, 0.5, 1]`.
- `transition-all` ×12, `hover:scale` ×8. `prefers-reduced-motion` is respected in 12 places.

### 3.8 Surfaces and colour
- `globals.css` 5–198: 50 Material-style colour tokens from Stitch, **28 of them unused**:
  - background, inverse-on-surface, inverse-primary, inverse-surface
  - on-background, on-error, on-primary, on-primary-container
  - on-primary-fixed(-variant), on-secondary-fixed(-variant), on-tertiary-container, on-tertiary-fixed(-variant)
  - outline, outline-variant
  - primary-fixed(-dim), secondary-fixed(-dim), tertiary-container, tertiary-fixed(-dim)
  - surface-bright, surface-container-highest, surface-dim, surface-tint
- Accent `#d4af37`, page `#0a0a0a`.
- Film grain `.noise-overlay` (290) is rendered once in `layout.tsx`.
- Button recipes: `.btn-glass` 452, `.btn-icon-nest` 488, `.btn-accent` 520, `.btn-outline` 545, `.btn-danger` 569, `.btn-icon-glass(-lg)` 613–678.
- Type-scale tokens use the `--text-*` namespace (see the agent memory note on the type-scale namespace trap).

### 3.9 Studio
- **Cards:** `src/app/admin/dashboard/PhotoCard.tsx`. Hovering blurs the photo (`blur-[2px] brightness-75`) under `.glass-overlay` (`globals.css` 374–398). Controls are `pointer-events-none` until hover. A red "Delete" pill sits in the centre.
- **Shell:** `StudioShell.tsx` sidebar with script wordmark, `StudioTopBar.tsx` with a "6 frames" count pill, `StudioMenu.tsx` mobile hamburger.
- **Login:** `src/app/admin/page.tsx`. Script "Studio Access" title, button "Enter archive", background image `lh3.googleusercontent.com/aida/…` (**broken, loads at 0×0**).
- **Modals:** `UploadModal.tsx` is translucent and says "max 10MB". `EditModal.tsx`. `StudioModal.tsx` is the shared shell.
- **Screens:** `desktop-studio-*.webp`, `mobile-studio-*.webp`.

### 3.10 Other pages (structure only; the redesign keeps their content)
- **About:** portrait left, eyebrow / quote h1 / bio right. Portrait framed in a rounded glass border.
- **Contact:** centred eyebrow, "Say hello", subline, three placeholder-labelled fields, glass submit.
- **404:** "Nothing in this frame", two actions.

---

## 4. Direction (unslop)

- **Product:** a photographer's portfolio of seascapes, empty streets and quiet objects, plus a private studio for publishing them.
- **Character:** patient, exact, a little nocturnal.
- **World:** the darkroom and the contact sheet. Safelight amber, paper-black, grease-pencil marks, frame numbers on the film edge.
- **Moments:** only the photographs. Large and uncropped in the hero and the lightbox. Nothing else on the page gets colour or effects.
- **Signature:** contact-sheet frame numbering. A small monospace line like `014 · Nature · 2026` under each photo, used in the gallery, Selected Frames and the lightbox only.

Design read (taste-skill): a photographer's portfolio for editors and clients, in a quiet darkroom style, on the existing Next.js and Tailwind with native CSS motion.

**When skills disagree:** unslop wins. Taste's redesign skill suggests grain, spring physics, parallax and tinted shadows, and ui-ux-pro-max suggests ambient blobs, glass and Playfair Display. Unslop removes all of those.

**ui-ux-pro-max cross-check (2026-11-14):**
- **Kept:** the "Portfolio Grid" pattern (hero → masonry → about → contact, which matches the current structure), subtle motion at 300–400 ms, no pure `#000`, SVG icons, visible focus, testing at 375/768/1024/1440.
- **Rejected:** its light-mode palette (this site is dark only), its glass and blob effects, and Playfair Display.

---

## 5. Sub-plans

Each phase is its own approval gate. A task is done only when its "done when" check has actually been run. The branch is committed and pushed after each verified phase.

**Status key:** ☐ todo · ◐ in progress · ☑ done · ✕ dropped

### Phase 0: Setup
| ID | Task | Status |
|---|---|---|
| 0.1 | Create branch `redesign/unslop` | ☑ |
| 0.2 | Write this file | ☑ |
| 0.3 | Save "before" screenshots to `design-reference/redesign-before/` | ☑ |
| 0.4 | Confirm the live API is back (`/api/health` 200, photos served) | ☑ |

### Phase A: Foundations (no intended visual change)
| ID | Task | Files | Skills | Done when | Status |
|---|---|---|---|---|---|
| A1 | Data layer: single `API_URL`; `cloudinaryUrl()` with `f_auto,q_auto,w_N,c_limit` plus a `thumb` field; `fetchWithTimeout` (20 s); lightbox validates `?filter=` and fetches once; cache tags plus `/lightbox` revalidation | `lib/data.ts`, `admin/actions.ts`, `lightbox/[id]/page.tsx`, `GalleryClient.tsx`, `SelectedFrames.tsx`, `PhotoCard.tsx` | secure-coding (1, 7) | Grid requests the sized URL and the lightbox the full one. A deleted photo 404s immediately (with `.next` cleared between runs). One `/api/photos` request per lightbox | ☑ |
| A2 | Tell "backend down" apart from "no photos": `data.ts` reports failures; public empty states and the Studio dashboard show an error with Retry; add `app/error.tsx` | `lib/data.ts`, `work/*`, `SelectedFrames.tsx`, `DashboardClient.tsx`, new `app/error.tsx` | secure-coding (7), redesign (states) | With the backend stopped, `/work` and Studio show an error state, not "No photos yet" | ☑ |
| A3 | Self-host fonts with `next/font` (Jost, Playwrite VN kept for rollback, and a mono face for the signature); remove the Google `<link>`s | `app/layout.tsx`, `globals.css` | unslop (type), taste | No requests to fonts.googleapis.com; lint warnings 4 → 2 | ☑ |
| A4 | Replace Material Symbols with `lucide-react` (one size, stroke 1.5); remove the icon font and its CSS | all 49 usages, `layout.tsx`, `globals.css` 318 | unslop (icons) | Zero `material-symbols` matches; every icon renders | ☑ |
| A5 | Upload limit 10 → 25 MB (client check and dropzone label) | `UploadModal.tsx` | secure-coding (12) | A 12 MB file passes the client; over 25 MB is refused | ☑ |
| A✓ | Verify: `tsc`, `eslint src backend`, `build`, screenshot sweep shows no visual regression | | | All clean, compared against `redesign-before/` | ☑ |

### Phase B: Unslop the public site (nine passes, each across every public page)
| ID | Task | Detail | Skills | Status |
|---|---|---|---|---|
| B0 | New token layer | Warm-neutral dark ramp, 3 text roles, gold as the only accent, radius scale, one easing curve and its durations. Delete the 28 dead tokens | unslop tokens, design-system (validate-tokens), minimalist (restraint only) | ☐ |
| B1 | Spacing | 4px grid; one container for every section and the footer; remove the empty band on Home; replace the 46 arbitrary px values | unslop §1 | ☐ |
| B2 | Colour | Neutrals from the ramp; accent only for the active page, primary action and focus; glass on the navbar only; remove the grain overlay | unslop §2 | ☐ |
| B3 | Icons | lucide (from A4) at 16/18px in text colours; drop icons that add nothing | unslop §3 | ☐ |
| B4 | Copy | Keep the voice; no trailing periods on labels or buttons; one label per intent; run UI strings through the humanizer. Bio content isn't changed | unslop §4, humanizer, taste (CTA rules) | ☐ |
| B5 | Type | Sentence case instead of 53 uppercase and 36 wide-tracked labels; weights 400–500; Jost wordmark (rollback: §3.3); mono for the signature only | unslop §5, taste (type) | ☐ |
| B6a | Layout: hero | Photo full-bleed and static, title placed on the calm part of the image, one CTA. No glass letters, no parallax (rollback: §3.1). Uses the current boat image until a real one arrives | unslop §6, §8 | ☐ |
| B6b | Layout: gallery | Masonry that fills **in reading order**, computed from the stored `aspectRatio` so the Studio drag order is what visitors see | unslop §6, mobile-principles | ☐ |
| B6c | Layout: mobile filters | Pills that fit or wrap at 360–390px, or a visible scroll cue; 44px touch targets | mobile-principles | ☐ |
| B6d | Layout: footer | Remove "Studio Access" (rollback: §3.2); align with the content container | decision 4 | ☐ |
| B6e | Layout: About, Contact, 404, lightbox | Labels above inputs on Contact (no placeholder-as-label); lightbox caption from the signature line; same container everywhere | taste (forms), unslop §6 | ☐ |
| B7 | Details | Radii that nest instead of pills everywhere; visible focus rings (only 2 today); signature frame numbers; no "Nature … NATURE" duplication | unslop §7, design-audit (a11y) | ☐ |
| B8 | Visuals | Photos only, no generated imagery; image edges blend with the page; fixed dimensions so nothing shifts on load | unslop §8 | ☐ |
| B9 | Motion | Remove parallax, `hover:scale` and `transition-all`; blur-free reveals with at most one entrance per page; one curve; reduced-motion kept | unslop §9, motion-principles, framer-motion, design-audit | ☐ |
| B10 | Moment: grid → lightbox | The clicked photo grows into the lightbox using native View Transitions, falling back to an instant switch | genjutsu css-native, cast (one-sentence thesis first) | ☐ |
| B11 | *Optional experiment:* lightbox frame change | A WebGL dissolve between photos (three.js shader), behind a flag. Built only if B10 feels flat; dropped if it costs more than it adds (bundle, battery, reduced-motion) | threejs-shaders, -textures, -animation | ☐ |
| B✓ | Verify | Unslop checklist; screenshots at 375, 768, 1024 and 1440 against `redesign-before/`; contrast and keyboard sweep; `tsc`/`eslint`/`build` clean | unslop checklist, design-audit, ui-ux-pro-max pre-delivery list | ☐ |

### Phase C: Studio
| ID | Task | Done when | Skills | Status |
|---|---|---|---|---|
| C1 | `PhotoCard`: photo never blurred; controls in a solid bar, always visible on touch (`@media (hover: none)`); Delete becomes a quiet icon that confirms; drag handle kept | Card works at 390px with touch emulation; nothing covers the photo | mobile-principles, unslop, desktop-principles | ☐ |
| C2 | Studio grid in the same reading order as the public gallery (shares B6b) | Drag order = public order | — | ☐ |
| C3 | Modals solid, not translucent; the 25 MB label from A5 shows | No photo visible through the dropzone | unslop §2 | ☐ |
| C4 | Account: visible labels above the quote, bio and URL fields | Labels visible, not `sr-only` | taste (forms) | ☐ |
| C5 | Login: remove the broken background; title and button copy follow the direction | No 0×0 image; one clear action | unslop | ☐ |
| C6 | Shell: sidebar, top bar and mobile menu get the B passes (sentence case, ramp, icons, nav row 32–36px) | Measured nav rhythm; matches the public site | unslop §1, §6 | ☐ |
| C✓ | Verify: upload, edit, feature, reorder and delete each run against the real API with **one probe photo** (created and deleted via the real routes); messages untouched | Mongo and Cloudinary counts back to baseline | secure-coding | ☐ |

### Phase D: Security (OWASP Top 10 2017 / 2021 / 2025)
| ID | Task | OWASP | Status |
|---|---|---|---|
| D1 | Next security headers: CSP (nonce via middleware), `frame-ancestors 'none'`, `nosniff`, Referrer-Policy, Permissions-Policy, `poweredByHeader: false` | A02:2025 / A05:2021 | ☐ |
| D2 | Express: disable `x-powered-by`; security headers on API responses | A02:2025 | ☐ |
| D3 | Rate limits on `POST /api/auth/login` and `POST /api/contact`; login runs `bcrypt.compare` on every request (no timing side-channel) | A07 | ☐ |
| D4 | Server-side validation: `aboutImageUrl` must be `https:`; contact honeypot field; length caps confirmed | A05:2025 / A03:2021, A06:2025 | ☐ |
| D5 | Token lifetime 30d → shorter; plan the httpOnly-cookie move (decision, not code, in this phase) | A07, A04:2021 | ☐ |
| D6 | `npm audit` on both packages; decide on `multer-storage-cloudinary` (unmaintained since 2020) | A03:2025 / A06:2021 | ☐ |
| D7 | `/api/health` reports DB state while still returning 200, so the cron keeps working; `connectDB` retries instead of exiting, so it doesn't crash-loop | A10:2025 | ☐ |
| D8 | **Owner action:** set a strong admin password (the current one is 7 characters) through `seedAdmin` / Render | A07 | ☐ |
| D9 | `revalidatePublicPages` is a Server Action, so it's a public POST endpoint. Anyone can call it and purge the cache (no input, low impact: forces re-fetches from Render). Gate it on a token the backend verifies, or rate-limit it | A01 / A04:2021 | ☐ |
| D✓ | Verify: headers checked with curl on the build; CSP breaks nothing (no console violations on any route); rate limit trips at the threshold | | ☐ |

### Phase E: Close-out
| ID | Task | Status |
|---|---|---|
| E1 | Full sweep of every route at 4 widths; final before/after set in `design-reference/redesign-after/` | ☐ |
| E2 | Update `context.md` (§7 conventions, §8 the decisions this changed, §9 history), `AGENTS.md` and `HANDOFF.md` | ☐ |
| E3 | Create a Shutter Bug project note in the workspace vault (none exists), if the owner wants it | ☐ |
| E4 | Owner reviews the Vercel preview of the branch; decide whether to merge into `main` | ☐ |

---

## 6. Activity log

Newest last. One entry per task: what changed, how it was verified, and anything surprising.

- **2026-11-14 · 0.1–0.4.** Branch `redesign/unslop` created from `9585aa65`. This file written. 23 "before" screenshots saved as WebP (996 KB). These came from local runs on 2026-11-14: one against the Next fetch cache while Atlas was paused, and one through a read-only fixture serving the cached API responses. Atlas resumed by the owner; the live `/api/health` returns 200 after a 22 s cold start.
  - Found during the audit and recorded in the tasks above: Studio hover blurs photos (C1), hover-only controls (C1), masonry column order (B6b), filter overflow at 390px (B6c), broken login background (C5), only 2 focus styles (B7), no security headers on Vercel (D1), 7-character admin password (D8).
  - Stored About bio has a literal U+FFFD in place of an em dash; the owner can fix it by re-saving in Studio → Account.
- **2026-11-14 · A1 (code).**
  - `data.ts` rewritten:
    - `API_URL` now comes from `lib/api.ts`.
    - Every fetch goes through `apiFetch()`: 20 s `AbortSignal.timeout`, `revalidate: 60` and a cache tag (`photos` / `site-content`).
    - `cloudinaryUrl(src, w)` adds `f_auto,q_auto,c_limit,w_N`. It leaves non-Cloudinary and already-transformed URLs alone.
    - `Photo` gains `thumb`, `srcSet` (480/800/1200) and `ratio`. `src` is now a `w_2400` rendition.
    - `normaliseFilter()` is shared by `/work` and the lightbox.
    - `fetchLightbox()` replaces the double fetch.
    - Ids are checked against `/^[0-9a-f]{24}$/` before they reach a URL path.
  - Call sites: grids use `thumb` + `srcSet` + `sizes`; Studio `PhotoCard` uses w_800; `EditModal` preview uses w_1200.
  - Verified against the CDN: raw 24,457 B JPEG; `w_480` 10,712 B WebP; `w_800`/`w_1200`/`w_2400` all 21,904 B WebP. Identical sizes = `c_limit` refuses to upscale the 678px demo file.
  - **Surprise:** Next 16 changed `revalidateTag`. It takes a required profile, and `"max"` serves stale data while refreshing. HANDOFF's single-argument call would not compile. `actions.ts` now uses `updateTag()` (Server-Action only, expires immediately) plus the existing paths, and adds `revalidatePath("/lightbox/[id]", "page")`.
  - Logged D9 (the Server Action is a public endpoint).
- **2026-11-14 · A2 (code).**
  - `fetchPhotos` / `fetchFeaturedPhotos` return `{ photos, failed }`; `fetchPhoto` / `fetchLightbox` report `failed`.
  - `/work` shows "The gallery couldn't load" with Try again (`router.refresh()`) instead of the empty state.
  - Home hides Selected Frames on failure (the hero needs no data).
  - The lightbox throws on failure so `app/error.tsx` handles it, and keeps `notFound()` for a genuinely missing photo.
  - New `app/error.tsx`, styled like `not-found.tsx`. Uses Next 16's `unstable_retry` and never renders `error.message`.
  - `DashboardClient`:
    - Load-failure state with Retry, gated ahead of "No photos yet".
    - 401 → sign out on delete, featured and reorder.
    - Delete failure shown inside the confirm dialog.
    - Featured/reorder failures shown as an inline alert above the grid.
  - `tsc` clean; `eslint src backend` 0 errors, 4 warnings (baseline).
- **2026-11-14 · A3 (code).**
  - `layout.tsx` loads Jost (latin, variable), Playwrite VN and IBM Plex Mono (400/500, `preload: false` until B7 uses it) through `next/font/google`. They're exposed as `--font-jost`, `--font-playwrite` and `--font-plex-mono` on `<html>`.
  - `globals.css`: body and both Playwrite declarations read the variables (the old family names stay as fallbacks). New `--font-mono` theme token.
  - Google Fonts `<link>` for Jost/Playwrite removed. The Material Symbols `<link>` stays until A4.
  - Lint 4 → 3 warnings.
  - **Note:** Playwrite VN has no subsets in Google's catalogue, so `next/font` can never preload it. Its types reject the `preload` option.
- **2026-11-14 · A4 (code).**
  - `lucide-react` pinned **exactly at 1.65.0** (published 2026-10-30). The latest, 1.73.0, was released the same morning; pinning a release more than two weeks old is a supply-chain precaution (OWASP A03:2025). It has no runtime dependencies.
  - 43 of 49 usages converted by a one-off codemod (scratchpad, not committed). It keeps each icon's existing pixel size: Material's default was 24px.
  - 6 converted by hand:
    - Studio `<select>` chevron and the Messages expand chevron
    - featured `Star` and nav `LayoutGrid`, which fill with `currentColor` when active (replacing `'FILL' 1`)
    - `StudioNavItem.icon` is now a `LucideIcon` component, not a glyph string
  - `globals.css`: `.material-symbols-outlined` rule replaced by `svg.lucide { stroke-width: 1.5 }`. The CSS property overrides the attribute, so call sites never pass a stroke.
  - Icon-font `<link>` removed. **No Google Fonts requests remain in `src/`.**
  - Lint now **0 errors, 2 warnings** (the two deliberate `<img>` notices).
  - npm reported existing audit findings during install. Deferred to D6.
- **2026-11-14 · A5 (code).** `UploadModal`: `MAX_FILE_SIZE_MB = 25` drives the check, the error message and the dropzone caption. A comment ties it to the backend's `MAX_UPLOAD_BYTES` (also 25 MB, confirmed).
- **2026-11-14 · A✓ verified.**
  - **Setup.** Clean `next build` and `next start` against the real backend (Atlas) through a logging proxy, with `.next` removed before each build. The proxy is a scratchpad harness and isn't committed. The build succeeded, with exactly 1 build-time call each to `/api/photos` and `/api/site-content`.
  - **L8: one fetch per lightbox.** A filtered lightbox made exactly one API call (`/api/photos?category=nature`) and no separate `/api/photos/:id`.
  - **L7: filter validation.** `?filter=bogus'><script>…` falls back to All. Previous, Next and Close all work, and no API call was made (the list came from cache). The value appears only inside Next's own escaped router payload, never as markup.
  - **Ids.** `nope` and `..%2F..%2Fapi%2Fcontact` → 404 **without calling the API**. A valid-format unknown id → one lookup → 404.
  - **L2: immediate revalidation.** Probe photo uploaded through the real route, then:
    - Its lightbox returned 200 while Home was still cached without it (caching proven).
    - Studio UI → Feature → Home listed it **52 ms** later.
    - Studio UI → Delete → its lightbox returned **404 141 ms after the action**, and Home dropped it.
    - Atlas 6 → 6 and Cloudinary 6 → 6, back to baseline.
  - **A2: outage behaviour.** With the backend refusing connections and an empty cache:
    - `/work` shows "The gallery couldn't load" with Try again.
    - The lightbox renders `error.tsx` (HTTP 500, not a false 404).
    - Studio shows "Network error…" with Retry. Its top bar no longer says "0 frames" during an outage (found during this check, fixed, rebuilt).
    - `/` and `/about` keep serving their prerendered copy.
    - Recovery: after the backend came back, Try again and Retry each loaded all 6 photos.
  - **L4: timeout.** With the backend accepting connections and never answering, `/work` gave up at **20.1 s** and rendered the failure state. Before this change it would have hung indefinitely.
  - **401s.** With an invalid token, Feature, Delete and drag-Reorder each sign out to `/admin` and clear the token. The API rejected all three, and the DB (positions and flags) is unchanged.
  - **A5: upload limit.** A real 10.6 MiB PNG passes the client and is sent (the old 10 MiB limit refused it). The request was aborted in the browser, so nothing was stored. A 27.6 MiB PNG is refused in the browser with "File too large (27.6 MB). Maximum is 25 MB."
  - **Sweep (11 routes × 1440 / 390).**
    - Zero requests to `fonts.googleapis.com` or `gstatic`. 1–2 self-hosted font files per page; mono loads nowhere yet.
    - The browser picks 480w on desktop cards and 800w on mobile at 2×; the lightbox loads 2400w.
    - Studio cards load 800w. The About and hero placeholders are left untouched.
    - No icon-font glyph text leaks; no horizontal overflow; screenshots match `redesign-before/` apart from the lucide icons.
  - **Checks.** `tsc` clean. `eslint src backend` **0 errors, 2 warnings** (down from 4).
  - **Still open, not Phase A:** the Studio login background is still broken (C5); `lh3.googleusercontent.com` is still contacted for the placeholder hero and portrait (content swap).
  - **Note for E4:** a Vercel preview of this branch will serve public pages fine, but its Studio and contact form will be blocked by CORS. The backend only allows `the-shutter-bug.vercel.app`, not preview domains.
