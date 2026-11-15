# REDESIGN.md: frontend redesign tracker

**Branch:** `redesign/unslop`, cut from `main` at `9585aa65` on 2026-11-14.
**Purpose:** two jobs.
1. **Rollback registry.** It records every major piece of the old design, where it lived, and how to get it back.
2. **Task tracker and activity log.** It holds the sub-plans and their status, and gets updated after every task.

`context.md` is still the project's long-term record. This file covers the redesign only, and a summary goes into `context.md` at close-out (task E2).

---

## 1. How to roll something back

**The redesign is LIVE** (merged to `main` as `f644be73` on 2026-11-14, deployed by Vercel within ~45 s). To undo the whole thing:

1. **Fastest, no code:** Vercel dashboard → the project → Deployments → the deployment before `f644be73` → **Instant Rollback**. The live site reverts in seconds; `main` is unchanged, so the next push redeploys the redesign.
2. **Permanent, in git:** this creates one new commit that reverses all of Phases A–C. Vercel deploys it automatically. Nothing is rewritten, and the redesign can be re-applied later by reverting the revert.
   ```bash
   git switch main
   git pull
   git revert -m 1 f644be73
   git push
   ```

To undo just one piece instead, use the per-file commands below.

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
| B0 | New token layer | Warm-neutral dark ramp, 3 text roles, gold as the only accent, radius scale, one easing curve and its durations. Delete the 28 dead tokens | unslop tokens, design-system (validate-tokens), minimalist (restraint only) | ☑ |
| B1 | Spacing | 4px grid; one container for every section and the footer; remove the empty band on Home; replace the 46 arbitrary px values | unslop §1 | ☑ |
| B2 | Colour | Neutrals from the ramp; accent only for the active page, primary action and focus; glass on the navbar only; remove the grain overlay | unslop §2 | ☑ |
| B3 | Icons | lucide (from A4) at 16/18px in text colours; drop icons that add nothing | unslop §3 | ☑ |
| B4 | Copy | Keep the voice; no trailing periods on labels or buttons; one label per intent; run UI strings through the humanizer. Bio content isn't changed | unslop §4, humanizer, taste (CTA rules) | ☑ |
| B5 | Type | Sentence case instead of 53 uppercase and 36 wide-tracked labels; weights 400–500; Jost wordmark (rollback: §3.3); mono for the signature only | unslop §5, taste (type) | ☑ |
| B6a | Layout: hero | Photo full-bleed and static, title placed on the calm part of the image, one CTA. No glass letters, no parallax (rollback: §3.1). Uses the current boat image until a real one arrives | unslop §6, §8 | ☑ |
| B6b | Layout: gallery | Masonry that fills **in reading order**, computed from the stored `aspectRatio` so the Studio drag order is what visitors see | unslop §6, mobile-principles | ☑ |
| B6c | Layout: mobile filters | Pills that fit or wrap at 360–390px, or a visible scroll cue; 44px touch targets | mobile-principles | ☑ |
| B6d | Layout: footer | Remove "Studio Access" (rollback: §3.2); align with the content container | decision 4 | ☑ |
| B6e | Layout: About, Contact, 404, lightbox | Labels above inputs on Contact (no placeholder-as-label); lightbox caption from the signature line; same container everywhere | taste (forms), unslop §6 | ☑ |
| B7 | Details | Radii that nest instead of pills everywhere; visible focus rings (only 2 today); signature frame numbers; no "Nature … NATURE" duplication | unslop §7, design-audit (a11y) | ☑ |
| B8 | Visuals | Photos only, no generated imagery; image edges blend with the page; fixed dimensions so nothing shifts on load | unslop §8 | ☑ |
| B9 | Motion | Remove parallax, `hover:scale` and `transition-all`; blur-free reveals with at most one entrance per page; one curve; reduced-motion kept | unslop §9, motion-principles, framer-motion, design-audit | ☑ |
| B10 | Moment: grid → lightbox | The clicked photo grows into the lightbox using native View Transitions, falling back to an instant switch | genjutsu css-native, cast (one-sentence thesis first) | ☑ |
| B11 | *Optional experiment:* lightbox frame change | A WebGL dissolve between photos (three.js shader), behind a flag. Built only if B10 feels flat; dropped if it costs more than it adds (bundle, battery, reduced-motion) | threejs-shaders, -textures, -animation | ✕ not built (see log) |
| B✓ | Verify | Unslop checklist; screenshots at 375, 768, 1024 and 1440 against `redesign-before/`; contrast and keyboard sweep; `tsc`/`eslint`/`build` clean | unslop checklist, design-audit, ui-ux-pro-max pre-delivery list | ☑ |

### Phase C: Studio
| ID | Task | Done when | Skills | Status |
|---|---|---|---|---|
| C1 | `PhotoCard`: photo never blurred; controls in a solid bar, always visible on touch (`@media (hover: none)`); Delete becomes a quiet icon that confirms; drag handle kept | Card works at 390px with touch emulation; nothing covers the photo | mobile-principles, unslop, desktop-principles | ☑ |
| C2 | Studio grid in the same reading order as the public gallery (shares B6b) | Drag order = public order | — | ☑ |
| C3 | Modals solid, not translucent; the 25 MB label from A5 shows | No photo visible through the dropzone | unslop §2 | ☑ |
| C4 | Account: visible labels above the quote, bio and URL fields | Labels visible, not `sr-only` | taste (forms) | ☑ |
| C5 | Login: remove the broken background; title and button copy follow the direction | No 0×0 image; one clear action | unslop | ☑ |
| C6 | Shell: sidebar, top bar and mobile menu get the B passes (sentence case, ramp, icons, nav row 32–36px) | Measured nav rhythm; matches the public site | unslop §1, §6 | ☑ |
| C✓ | Verify: upload, edit, feature, reorder and delete each run against the real API with **one probe photo** (created and deleted via the real routes); messages untouched | Mongo and Cloudinary counts back to baseline | secure-coding | ☑ |

