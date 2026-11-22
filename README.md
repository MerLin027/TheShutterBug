# The Shutter Bug

A photography portfolio with a private admin area for managing the gallery.
Dark, glass-accented, and built so the photographer never has to touch code to
publish a photograph.

**Live:** [the-shutter-bug.vercel.app](https://the-shutter-bug.vercel.app)
**API:** [theshutterbug.onrender.com](https://theshutterbug.onrender.com)

---

## What it does

### Public site

- **Home** — parallax hero over the photographer's own work, and a *Selected
  Frames* section driven by whichever photos are flagged featured in the Studio.
- **Gallery** (`/work`) — masonry grid with category filters (Nature, Objects,
  Monochrome, Urban). Photo order is whatever the photographer dragged it into.
- **Lightbox** (`/lightbox/[id]`) — full-bleed single photo with keyboard
  navigation (`←` `→` `Esc`). Prev/next stay inside the active filter, and the
  filter survives closing back to the gallery.
- **About** — copy and portrait are editable from the Studio, not hardcoded.
- **Contact** — writes to the database with client- and server-side validation.
- A styled 404 rather than the framework default.

### Studio (`/admin`)

JWT-protected, single admin user.

- **Gallery** — upload with drag-and-drop, edit metadata, delete, toggle
  *featured*, and drag to reorder. Reordering permutes the positions the visible
  set already holds, so dragging inside a filtered category can't collide with
  photos that aren't on screen.
- **Messages** — contact submissions, newest first, expandable, deletable.
- **Account** — edit the About page's quote, bio and portrait URL.

Every mutation revalidates the affected public pages, so changes appear
immediately rather than after the ISR window.

---

## Tech

**Frontend** — Next.js 16 (App Router, Turbopack) · React 19 · TypeScript ·
Tailwind CSS v4 · dnd-kit · deployed on Vercel (all animation is CSS)

**Backend** — Express 5 · Mongoose 9 · MongoDB Atlas · Cloudinary · JWT ·
deployed on Render

Public pages are Server Components that fetch through `src/lib/data.ts` with a
60-second revalidation window, purged at once when the Studio changes
something. The Studio is client-rendered; it asks `GET /api/auth/me` whether
it is signed in, because the session is an httpOnly cookie that no script can
read.

---

## API

| Method | Route | Access |
|---|---|---|
| `GET` | `/api/photos` | public — optional `?category=` |
| `GET` | `/api/photos/:id` | public |
| `POST` | `/api/photos` | admin — multipart, field `image` |
| `PUT` | `/api/photos/reorder` | admin — bulk position update |
| `PUT` | `/api/photos/:id` | admin |
| `DELETE` | `/api/photos/:id` | admin — removes the Cloudinary asset too |
| `POST` | `/api/contact` | public |
| `GET` | `/api/contact` | admin |
| `DELETE` | `/api/contact/:id` | admin |
| `POST` | `/api/auth/login` | public — sets the session cookie |
| `GET` | `/api/auth/me` | admin — who is signed in |
| `PUT` | `/api/auth/credentials` | admin — change email/password (current password required) |
| `GET` | `/api/auth/sessions` | admin — how many browsers are signed in |
| `POST` | `/api/auth/logout` | admin — ends this session on the server |
| `POST` | `/api/auth/logout-all` | admin — ends every session |
| `GET` | `/api/site-content` | public |
| `PUT` | `/api/site-content` | admin |
| `POST` | `/api/site-content/hero` | admin — multipart, fields `image`, `alt` |
| `GET` | `/api/site-content/hero/download` | admin — 5-minute private link to the stored hero |
| `GET` | `/api/health` | public — no DB call; reports the DB connection state |

**Sessions.** The browser reaches the API through the site's own domain:
`next.config.ts` rewrites `/api/*` to the Render service, so the session can
be an `__Host-` cookie that is `HttpOnly`, `Secure` and `SameSite=Strict`. It
is never in a response body or in browser storage, and `Authorization: Bearer`
headers are not accepted. Each session is recorded on the server: signing out
ends it at once, a day without use ends it, and it lasts 7 days at most. Any
request that changes something must come from the site itself (other origins
get 403), and the API sends no CORS headers, so no other website can read its
responses. There is no public registration route, by design: the single
admin is seeded from the CLI.

---

## Running it locally

You'll need Node 22, a MongoDB Atlas connection string, and a Cloudinary
account.

### Backend

```bash
cd backend
npm install
cp .env.example .env     # then fill it in
npm run dev              # http://localhost:5000
```

`backend/.env`:

```
NODE_ENV=development
PORT=5000

MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/shutterbug
JWT_SECRET=<a long random string>

CLOUDINARY_CLOUD_NAME=<...>
CLOUDINARY_API_KEY=<...>
CLOUDINARY_API_SECRET=<...>

# Only for scripts/seedAdmin.js; don't keep these in a hosted dashboard.
ADMIN_EMAIL=<...>
ADMIN_PASSWORD=<...>

# Optional locally; required on Render (same value as on Vercel).
PROXY_KEY=<a long random string>
```

`MONGODB_URI` and `JWT_SECRET` are required — the server exits at boot without
them rather than failing later in a way that's hard to trace. Missing Cloudinary
credentials only warn, since reads still work; the server also pings Cloudinary
once at startup so bad credentials show up in the log instead of surfacing as a
mysterious upload failure days later.

Create the admin user once:

```bash
node scripts/seedAdmin.js
```

### Frontend

```bash
npm install
cp .env.example .env.local   # then fill it in
npm run dev              # http://localhost:3000
```

`.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

> The site proxies `/api/*` to `NEXT_PUBLIC_API_URL`, so the Studio works
> against a local backend with no extra setup. A real environment variable
> overrides `.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:5000 npm run dev`.
> The backend accepts state-changing requests from `http://localhost:3000`
> only when `NODE_ENV` isn't `production`.

### Checks

```bash
npx eslint src backend
npx tsc --noEmit
npm run build
```

---

## Structure

```
src/
  app/
    page.tsx                    home
    work/                       gallery + client-side filter state
    about/  contact/            public pages
    lightbox/[id]/              single-photo view
    admin/                      Studio login
    admin/dashboard/            gallery, upload/edit modals, photo cards
    admin/dashboard/messages/   contact inbox
    admin/dashboard/account/    About-page editor
    admin/actions.ts            revalidation Server Action
  components/                   nav, footer, hero, reveal, Studio chrome
  lib/
    api.ts                      the backend base URL, in one place
    data.ts                     server-side fetches + API→UI adapter
    categories.ts               the category vocabulary
    useAdminToken.ts            session read (effect-based, SSR-safe)

backend/
  server.js
  config/                       env validation, DB, Cloudinary + upload limits
  middleware/                   JWT guard, central error handler
  models/                       Photo, Contact, SiteContent, AdminUser
  routes/                       photos, contact, auth, siteContent
  scripts/seedAdmin.js
```

---

## Deployment

The frontend deploys to Vercel from `main`. The backend deploys to Render from
`backend/` (see `render.yaml`).

Two things worth knowing:

- **Environment variables on both hosts are set in their dashboards.** A git push
  cannot carry a credential change to production.
- **`PROXY_KEY` must hold the same value on Vercel and Render.** The site's
  proxy (`src/proxy.ts`) passes on the visitor's address with it, and the API
  only trusts that address (for its rate limits) when the key matches.
- **Render's free tier idles.** Nothing keeps it awake, so the first request
  after ~15 quiet minutes waits for a cold start (up to about 30 seconds); the
  Studio and the contact form say so while they wait.

---

Built by [MerLin027](https://github.com/MerLin027).
