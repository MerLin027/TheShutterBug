# Photography Portfolio — Build Spec

## Project Summary
Build a personal photography portfolio website for a nature/object photographer (minimal human subjects — occasional people in frame, not the focus). Subject matter: landscapes, seascapes, empty urban scenes, objects, monochrome street/transit shots (e.g. a sunset over Juhu beach with a single boat centered in the water; B&W train station platforms; roads; horizons; Marine Drive; cats). Aesthetic: dark mode, Apple-style "Liquid Glass" UI accents, editorial minimalism. Must include an authenticated admin mode to add/edit/reorder/delete photos without touching code.

## Design Philosophy (non-negotiable)
- Photography is the hero. UI is an invisible frame — minimalism, negative space, no visual competition with the images.
- Dark theme base: near-black (`#0a0a0a`–`#121212`), not pure `#000`.
- Liquid glass effect is used ONLY on UI chrome (nav bar, filter pills, lightbox controls, admin toolbar) — NEVER as an overlay directly on top of a photo. Glass panels should sit in negative space or over blurred/dimmed backdrop areas, not compete with image contrast.
- Large-scale, restrained typography (one strong sans-serif, e.g. a Helvetica Now / Inter / Neue Montreal style face for headers). 1–2 accent colors max; let photo color do the work.
- Masonry/staggered grid, not uniform squares — respect varied aspect ratios (wide horizon shots, portrait cat photos, square objects).
- Smooth scroll-triggered fade/slide-up on images entering viewport. No jarring page loads — use fluid route transitions.

## Tech Stack
- **Frontend:** Next.js (App Router), Tailwind CSS, Framer Motion for scroll/transition animations
- **Backend:** Node.js + Express, MongoDB (Atlas)
- **Image hosting:** Cloudinary — auto WebP/AVIF conversion, responsive transforms, lazy loading via `next/image` + Cloudinary loader
- **Auth:** JWT-based admin auth (single admin user, no public signup)
- **Drag-and-drop reordering:** `dnd-kit`
- **Masonry layout:** `react-masonry-css` (or CSS-native masonry if `masonry-auto-flow` support is reliable at build time — verify before committing)
- **Deployment:** Frontend → Vercel, Backend → Render, DB → MongoDB Atlas

## Liquid Glass Implementation
- Use `backdrop-filter: blur()` + `-webkit-backdrop-filter` fallback for base glass.
- For true refraction/edge distortion (optional stretch goal, not required for v1): SVG `feDisplacementMap` + `feTurbulence` + `feSpecularLighting` filter referenced via `backdrop-filter: url(#glass-filter)`, with a plain-blur fallback for Safari where `url()` backdrop-filter support is inconsistent.
- Reference implementation to study/adapt (not copy verbatim): github.com/nikdelvin/liquid-glass — pure CSS/SVG recreation of iOS 26 Liquid Glass, includes Safari fallback logic.
- Apply glass to: sticky nav bar, category filter pill row, lightbox control bar (close/next/prev/info), admin toolbar. Test text contrast on glass against both darkest and brightest photos in the set — add subtle text-shadow if needed for WCAG contrast.
- Keep glass instances to a small, fixed set of persistent elements — do not apply per-card or per-scroll-trigger (GPU cost stacks fast with high-res photography already on the page).

## Site Structure / Pages
1. **Home** — full-screen or large hero (one striking photo, possibly the boat/sunset shot), then masonry showcase of 15–25 best images across categories.
2. **Work/Gallery** — full masonry grid, category filter pills (Nature, Objects, Monochrome, Urban/Transit — client-side filter, no reload), click-through to lightbox.
3. **Lightbox** — full-screen distraction-free image view, glass control bar, keyboard nav (arrow keys), swipe on mobile.
4. **About** — short bio/philosophy, one atmospheric self-portrait or behind-the-scenes shot.
5. **Contact** — minimal form (name/email/message), no booking system needed.
6. **Admin** (`/admin`, JWT-gated login):
   - Upload new photo (drag-drop to Cloudinary, add category/tags/caption/location)
   - Edit existing photo metadata
   - Reorder via drag-and-drop (writes `position` field back to DB)
   - Delete photo
   - Toggle `isFeatured` (controls homepage showcase inclusion)

## Data Schema (MongoDB)
```
Photo {
  _id
  imageUrl          // Cloudinary URL
  cloudinaryId       // for deletion
  category          // "nature" | "objects" | "monochrome" | "urban"
  tags              // array of strings
  caption           // optional
  location          // optional, e.g. "Juhu Beach"
  position          // integer, controls sort order within category/home
  isFeatured        // boolean, homepage inclusion
  aspectRatio       // stored on upload for masonry layout calc
  createdAt
}

AdminUser {
  _id
  email
  passwordHash
}
```

## API Endpoints
```
POST   /api/auth/login
GET    /api/photos               // public, filterable by ?category=
GET    /api/photos/:id
POST   /api/photos                // admin only
PUT    /api/photos/:id            // admin only
PUT    /api/photos/reorder        // admin only, bulk position update
DELETE /api/photos/:id            // admin only
```

## Performance & Accessibility Requirements
- Images served via Cloudinary at max 2400–2560px wide, WebP/AVIF, lazy-loaded below the fold.
- Alt text required on every photo (use caption/location as fallback).
- Keyboard-navigable lightbox and gallery.
- High contrast on all text sitting over glass/photo backgrounds — test against WebAIM contrast checker.
- Mobile: masonry collapses to 1–2 columns, glass elements simplified (reduce blur radius if needed for low-end GPU performance), lightbox touch targets large enough for thumb use.

## Out of Scope for v1
- E-commerce/print sales
- Client proofing galleries
- Booking/scheduling system
- Blog