### Phase D: Security (OWASP Top 10 2017 / 2021 / 2025)
| ID | Task | OWASP | Status |
|---|---|---|---|
| D1 | Next security headers: CSP (nonce via middleware), `frame-ancestors 'none'`, `nosniff`, Referrer-Policy, Permissions-Policy, `poweredByHeader: false` | A02:2025 / A05:2021 | ☑ |
| D2 | Express: disable `x-powered-by`; security headers on API responses | A02:2025 | ☑ |
| D3 | Rate limits on `POST /api/auth/login` and `POST /api/contact`; login runs `bcrypt.compare` on every request (no timing side-channel) | A07 | ☑ |
| D4 | Server-side validation: `aboutImageUrl` must be `https:`; contact honeypot field; **add server-side length caps to the Contact model (none exist; found in Phase B), matching the client's 100 / 254 / 5000** | A05:2025 / A03:2021, A06:2025 | ☑ |
| D5 | Token lifetime 30d → shorter; plan the httpOnly-cookie move (decision, not code, in this phase) | A07, A04:2021 | ☑ |
| D6 | `npm audit` on both packages; decide on `multer-storage-cloudinary` (unmaintained since 2020) | A03:2025 / A06:2021 | ☑ |
| D7 | `/api/health` reports DB state while still returning 200, so the cron keeps working; `connectDB` retries instead of exiting, so it doesn't crash-loop | A10:2025 | ☑ |
| D8 | **Owner action:** set a strong admin password (the current one is 7 characters) through `seedAdmin` / Render | A07 | ☐ |
| D9 | `revalidatePublicPages` is a Server Action, so it's a public POST endpoint. Anyone can call it and purge the cache (no input, low impact: forces re-fetches from Render). Gate it on a token the backend verifies, or rate-limit it | A01 / A04:2021 | ☑ |
| D10 | **Owner directive (2026-11-15): stop anyone downloading the photographs, whether by right-click, dev tools or any other route.** A browser can't show an image without sending its pixels, so anything on screen can still be screenshotted or pulled from the network tab. The goal is to make downloading hard and the result low-value: (a) never serve the original. Cap delivery to display sizes through Cloudinary transforms, and move originals to `type: authenticated` / signed URLs so a guessed or edited URL returns nothing bigger. (b) A visible watermark on public deliveries (Cloudinary overlay), if the owner wants one. (c) No right-click save or drag: `contextmenu` / `dragstart` blocked on photos, `draggable=false`, `-webkit-touch-callout: none` for long-press. (d) Photos painted as CSS backgrounds or `<canvas>` behind a transparent layer, so "Open image in new tab" and Inspect show no image URL. (e) Strip EXIF/GPS from deliveries. (f) Hotlink protection: Cloudinary strict transformations plus an allowed-referrer list, so other sites can't embed or proxy the photos. (g) Studio's "Download current" (owner-only) stays, behind auth. Plan this with the owner before building: (b) and (d) change how the site looks and behaves. | A01 / A04:2021 | ☑ |
| D✓ | Verify: headers checked with curl on the build; CSP breaks nothing (no console violations on any route); rate limit trips at the threshold | | ☐ |

