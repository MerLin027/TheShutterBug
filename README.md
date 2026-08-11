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
Tailwind CSS v4 · Framer Motion · dnd-kit · deployed on Vercel

**Backend** — Express 5 · Mongoose 9 · MongoDB Atlas · Cloudinary · JWT ·
deployed on Render

Public pages are Server Components that fetch through `src/lib/data.ts` with a
60-second revalidation window; the Studio is client-rendered because its auth
state lives in `localStorage`.

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
| `POST` | `/api/auth/login` | public |
| `GET` | `/api/site-content` | public |
| `PUT` | `/api/site-content` | admin |
| `GET` | `/api/health` | public — no DB call, used by the keep-alive ping |

Admin routes take `Authorization: Bearer <token>`. There is no public
registration route, by design — the single admin is seeded from the CLI.

---

## Running it locally

You'll need Node 20+, a MongoDB Atlas connection string, and a Cloudinary
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

ADMIN_EMAIL=<...>
ADMIN_PASSWORD=<...>
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
npm run dev              # http://localhost:3000
```

`.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

> If `.env.local` points at the deployed API, a real environment variable
> overrides it — `NEXT_PUBLIC_API_URL=http://localhost:5000 npm run dev` — which
> is the quickest way to exercise the Studio against a local backend. CORS
> allows `localhost:3000` only when `NODE_ENV` isn't `production`.

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
- **Render's free tier idles.** An external cron ping to `/api/health` every 10
  minutes keeps it warm; a cold start still takes tens of seconds.

---

## Project notes

`context.md` is the project's build record — what each phase and stage changed,
and the reasoning behind decisions that aren't obvious from the code. It's worth
reading before making structural changes.

---

Built by [MerLin027](https://github.com/MerLin027).