### Phase E: Close-out
| ID | Task | Status |
|---|---|---|
| E1 | Full sweep of every route at 4 widths; final before/after set in `design-reference/redesign-after/` | ☑ |
| E2 | Update `context.md` (§7 conventions, §8 the decisions this changed, §9 history), `AGENTS.md` and `HANDOFF.md` | ☑ |
| E3 | Create a Shutter Bug project note in the workspace vault (none exists), if the owner wants it | — skipped (owner) |
| E4 | Owner reviews the Vercel preview of the branch; decide whether to merge into `main` | ☑ (merged and verified live at every step) |

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
- **2026-11-14 · Phase A committed** as `5ae40b3f` and pushed to `origin/redesign/unslop`. `main` is untouched.
- **2026-11-14 · Phase B: unslop the public site.** Following unslop's rule for near-total rewrites, all nine passes were planned first and each screen was written once with every pass applied, then checked.
  - **B0 tokens.**
    - Warm paper-black ramp: `paper` #100f0d, `card`, `raised`, `fg` / `fg-2` / `fg-3`, hairline `line` at 9%. Measured contrast on paper: 15.4 / 7.6 / 5.3; the weakest pairing is fg-3 on raised at 4.6.
    - 28 unused Stitch tokens deleted. The Material names the Studio still uses are now aliases of the ramp, so the Studio shifted tone without its markup changing (screenshot-checked).
    - New public type tokens (`meta`, `label`, `lead`, `heading`, `title-sm`, `title`), semantic radii (`photo` 4, `control` 10, `panel` 16), and one easing curve `cubic-bezier(0.22,1,0.36,1)` with 160 / 200 / 420 ms durations (the global default is now 160 ms; it was 300).
    - **Deliberate deviation:** the 90% root font size stays (owner's earlier choice), so unslop's 4px grid is a consistent 3.6px rem grid in practice.
  - **B1 spacing.** `.site-container` widened to 90rem, and every public section (nav, headings, grids, footer) now shares it, which fixes the gallery/footer edge mismatch.
  - **B2 colour.**
    - Accent only for the current page, focus and the frame line on hover. Primary buttons are off-white with paper text.
    - Glass survives on the navbar only (`.site-nav`, a dark tint).
    - Film-grain overlay removed.
  - **B3 icons.** lucide at 16–20px in text colours.
  - **B4 copy.**
    - Sentence case throughout; no trailing periods on short strings.
    - Em dashes removed from rendered UI copy (humanizer).
    - "Enter the gallery", "Browse the gallery", "Show all" etc.
    - The contact success line ("I'll be in touch within a couple of days") is **left unchanged pending the owner's decision**; it still implies a reply will arrive.
  - **B5 type.** Wordmark in Jost 500 (Playwrite VN kept only for the Studio and for rollback). Weights 400/500. No uppercase or tracked labels on the public site (scan: 0 left).
  - **B6a hero.** New server component `Hero.tsx`:
    - Static full-bleed photo; title, subtitle and one CTA on the sky above the boat.
    - Two tonal scrims in the page colour instead of a glow.
    - `HeroParallax.tsx` deleted (restore: `git show 9585aa65:src/components/HeroParallax.tsx`).
    - Subtitle contrast measured against the **brightest pixel behind it**: 5.55 desktop, 5.48 mobile. The first attempt measured 4.37 and the scrim was strengthened.
  - **B6b gallery.**
    - New `FrameGrid` with **justified rows** (pure CSS: `flex-grow ∝ aspect ratio`). Every row shares one height, widths follow each photo's ratio, and the order is reading order.
    - A nearly full last row stretches edge to edge; a short one keeps its natural size.
    - Measured: every row ends at the container edge (1368/1368) at 1440px; phones get one full-width photo per row.
    - **Note:** this replaced masonry *columns* with justified *rows* — closer to a contact sheet, and the only pure-CSS layout that keeps reading order at every width.
  - **B6c filters.** Text tabs with an accent underline (`aria-pressed`), left-aligned beside the title. They wrap at 390px instead of overflowing.
  - **B6d footer.** One line, "The Shutter Bug · 2026". The "Studio Access" link is removed (decision 4).
  - **B6e other pages.**
    - **Lightbox:** the photo gets all the space; caption and controls sit in their own bar below it, so nothing overlaps the photo on phones. Controls are solid circles with no blur.
    - **About:** 5/7 split; the portrait is a plain print.
    - **Contact:** split layout, labels above the fields, `autocomplete`, client `maxLength` 100/254/5000.
    - **404 and error:** left-aligned, using the frame line ("404 · Empty frame").
  - **B7 details.** Frame line `001 · Nature · 2026` in IBM Plex Mono (now preloaded) under every photo, turning accent on hover/focus. No more "Nature … NATURE" duplication. Keyboard: Tab reaches each photo with a 2px accent ring (measured).
  - **B8 visuals.** Photographs only, no generated imagery. Hero has fixed dimensions and `fetchPriority="high"`.
  - **B9 motion.**
    - Removed parallax, hover-zoom, blur-in reveals, `transition-all`, the grain, and the Framer page fade.
    - One CSS entrance per page (`.enter`: fade plus 8px rise, 60ms stagger), collapsed by reduced motion.
    - `Reveal.tsx` and `PageTransition.tsx` deleted. Framer Motion remains only for the Studio's mobile menu.
  - **B10 grid → lightbox.** `experimental.viewTransition` plus React canary `<ViewTransition name="photo-{id}">` on both the grid card and the lightbox image (types via `src/types/react-canary.d.ts`). Verified in Chrome: clicking a card started a view transition, and mid-flight the browser was animating `::view-transition-group(photo-…)`, i.e. the photo itself morphing into place. Reduced motion disables it.
  - **B11 (three.js dissolve): not built.** The plan made it conditional on B10 feeling flat, and B10 works as intended. A WebGL lightbox would add roughly 150 KB of three.js and GPU work to the one view where the photograph should be untouched. The three.js skills were read and judged not to fit; it's offered to the owner as an opt-in instead.
  - **A4 regression found and fixed here.** The codemod had turned Material's filled icons into `fill="currentColor"`, which in lucide paints the inner check/"!" the same colour as the disc, so the symbol vanished. `CircleCheck`, `CircleAlert` and `MapPin` no longer fill. `Star` and `LayoutGrid` are fine filled.
  - **Security finding for D4.** The backend `Contact` model has **no length limits** on any field. Only Express's 100 KB body cap bounds it. The new client `maxLength`s are UX only; D4 must add server limits to match (100 / 254 / 5000).
  - **Verification.** Clean production build against the real API. `tsc` clean. `eslint src backend` **0 problems** (was 2 warnings; the last two `<img>`s now carry documented disable comments). Token validator: 0 hardcoded colours (was 2). Sweep of 11 routes × 1440 / 390: all correct statuses, no horizontal overflow, no glyph leaks. The Studio renders unchanged apart from the tone.
  - **Unverified:** the frame line's accent on *keyboard* focus read as still muted in the probe, most likely sampled inside its 160ms colour transition. Hover is visually confirmed; keyboard focus needs a human look.
- **2026-11-14 · Phase B committed** as `1730cd44` and pushed to `origin/redesign/unslop`. `main` is untouched.
- **2026-11-14 · Contact success message.** Owner decision: "Message sent. I'll be in touch within a couple of days." → **"Message sent. Thank you."** Nothing notifies the owner of new messages, so the site no longer promises a reply anywhere. This closes the item HANDOFF §6 left open.
- **2026-11-14 · Phase C: the Studio.** All 13 Studio files rewritten on the Phase B token system, with unslop's app rules on top.
  - **Shell.**
    - Sidebar on `paper-deep`: Jost wordmark plus a muted "Studio" line.
    - Navigation rows 2.25rem tall with a 2px gap, sentence case. The active row is a surface step plus a hairline highlight, with the accent only on the icon.
    - The top bar is opaque with a hairline, its title **kept centred per the owner's earlier Studio UX request** (unslop prefers left), and the count is a mono line instead of a pill.
    - Mobile menu sheet rewritten **without Framer Motion**: CSS fade/rise, Escape closes, focus moves in and back out, the page behind is scroll-locked. **`framer-motion` uninstalled**; nothing else used it.
  - **C1 photo card.**
    - The photo is never touched (measured: `filter: none`, `transform: none` on hover).
    - A solid tool row under it is always visible: reorder handle, caption and frame line, feature / edit / delete as equal 36px icon buttons. Delete stays behind the confirm dialog, which now shows a thumbnail.
    - Phone with touch emulation (no hover at all): all four controls visible, and tapping Edit opens the dialog.
  - **C2 order.**
    - The Studio grid uses the same `.justified` rows as the public gallery, with a shorter row (`--row: 11rem`), measured at 4 per row at 1440 instead of 2.
    - dnd-kit's transform is translate-only, so photos aren't squashed mid-drag.
    - **New: keyboard reordering** (handle → Space → arrows → Space) with a custom `readingOrderCoordinates`. ←/↑ mean one frame earlier and →/↓ one later. The stock dnd-kit getter is spatial and misbehaved in wrapped rows (found in this check; see the data note below).
    - Verified with the probe: ← moved it 6 → 5, the public `/work` reading order matched the API, → restored it, and every real photo's position was unchanged.
  - **C3 dialogs.**
    - Solid `.panel` on an 80% backdrop with no blur (measured `backdrop-filter: none`).
    - Escape closes, and focus returns to the opener (measured: back on "Edit …").
    - Upload and Edit have labels above every field and mark optional fields as optional.
    - The drop zone's real file input is sr-only but focusable: Tab from the dialog's close button lands on it, and the zone shows the focus ring. It used to be a clickable `<div>` no keyboard could reach.
    - The edit preview reserves its box from the stored aspect ratio (416×230 measured), so the form doesn't jump.
    - "max 25 MB" shown.
  - **C4 Account.** Visible labels (Heading, Bio, Portrait image URL). Bio hint linked via `aria-describedby`. The portrait field is `type="url"`; the real https enforcement is D4.
  - **C5 sign-in.**
    - Broken 0×0 background removed, not replaced (measured: 0 `<img>` on the page).
    - Solid card, h1 "Sign in", `autocomplete="username"` / `"current-password"` so a password manager can fill a long password (D8). A real sign-in through the UI reaches the dashboard.
    - Errors stay generic (the server's "Invalid email or password").
    - "Network error — is the backend running?" replaced in all four Studio forms with wording meant for a person.
  - **Messages.** Rows are `.panel`s with `aria-expanded` / `aria-controls`. The sender's email is plain secondary text, not the accent, and still not a link (no-email rule). Delete is a quiet button that opens the confirm dialog. The body is still rendered as escaped text.
  - **C6 cleanup.**
    - `globals.css` rebuilt from scratch on one token system: 1,029 → 551 lines.
    - Removed: every Material colour alias, the old type tokens, the custom radius ladder, every glass/overlay/button recipe from the Stitch era, `.font-title`, and the Playwrite VN font load (decision 3, restorable from git).
    - Spinner and skeletons draw in `currentColor`.
    - Scan: no TSX references any removed token.
  - **Bug found and fixed.** The base rules `h1,h2,h3 { text-wrap: balance }` / `p { text-wrap: pretty }` were unlayered, so they beat Tailwind utilities. `text-wrap` is a shorthand that also sets wrap mode, so it **silently cancelled `truncate` on every `<p>`** ("005 · Objects" wrapped in a narrow card). Moved into `@layer base`; measured: every frame line is now a single line.
  - **Data note (owner's real data).** The first keyboard-reorder run, before `readingOrderCoordinates` existed, swapped the probe with real photo `…2b9d`, then the probe was deleted, leaving `2b9d` at position 6 instead of 5. Visible order was unaffected. Restored immediately with one `PUT position:5`. Final state is identical to baseline (`2b98@0* 2b99@1* 2b9a@2* 2b9c@3 2b9b@4 2b9d@5`), confirmed after the re-run. The probe photo was created and deleted through the real routes; Atlas and Cloudinary are back to 6/6. The real contact message was only viewed.
  - **Verification.**
    - Production build against the real API; `tsc` clean; `eslint src backend` 0 problems.
    - Sweep of 11 routes × 1440 / 390 with no overflow.
    - Public-site measurements identical to Phase B after the stylesheet rebuild: row geometry, hero contrast 5.55 / 5.48, focus ring, and the view transition still morphing `photo-{id}`.
  - **Harness notes.**
    - The heredoc-plus-`rm -rf` safety block and the shell eating Windows backslashes are both known traps (HANDOFF §7). Scripts now go in files.
    - The owner cleared their temp folder mid-phase; the harness in this session's scratchpad was unaffected.
- **2026-11-14 · Phase C committed** as `1a25e9e3` and pushed to `origin/redesign/unslop`. `main` is untouched.
- **2026-11-14 · Merged to `main` and live** (owner request: "merge to main for now"). Merge commit `f644be73` (`--no-ff`, so one `git revert -m 1` undoes Phases A–C). Vercel deployed it in ~45 s. Live check against the-shutter-bug.vercel.app at 1440 and 390 px: every route returns the right page and status; all 6 photos load from Render on `/`, `/work` and the Studio dashboard; every image loads; no overflow. The only console error is the intended 404. Backend unchanged, so no Render deploy was needed. Rollback steps are in §1.

---

## Phase R — editorial refinement (owner feedback after going live, 2026-11-14)

Owner verdict on the live Phase B/C design: "hideous", the gallery "takes too much time opening and is laggy, doesn't work sometimes on multiple clicks", "button not working after logout", no scroll effects or proper animations, the navbar the main problem, and the title should have animation and effects. Chose (via question): **editorial serif** direction and **masonry** gallery. The unslop restraint rules are superseded here by the owner's direction; the ui-ux-pro-max skill (`--design-system`, style/typography/ux searches) and genjutsu css-native + motion-principles guided the work.

- **Lag, diagnosed on the live site.**
  - Every photo open was a full server render (~350 ms, cache MISS each time) with nothing on screen meanwhile (~480 ms per click).
  - The experimental view transition swallowed clicks made mid-transition: 4 quick "Next" presses moved 1 photo.
- **Fix: in-page viewer** (`components/Viewer.tsx`, `components/PhotoBrowser.tsx`).
  - The card's cached image shows instantly (same `srcSet`/`sizes`), and the sharp 2400px rendition fades over it.
  - Neighbours are preloaded. Each step is a functional state update.
  - ← → Escape and swipe work; focus moves in and back out; scroll is locked.
  - The URL is synced to `?photo=`, so Back closes the viewer and links can be shared.
  - `/lightbox/[id]` now validates, then redirects to `/work?photo=` (dropping a stale filter if the photo isn't in it).
  - `experimental.viewTransition`, `<ViewTransition>`, the canary types and `FrameGrid` are removed.
  - **Measured:** viewer visible in 32–62 ms (was ~480); 4 quick Next = +4 (was +1); Back closes; shared link opens; Home featured opens in 38–65 ms.
- **"Button not working after logout":** could not reproduce on the live site in a scripted browser (sign in → sign out → Back to site → Enter the gallery → /work, no errors). The likely cause is the view transition's swallowed clicks, which is now removed. Ask the owner to name the button if it recurs.
- **Look.**
  - Cormorant Garamond (variable, italics) as the display face, Jost for text; IBM Plex Mono removed.
  - Small-caps label voice (`.caps` / `.frame-meta`, shared with the Studio).
  - Serif `.display-title` / `.section-title` / italic `.lede`, and `.text-link` with a drawn hairline and an arrow.
- **Navbar.**
  - No box: serif wordmark left, small-caps links right, an underline that draws in on hover, and a gold underline on the current page.
  - Transparent over the hero; a solid blurred band fades in as you scroll (scroll-driven CSS).
  - Phones: "Menu" opens a full-screen sheet of large serif links rising in a stagger.
  - Aligned to the content edge (measured 72/72 px and 18/18 px).
- **Hero.**
  - The title "develops": 13 letter spans surface from a blurred, over-exposed smudge with a 55 ms stagger, then one safelight sweep passes across.
  - The photo settles in on load, then parallaxes on scroll; the text block lifts and fades as you scroll; a scroll cue below.
  - Measured at scroll 450: nav band 0 → 1, hero text opacity 1 → 0.23, media translateY 72px.
- **Scroll reveals.** `.reveal` uses a scroll-driven view timeline: gallery cards, section heads, the home statement and later bio paragraphs. Pure CSS, so it can't block input.
- **Gallery.**
  - Masonry columns in reading order (shortest-column-first from stored ratios).
  - Column count is guessed from the User-Agent on the server (phone 1, tablet 2, desktop 3) and corrected on the client, so phones don't flash 3 → 1 (measured: 1 column on an iPhone UA).
  - Cards zoom gently on hover, and a hairline mount tightens. Serif caption title plus small-caps meta.
- **Home** adds "The work" statement (paragraph 2 of the owner's own About bio, set large in serif) and "Selected work" as a responsive grid using the same instant viewer.
- **Other pages.** About is an editorial spread with a sticky portrait. Contact uses underline-only fields and small-caps labels. 404/error, footer (wordmark, line, links, year), and the opaque viewer backdrop.
- **Bugs caught in review and fixed.**
  - Title rendered "TheShutterBug": the space inside the inline-block was dropped.
  - The Phase R CSS was unlayered and beat `sm:hidden`, so "Menu" showed on desktop. It's now in `@layer components` (same trap as Phase C).
  - Gallery heading borrowed the hero's slow delays.
  - A shared `?photo=` link reopened the viewer on every filter change.
- **Reduced motion:** every Phase R effect is off.
- **Checks:** `tsc` clean, `eslint src backend` 0 problems, production build against the real API, sweep of 11 routes × 2 widths with no overflow.
- **2026-11-15 · Phase R live.**
  - Merged as `7223b89b` (`--no-ff`; undo with `git revert -m 1 7223b89b` or Vercel Instant Rollback). Vercel deployed it in ~30 s.
  - Live check: title animates (13 letters), boxless nav shows Gallery/About/Contact, 3 masonry columns, the viewer opens in 35 ms, 4 quick Next clicks = +4, Back closes it, /about /contact /admin all 200, no page errors.
- **2026-11-15 · "Backend showed a failure ~20 h ago" (owner report).**
  - Backend is healthy now: `/api/health` and `/api/photos` 200 in under 0.5 s. A local boot is clean (Cloudinary OK, MongoDB connected), and Atlas resolves.
  - No `backend/` or `render.yaml` change since 2026-11-13, so nothing from the redesign touched it. All Vercel statuses on GitHub are success (Render doesn't report to GitHub).
  - Most likely cause: the 2026-11-14 outage. After Render was resumed while Atlas was still paused, `connectDB` hit `querySrv ENOTFOUND` and called `process.exit(1)`, so the service crash-looped until Atlas was resumed.
  - Render's own event log (dashboard → service → Events/Logs) would confirm the exact error; it isn't reachable from here.
  - Fix queued as **D7**: retry the DB connection instead of exiting, and have `/api/health` report DB state.

## Studio refinement + footer (owner request, 2026-11-15)

Owner: "refine the pages left in a similar manner — the admin login, the dashboard and the other pages in admin", and remove the footer's links.

- **Footer:** the Gallery / About / Contact links are gone; the wordmark, the line and the year remain.
- **Shared Studio styles** (`globals.css`, components layer):
  - `.field` / `.field-label` now match Contact: underline fields, small-caps labels, a gold underline on focus. The bio textarea keeps a faint well so its edges are findable.
  - `.btn` is a pill, as on Contact.
  - `.studio-nav-row`: no surface blocks. The current page is full-strength text with a short gold rule at its left edge.
  - New `.studio-title` / `.studio-heading` serif classes.
- **Sign-in (`/admin`):**
  - Split into a server `page.tsx` and a client `SignInClient.tsx` (moved with `git mv`).
  - On desktop, the first featured photo fills the left half, with only its caption on a scrim. The form sits on the paper: serif "Sign in", italic lede, underline fields, pill button, "Back to the site" text link.
  - Phones, or no featured photo: the form alone.
  - Only four public fields (src, srcSet, alt, title) cross to the client.
  - The Studio layout now sends `robots: noindex, nofollow`.
- **Studio chrome:** serif wordmark plus small-caps "Studio" in the sidebar, the mobile sheet and the boot screen. Serif page titles in the top bar, the count in caps, serif dialog titles.
- **Gallery (Studio):**
  - The category `<select>` is replaced by the public gallery's underline tabs, one row at every width (it scrolls sideways on phones).
  - Photo cards take two lines, label then tools. On one shared line, narrow frames truncated to "005 · O…".
- **Messages:** a hairline list instead of stacked cards. Serif sender names, the avatar circle dropped, and the open message in lead-size text. The address is repeated in the body only on phones. Centred under the title.
- **Account:** caps "Signed in as", a serif "About page" heading, and an italic lede. Centred.
- **Checks:**
  - `tsc` clean; `eslint src backend` 0 problems; production build OK.
  - Read-only puppeteer pass against a local backend: the live API's CORS correctly refuses localhost.
  - Sign-in through the real form → dashboard. Tabs filter correctly (Nature = 2).
  - Upload, Edit and Delete dialogs open and close; Cancel is used, nothing mutated.
  - No horizontal overflow at 390 px. The footer has 0 links. No page errors.
- **Harness trap:** `waitForFunction` polls on rAF, which never fires in a background tab. Call `bringToFront()` or use `polling: <ms>`.

## Studio → Home page (owner request, 2026-11-15)

Owner: "an option to display 'the work' section in the homepage and to be able to change the description … change the homepage bg image and an option to download the current bg image."

- **Backend (`SiteContent`):** five new fields.
  - `heroImageUrl` and `heroImageAlt` (≤300). Defaults are the existing placeholder and its alt text.
  - `heroImageId`: the Cloudinary public_id of an uploaded hero. Never returned by the API.
  - `showWorkStatement`: a strict boolean, default true.
  - `workStatement` (≤1000): empty means "use bio paragraph 2", which is what Home showed before.
  - `PUT /api/site-content` type-checks every field (strings must be strings; the boolean must be a real boolean) and still picks fields explicitly.
  - The hero URL is **not** settable via PUT. It only changes through `POST /api/site-content/hero`, so it is always one of our own Cloudinary assets.
- **`POST /api/site-content/hero`:** `protect` then `upload.single('image')` (image-only, 25 MB), with a description (alt text) required.
  - The replaced hero is released from Cloudinary only after the new one is saved, and never the default placeholder.
  - A failed save releases the new upload.
- **Frontend:**
  - `Hero` takes its image as a prop: Cloudinary renditions at 1200/1800/2400, the placeholder used as is.
  - Home's statement goes through `workStatementFor()` and is `null` when switched off.
  - New Studio page `/admin/dashboard/home` ("Home page" in the sidebar):
    - Background photograph: preview; Replace (pick → preview → describe → "Use this photograph"); Download current (Cloudinary `fl_attachment:home_background`, i.e. the original file; the placeholder is fetched as a blob, with an open-in-tab fallback); description field.
    - The work: on/off switch (`role="switch"`), text with a counter, Save.
- **Checks (local backend, same Atlas DB):**
  - 15/15 pass. Bad types, overlong text, an operator object and missing tokens are all refused; `heroImageId` is hidden.
  - Toggle off: Home has no section. Toggle on with new text: Home shows it.
  - An upload without a description is refused. An upload with one makes the Home hero the Cloudinary asset with srcSet and the new alt.
  - Download saves the file: `home_background.jpg` from Cloudinary (header verified), `home-background.jpg` for the placeholder. No page errors.
  - **Restored afterwards:** the probe hero was released from Cloudinary and the new fields were unset, so the document is exactly as before (none of the fields existed).
- **Deploy note:** this needs the backend (Render) and the frontend (Vercel) both deployed from `main`. If the frontend lands first, every new field falls back to today's behaviour, so the order doesn't matter.

## Studio reorganisation (owner request, 2026-11-15)

Owner: "rework the pages and sections in the admin resource, decide what goes where."

**Decision.** Collections first, then the public pages by name.
- **Overview** (`/admin/dashboard`, new landing screen): "Needs attention", a three-column ledger (Photographs, Messages, Pages), the latest 3 messages, a Selected-work strip, and "Signed in as".
  - "Needs attention" lists, each with a link to fix it: demo hero, demo portrait, U+FFFD in the bio, nothing featured, empty gallery.
- **Photographs** (`/photos`, was "Gallery" at `/admin/dashboard`):
  - New **Featured** tab (right-aligned). It fetches all photos and keeps the starred ones; reorder still works on the subset (positions are permuted within the visible set).
  - `?filter=featured` deep-links to it. Un-starring a photo in that view removes it from the view.
- **Messages:** unchanged.
- **Pages → Home** (`/home`): background, "The work", plus a read-only **Selected work** section with "Choose in Photographs →". It sits below Save, which only covers the editable sections.
- **Pages → About** (`/about`, was "Account"): the About copy. The old `/admin/dashboard/account` redirects here. "Signed in as" moved to Overview.
- **Sidebar:** Overview / Photographs / Messages, then a "Pages" group (Home, About). At the foot: **View the site** (was "Back to site") and Sign out. The mobile sheet uses the same groups and now has View the site too.
- **Files:** moved with `git mv` (`DashboardClient` → `photos/PhotosClient`, plus PhotoCard/UploadModal/EditModal; `account/AccountClient` → `about/AboutClient`).
- **Checks:**
  - `tsc`, `eslint` and the build are clean.
  - Read-only puppeteer pass, 11/11:
    - Sign-in lands on Overview.
    - Sidebar order and groups are correct; every page shows the right title and current-page marker.
    - `/account` redirects to About.
    - `?filter=featured` shows 3 cards, matching the API's 3 featured.
    - No overflow at 390 px; no page errors.
  - Overview currently flags: the demo hero, the demo portrait, and U+FFFD in the bio.

## Sign-in photograph (owner request, 2026-11-15)

- Owner asked for "a random aesthetic image of the northern lights" on the sign-in page. It is now fixed instead of "first featured photo", so it no longer changes when photos are starred. The page also no longer waits on the backend.
- **Photo:** "Aurora borealis over Reine, Lofoten" by Johny Goerend, Unsplash (https://unsplash.com/photos/aurora-borealis-over-reine-lofoten-x3WQMj5QkEE).
  - **Unsplash License:** free to use, commercial included. Credit is shown anyway, bottom-right of the photo, linking out with `rel="noopener noreferrer"`.
  - Chosen from 5 free (non-premium) portrait candidates read from Unsplash's search JSON. Portrait fits the tall left panel.
- Served from `images.unsplash.com` at 800/1200/1600/2400 with `auto=format`; all sizes verified 200.
- **Phase D note:** the CSP (D1) must allow `img-src https://images.unsplash.com`.
- Verified: the image loads (800w chosen at 1440×900, DPR 1); the credit link is present; no page errors.
- **Swapped the same day.** The owner said Reine read "kind of bright and the northern lights are not in abundance".
  - Compared the free candidates by eye from downloaded previews: the Flakstad beach shot has the aurora filling the sky and mirrored in the water, with no town lights; Rafael Peier's cliffs are darker but have a single swirl; David Becker's forest has bright snow in the foreground.
  - Now **"Northern lights over Flakstad beach" by Johny Goerend** (https://unsplash.com/photos/northern-lights-over-flakstad-beach-U_diPCXCBxU), Unsplash License, credited.
  - Added a gentle 28% dark wash over the photo for a moodier panel. It is a solid darkening layer, not glass, and leaves the photo untouched.
  - Verified: all four sizes 200, loads at 1440×900, credit present, no page errors.

## Sign-in: a different photograph on every visit (owner request, 2026-11-15)

- Owner: cycle through ~10 images (northern lights, Edinburgh, Norway, F1, space, nature), then refined it to "every time i refresh a different image appears" and "high quality ones". So it is one photo per visit, not an auto-advancing slideshow (nothing moves while you sign in).
- **`src/app/admin/signInPhotos.ts`:** 10 Unsplash photos (Unsplash License; all checked `premium:false, plus:false`; credits read from Unsplash's photo JSON).
  - Northern lights ×2: Flakstad (Johny Goerend), Ylläsjärvi (Lucas Marcomini).
  - Edinburgh ×2: Victoria Street at dusk (jim Divine), skyline at sunset (Natalie Parham).
  - Norway ×1: fjord with ship (David Bottenberg).
  - F1 ×2: circuit at sunset (Baptiste Prat), vintage F1 car (Namito Yokota).
  - Space ×2: Milky Way over a lake (Thomas Ciszewski), Milky Way over rock formations (John Fowler).
  - Nature ×1: pine forest in fog (Liliia Liliia).
  - Chosen from 22 previewed candidates by eye for low-key tones. Rejected: bright daytime fjords, bright snow, sunny Edinburgh.
- **Quality:** q=85, srcSet 960/1400/1800/2400/3000 with `auto=format`. All 50 URLs verified 200. A 1440×900 DPR-2 screen gets the 1800 px file.
- **Mechanics:**
  - `/admin` is now per-request (`connection()`); the server picks with `crypto.randomInt`, so the chosen photo is in the first HTML.
  - The client remembers the last index in `localStorage` and steps to the next one if the pick repeats. This happens before the ~2.6 s fade-in completes, so it isn't visible. If storage is blocked, the random pick stands.
  - The dark wash dropped to 22%, since several photos are darker than Flakstad.
- **Verified:** 12 reloads gave 8 distinct photos and 0 back-to-back repeats; no errors or hydration warnings; screenshots checked.

## Text fields and busy buttons, site-wide (owner request, 2026-11-15)

- **Owner's screenshot:** browser autofill painted the sign-in email/password as pale-blue boxes with black text, and the "Signing in…" button went muddy grey. "Refine it properly across the website, any kind of text box."
- **One field design** for `.field` (Studio) and `.field-line` (Contact), shared in `globals.css`:
  - The hairline is an inset box-shadow that becomes a 2 px gold rule on focus (no layout shift). The caret is gold.
  - Hover brightens the line; invalid fields get a red line. Password dots get a little letter-spacing.
  - The label brightens while its field has focus (`div:has(> .field:focus) > label`).
- **Autofill fix:** the field is covered with an inset shadow in the surface colour (`--field-fill`: paper by default, card inside `.panel`). `-webkit-text-fill-color` is forced back to the ramp, and the UA background change is postponed indefinitely.
  - The rules are written as two selector lists; Lightning CSS folds `:-webkit-autofill` into the standard `:autofill`, which current Chrome, Edge, Safari and Firefox support. Verified in the built CSS.
- **Focus ring trap:** the site-wide `:focus-visible` outline is unlayered, so it beat the components-layer "no outline" rule on fields. The field exemption now lives next to it, unlayered.
- **Studio textareas** keep a faint well, now drawn with inset shadows (gold on focus).
- **Busy vs disabled buttons:** `aria-busy` is set on every working button (sign-in, contact send, About save, Home save/upload/download, Edit save, Upload, both deletes).
  - `.btn[aria-busy=true]:disabled` keeps full colour with `cursor: progress`; the primary dims slightly to #d9d3c9.
  - A genuinely unavailable button (Upload with no file) fades to 45%.
- **Verified with screenshots and computed styles:**
  - Sign-in: empty, focused, filled, and busy (login request held, never sent).
  - Contact: focus moves the gold rule and the label brightens.
  - Studio: About and the Upload dialog.
  - Busy button opacity is 1; unavailable is 0.45. No errors.

## Title case for headings (owner request, 2026-11-15)

- Owner: capitalise the second word of titles (e.g. "Sign in" → "Sign In"), everywhere.
- **Applied standard title case:** main words capitalised; a/an/the/and/but/or/for/nor/at/by/in/of/on/to/as/up stay lower-case unless first.
- **Public pages:** Say Hello; Selected Work; Nothing in This Frame (404); The Darkroom Door Is Stuck (error); The Gallery Couldn't Load; No Photographs Yet; `No {Category} Photographs Yet`.
- **Studio:** Sign In; The Site at a Glance; Needs Attention; Latest Messages; Selected Work on Home; Background Photograph; The Work; Selected Work; The About Page; No Messages Yet; Nothing Featured Yet / No Photographs Yet; dialog titles Upload Photo, Edit Photo, Delete Photo?, Delete Message?.
- **Deliberately unchanged:** button labels and sentences; the owner's own About heading (content they edit); small-caps labels (already all capitals on screen); single-word titles.
- A sweep of every `<h1>`–`<h4>`, StudioModal/Notice/StudioTopBar title finds no lower-case main word left. tsc, eslint and the build are clean.

## Sign-in photos: shuffle bag (owner request, 2026-11-15)

- Owner: once a photo is shown it isn't eligible again until every photo has been shown; then all are available again.
- **`src/app/admin/photoBag.ts`** (pure):
  - `parseBag()` validates the stored state, since localStorage is untrusted: integers in range only, de-duplicated, anything else becomes an empty bag.
  - `drawFromBag()` keeps the server's random pick if it's still unseen, otherwise draws randomly from the unseen photos.
  - When the bag is full it starts a new round, excluding the photo just shown, so there's no back-to-back repeat at the changeover.
- **SignInClient** stores `{seen, last}` under `studio-signin-bag` and removes the previous scheme's key.
  - The draw runs on mount, while the "checking your session" screen is up, so the photo is never redrawn after it appears.
  - If storage is blocked, the server's random pick stands.
- **Verified:**
  - Simulation of 10,000 visits (node, strip-types): 0 rounds without all 10 distinct, 0 back-to-back repeats, every photo shown exactly 1,000 times. Corrupt and tampered storage is cleaned safely.
  - Real browser, 21 refreshes: round 1 had 10/10 distinct, round 2 had 10/10 distinct, refresh 21 started round 3. 0 back-to-back repeats, 0 photo changes after paint, no errors.
- **Live (2026-11-15).** Merge `96209752` was built by Vercel only as a **Preview**, with no Production deploy, because `main` and `redesign/unslop` received the same commit seconds apart. An empty commit `85aad547` pushed to `main` alone triggered Production (40 s).
  - Live check, 11 refreshes: 10/10 distinct, then a new round; bag stored as `studio-signin-bag`; no errors.
  - **Trap for future merges:** push `main`, wait for the Production deployment, *then* fast-forward and push the branch. Check GitHub's deployments API for `environment: Production`, not just the commit status.

### 2026-11-15 — Hero title: focus pull replaces the light sweep

The band of light that swept across the title after the letters landed read as a pale box over the photograph (owner's screenshot). Removed it. The title now pulls into focus while the letters develop: it starts at 0.09em letter-spacing and draws in to its set -0.015em over 2.6s. Turned off at ≤40rem: on a phone the title only just fits one line, and any wider start wrapped it to two and then jumped back (measured at 360px). The letters still develop there. Checked at 320/360/375/390/430/640/641/768/1440: no layout jump, no overflow, no errors. Reduced motion turns it off.

Then, in the sweep's old slot: a **safelight ripple**. Once the title has settled, each letter warms to amber (#e9b779) and cools back to the paper white, staggered 75ms left to right, 1.1s per letter. Colour only, inside the glyphs, so nothing is drawn over the photograph. It starts after the focus pull has finished (measured in a foreground tab: spacing final at 2.9s, first colour change after that) and ends with every letter back at rgb(236 230 220). Runs on phones too; reduced motion turns it off (`.hero-title .char` is already in the list).

Then the owner asked for "something glassy" and a shorter wait. The amber ripple is replaced by a **glass glint**: each letter's fill is a gradient clipped to the glyph (`background-clip: text`), with a soft refraction shadow, then a bright specular edge with a faint cool fringe, passing left to right, staggered 70ms per letter. It stays inside the letterforms, so no glass surface sits over the photograph. The glint now starts at **2.0s** (was 2.9s). To have the title settled by then, the letters develop faster (1100ms, stagger 45ms, from 300ms) and the focus pull runs 1.7s from 250ms. Measured with frozen frames: at 1.99s every letter is sharp and in place and the spacing is final. Each letter's box gets padding plus a matching negative margin, because the clipped fill otherwise cut the "g" descender. Title box unchanged (295–1145 at 1440). Without `background-clip: text` support the letters stay plain `--color-fg`. Capture trap: puppeteer `clip` screenshots resize the viewport (captureBeyondViewport), which changes the vw-based title size. Use `captureBeyondViewport:false`.

The glint was "too feeble". Replaced it with a **lens split** (chromatic aberration). At 2.0s each letter splits into red and cyan fringes (`text-shadow` ±0.07em at 0.85 alpha) with a 4% scale bump, swings back once, and snaps to one sharp print. It ripples left to right at 55ms per letter, about 950ms per letter, and is finished by about 3.6s. The glyph clipping and its padding hack are gone: the letters are plain `--color-fg` again. Frozen frames: settled at 1.99s, split mid-ripple at 2.5s, clean at 5s (identity transforms, title box 295–1145 at 1440). Reduced motion turns it off.

The lens split was "not a techfest website". Replaced it with a **swell**: from 2.0s the letters lift 0.12em one after another, brightening slightly to #fffaf2 at the top, and settle back. It's like a slow ripple across the still water in the hero photo. 1.4s per letter, 80ms stagger, finished by about 4.4s. Frozen frames show a clear wave at 2.9s and identity transforms at 5s. Title box unchanged, and no layout change at any of the nine widths. Reduced motion turns it off.

**Settled.** The owner rejected the swell and then a set of switchable candidates (exposure, depth, shutter, focus lock). They kept the **gold hairlines**: two 1px rules draw out from either side of the eyebrow at 2.0s and stay at 0.7 opacity. The hairlines are hidden at ≤30rem, because between 360 and 430px they pushed the eyebrow onto two lines (measured). For the title they asked for the amber idea back, "like the sweep but using the letters". Final: a **safelight sweep**. From 2.0s each letter warms to #f2a65a, passes through #f4d2a8 and cools to `--color-fg`, 1.3s per letter, with a tight 38ms stagger. Neighbours overlap, so it reads as one travelling band of warm light inside the glyphs. Finished by about 3.8s. Frozen frames: band mid-title at 2.55s, all letters back to plain white at 6s. The temporary `#fx-*` switch is removed. Reduced motion turns off both the sweep and the hairlines.


## Phase D: Security (owner: "proceed with phase d", 2026-11-15)

Owner answers for D10: **no watermark**; **hide image URLs** from right-click and drag.

**Audit findings, before fixing:**
- `GET /api/photos` returned every photo's raw `secure_url`, the full-size **original**, to anyone.
- Login skipped bcrypt for an unknown email (the timing showed which emails exist).
- Contact accepted any type and any length.
- `connectDB` exited on failure (crash loop).
- The purge action was callable by anyone.
- npm audit: backend 7 (2 critical: mongoose, proxy-addr); frontend 5 (Next critical).

**What changed:**
- **D1**, `next.config.ts`:
  - CSP: `default-src 'self'`, no third-party scripts, `object-src`/`frame-src 'none'`, `frame-ancestors 'none'`, `base-uri`/`form-action 'self'`, connect only to self and the API.
  - Also nosniff, `X-Frame-Options DENY`, Referrer-Policy, Permissions-Policy, HSTS, COOP, and `poweredByHeader: false`.
  - Trade-offs: `script-src` keeps `'unsafe-inline'`, because a nonce CSP forces every page dynamic and loses ISR. `img-src https:`, because the About portrait is a free-text URL.
- **D2**, Express: `x-powered-by` off; CSP `default-src 'none'`, nosniff, DENY, `no-referrer` and HSTS on every response; `trust proxy` 1; JSON bodies capped at 100 kB.
- **D3**:
  - Login: 5 per 15 min per IP. Contact: 5 per hour per IP. In memory (`middleware/rateLimit.js`), with `Retry-After`.
  - bcrypt runs against a dummy hash for an unknown email (measured 532 ms vs 528 ms).
  - Email capped at 254 characters and password at 200.
- **D4**:
  - Contact: strings only, trimmed, caps 100/254/5000 in the route and the model.
  - Honeypot field `website` (off-screen, `tabIndex -1`, `aria-hidden`): a filled one gets a 201 and stores nothing.
  - POST answers with an acknowledgement, not the stored document.
  - `aboutImageUrl` must be `https:`.
- **D5**: JWT 30 days → **7 days**; `algorithms: ['HS256']` pinned on verify (an `alg:none` token is rejected). Follow-up, not done: an httpOnly cookie needs the API and site on one domain.
- **D6**:
  - Backend: `npm audit fix` → 0 vulnerabilities.
  - `multer-storage-cloudinary` (unmaintained, pinned to the vulnerable Cloudinary v1) replaced by multer memory storage plus an explicit `upload_stream`. Cloudinary SDK 1 → 2.
  - Frontend: Next 16.2.12 → **16.4.6** and eslint-config-next to match; 0 vulnerabilities.
- **D7**: `connectDB` retries with backoff (5 s doubling, capped at 5 min) instead of exiting. `/api/health` → `{status:'ok', db:'connected'|...}`, still 200.
- **D9**: `revalidatePublicPages(token)` purges only after `GET /api/auth/me` (new) accepts the token. Every Studio caller passes it.
- **D10**, image protection:
  - New uploads are stored as Cloudinary `authenticated` assets: no public URL, and any unsigned or edited URL answers 401.
  - The API's `toJSON` drops `imageUrl`/`cloudinaryId` and sends `images`: signed `c_limit,f_auto,q_auto` URLs at 320–2400 px. Same for an uploaded hero (`heroImages`).
  - Studio "Download current" goes through `GET /api/site-content/hero/download` (`protect`), which returns a 5-minute private download link.
  - Global `img { pointer-events:none; user-select:none; -webkit-user-drag:none; -webkit-touch-callout:none }`: no "Save image as", copy, open-in-tab, drag or long-press save on any photo.
  - `data.ts` falls back to the old fields if the API hasn't deployed yet.
  - Existing photos remain public `upload` assets until `node --env-file=.env scripts/protectImages.js --apply` runs (dry run without `--apply`; `--revert` undoes it). It must run **after** Render has the new backend.
  - Note: for an `authenticated` asset, the stored `secure_url` is itself a working signed link to the original. It stays in the DB and must never be returned by any route.

**Limits, stated plainly:** anything a browser shows can still be screenshotted or taken from the network tab. Nothing on the web prevents that. What someone can get now is a compressed display copy (≤2400 px, metadata stripped), never the original.

**Verified (local backend on the real Atlas/Cloudinary, production build at :3000):**
- 21/21 API assertions, among them: originals hidden; six signed widths; signed URL serves; `alg:none` rejected; owner download 401 without a token; `javascript:` and `http:` portraits refused; object or overlong contact fields refused; honeypot stored nothing (contacts 2 → 2); the 6th contact and 6th login give 429; a 200 kB body gives 413.
- Probe photo, uploaded and deleted through the real routes: stored `authenticated`; signed 1200 → 200; `w_4000` edit → 401; signature stripped → 401; `f_auto` swapped → 401; public `upload` path → 404; deleted → 404.
- Probe hero: signed `heroImages` only; owner download → 200 attachment. Restored to the placeholder: a first restore wrote `heroImageUrl: null` (the field had been absent), corrected by unsetting it; the live API is back on the placeholder.
- Browser sweep of `/`, `/work`, `/about`, `/contact`, `/lightbox/:id`, `/admin` and three Studio pages: all headers present; **0 CSP violations**; 0 console errors; 0 broken images; every Cloudinary image signed; **0 visible photos hit-testable**.
- lint 0 errors, `tsc` clean, build OK.

**Live (merge `54996aca`):**
- Vercel Production succeeded and Render picked up the new API (`/api/health` reports `db`).
- The live API sends no `imageUrl`/`cloudinaryId`, and the live headers are as above.
- Live sweep of every route: 0 CSP violations, 0 broken images, 0 hit-testable photos; the Studio loads all thumbnails.

**Migration (owner approved, 2026-11-15):** `scripts/protectImages.js --apply` → 6 moved, 0 failed.
- All 6 pre-migration public original URLs now answer **404**.
- The new signed `authenticated` URLs answer 200.
- After the 60 s ISR refresh, `/work` serves only `/image/authenticated/` addresses, and the live sweep is still clean.
- Undo: `scripts/protectImages.js --revert`.

**Owner action:**
- **D8:** set a strong admin password.

## Studio → Account: change the sign-in email and password (owner request, 2026-11-15)

- **Backend:**
  - `PUT /api/auth/credentials` (`protect`, plus its own 5-per-15-min limiter). Body `{ currentPassword, email?, newPassword? }`.
  - The current password is always re-checked; a wrong one answers **403, not 401**, so a typo doesn't sign the owner out.
  - New password: 12–200 characters; can't be the current one; can't contain the email's name. Email: valid and ≤254; 409 if taken.
  - Any change bumps `AdminUser.tokenVersion`. Tokens now carry `v`, and `protect` refuses a stale one, so every other session is signed out. The caller gets a fresh token. Tokens from before this change carry no `v` and count as version 0, so deploying signs nobody out.
- **Studio:**
  - `/admin/dashboard/account` (was a redirect to About) is now **Account** under a new "Settings" group in the sidebar.
  - Fields: email, new password plus confirmation, current password (`autocomplete` set for password managers).
  - `useAdminToken` gained `updateSession(token, email)`.
- **Verified** against the local backend on the real DB, using a **temporary admin account** that was created and then deleted. The owner's account was never changed (only read).
  - Wrong current password → 403. Short, same and email-containing passwords → 400. Someone else's email → 409. 6th attempt → 429.
  - Through the real page, twice: saved in ~1.7 s; the browser holds the new token and email; this session carries on; both other sessions → 401; the new credentials sign in; the Studio stays usable; 0 page errors.
  - A version-less token for the owner → 200.
  - Test-harness notes: a role=status check matched the Studio's boot screen (scope it to the form). The login limiter correctly tripped on the 6th test login.


## Phase E: Close-out (owner: "go on whatever tasks are left and push", 2026-11-16)
- **E1:**
  - Live sweep: 13 routes × 4 widths (390/768/1024/1440) = 52 page views, 95 images.
  - 0 overflow, 0 broken images, 0 console/CSP errors. 404 → 404; all Studio pages load signed in.
  - Screenshots in `design-reference/redesign-after/` (local, gitignored).
  - **Found and fixed:** the Account page's email box was blank when localStorage had no `admin_email`. It now reads `GET /api/auth/me` (verified with storage cleared).
- **E2:**
  - `context.md` gained a "Current state" section that supersedes its older sections: stack as built (no Framer Motion), the Studio layout, every decision made since the stage plan, and the owner to-dos.
  - AGENTS.md and HANDOFF.md are updated locally (both gitignored).
- **E3:** skipped at the owner's request (no vault note).
- **E4:** satisfied throughout; every step was merged to `main` and checked live.

**The redesign is complete.** Owner to-dos:
- A strong password (Studio → Account).
- A real hero photo and About portrait.
- Star photos for Selected Work.
