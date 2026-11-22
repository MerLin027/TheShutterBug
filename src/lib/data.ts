// ---------------------------------------------------------------------------
// data.ts — server-side API client for the public pages.
//
// Runs in Server Components only. Every fetch here:
//   - goes through apiFetch(), so it carries a timeout and a cache tag;
//   - reports failure as `failed: true` rather than as an empty result.
//
// That second point is the one that matters. Until the redesign, a dead
// backend and an empty collection produced the same `[]`, and the site said
// "No photos yet" during a database outage. A visitor (and the owner) could
// not tell an empty portfolio from a broken one.
// ---------------------------------------------------------------------------

import { API_URL } from "@/lib/api";
import { GALLERY_FILTERS } from "@/lib/categories";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Raw shape returned by the Express API (mirrors the Mongoose schema). */
export type ApiPhoto = {
  _id: string;
  /**
   * Signed, size-capped delivery URLs keyed by width ("320" … "2400")
   * (Phase D10). The API no longer sends the stored original's URL or id.
   */
  images?: ImageSet | null;
  /** lowercase enum: 'nature' | 'objects' | 'monochrome' | 'urban' */
  category: string;
  tags: string[];
  caption: string;
  location: string;
  position: number;
  isFeatured: boolean;
  /** width / height, e.g. 0.75 for portrait 3:4 */
  aspectRatio: number;
  createdAt: string;
  updatedAt: string;
};

/** Width ("320", "800", …) → signed delivery URL. */
export type ImageSet = Record<string, string>;

/**
 * Editable About-page copy, served by GET /api/site-content.
 * `bio` holds paragraphs separated by a blank line.
 */
export type SiteContent = {
  quote: string;
  bio: string;
  aboutImageUrl: string;
  /** Home hero photograph (Studio → Home page). For an uploaded hero the API
   *  sends `heroImages` (signed sizes) instead; this is the placeholder. */
  heroImageUrl: string;
  heroImages?: ImageSet | null;
  heroImageAlt: string;
  /** Home's "The work" section: shown or not, and its text ("" = use bio ¶2). */
  showWorkStatement: boolean;
  workStatement: string;
};

/** Normalised shape used by all frontend components. */
export type Photo = {
  id: string;
  /** Full view (lightbox): format/quality-optimised, capped at 2400px wide. */
  src: string;
  /** Grid view: ~800px wide. Use with `srcSet` + a `sizes` attribute. */
  thumb: string;
  /** Responsive candidates for grid cards. */
  srcSet: string;
  alt: string;
  /** width / height, as stored. */
  ratio: number;
  /** The owner's caption, or "" when none was given. */
  caption: string;
  /** Caption if present, else the category — for alt text and the lightbox. */
  title: string;
  location: string;
  year: string;
  category: "Nature" | "Objects" | "Monochrome" | "Urban";
  isFeatured: boolean;
};

/** A list fetch. `failed` distinguishes "backend unreachable" from "empty". */
export type PhotoList = { photos: Photo[]; failed: boolean };

// ---------------------------------------------------------------------------
// Fetch plumbing
// ---------------------------------------------------------------------------

/**
 * Ceiling for any one request to the API. Generous on purpose: a Render free
 * instance waking from idle legitimately takes 20–50 s. The point is that a
 * ceiling exists. A fetch that hangs never rejects, so without one a stalled
 * backend hung the page instead of reaching the fallback path. It was 20 s
 * until 2026-11-21, shorter than the 32.7 s cold start measured that day,
 * so a cold API turned into the gallery's error state.
 */
const FETCH_TIMEOUT_MS = 45_000;

/** Revalidation window for every public fetch, in seconds. */
const REVALIDATE_SECONDS = 60;

/**
 * Cache tags. `updateTag()` in admin/actions.ts expires these on every Studio
 * mutation, which is what makes an edit or delete show up immediately on
 * every page that fetched the data — including /lightbox/[id], which no path
 * revalidation reached before.
 */
export const PHOTOS_TAG = "photos";
export const SITE_CONTENT_TAG = "site-content";

function apiFetch(path: string, tag: string): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    next: { revalidate: REVALIDATE_SECONDS, tags: [tag] },
    // Opts out of per-render memoisation only — the data cache still applies.
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
}

// ---------------------------------------------------------------------------
// Signed delivery sets (Phase D10)
//
// The API sends every photo as `images`: signed, size-capped renditions keyed
// by width. The pre-D10 fallback that rewrote a raw Cloudinary URL
// (cloudinaryUrl, cloudinarySrcSet) was removed in the 2026-11-21 audit: the
// API strips imageUrl from every response, so it never ran.
// ---------------------------------------------------------------------------

/** The signed widths in a set, ascending. */
function widthsOf(set: ImageSet): number[] {
  return Object.keys(set)
    .map(Number)
    .filter((w) => Number.isFinite(w) && w > 0)
    .sort((a, b) => a - b);
}

/** The smallest signed width that covers `width` (else the largest there is). */
export function pickImage(set: ImageSet, width: number): string {
  const widths = widthsOf(set);
  const w = widths.find((x) => x >= width) ?? widths[widths.length - 1];
  return w === undefined ? "" : set[String(w)];
}

/** `srcset` from a signed set, limited to `min`…`max` px. */
export function imageSetSrcSet(set: ImageSet, min = 0, max = Infinity): string {
  return widthsOf(set)
    .filter((w) => w >= min && w <= max)
    .map((w) => `${set[String(w)]} ${w}w`)
    .join(", ");
}

/** One rendition of a photo, for the Studio's own thumbnails and previews. */
export function photoImage(photo: Pick<ApiPhoto, "images">, width: number): string {
  return photo.images ? pickImage(photo.images, width) : "";
}

// ---------------------------------------------------------------------------
// Adapter helpers
// ---------------------------------------------------------------------------

/** Capitalise the first letter so DB "nature" → "Nature". */
function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const CATEGORY_MAP: Record<string, Photo["category"]> = {
  nature: "Nature",
  objects: "Objects",
  monochrome: "Monochrome",
  urban: "Urban",
};

/** Convert a raw API document to the normalised Photo type. */
function toPhoto(raw: ApiPhoto): Photo {
  const ratio = Number.isFinite(raw.aspectRatio) && raw.aspectRatio > 0 ? raw.aspectRatio : 1.5;
  return {
    id: raw._id,
    src: raw.images ? pickImage(raw.images, 2400) : "",
    thumb: raw.images ? pickImage(raw.images, 800) : "",
    srcSet: raw.images ? imageSetSrcSet(raw.images, 480, 1200) : "",
    alt: raw.caption || `${capitalise(raw.category)} photograph`,
    ratio,
    caption: raw.caption?.trim() ?? "",
    title: raw.caption || capitalise(raw.category),
    location: raw.location || "",
    year: raw.createdAt ? new Date(raw.createdAt).getFullYear().toString() : "",
    category: CATEGORY_MAP[raw.category] ?? "Nature",
    isFeatured: raw.isFeatured,
  };
}

/**
 * Map an untrusted `?filter=` value onto the gallery's fixed filter set.
 * Anything unrecognised becomes "All". /work already did this; the lightbox
 * passed the raw value straight through to `?category=`, which the API now
 * answers with a 400 — so prev/next silently vanished on a bad link.
 */
export function normaliseFilter(filter: string | undefined): (typeof GALLERY_FILTERS)[number] {
  const valid = GALLERY_FILTERS as readonly string[];
  return filter && valid.includes(filter)
    ? (filter as (typeof GALLERY_FILTERS)[number])
    : "All";
}

/** MongoDB ObjectId: 24 hex characters. Anything else cannot be a photo. */
const OBJECT_ID = /^[0-9a-f]{24}$/i;

// ---------------------------------------------------------------------------
// Fetch functions
// ---------------------------------------------------------------------------

/**
 * All photos, sorted by position (ascending), optionally filtered by a
 * display-form category ("Nature"). `failed` is true when the API could not
 * be reached or answered with an error.
 */
export async function fetchPhotos(category?: string): Promise<PhotoList> {
  const filter = normaliseFilter(category);
  const query = filter === "All" ? "" : `?category=${encodeURIComponent(filter.toLowerCase())}`;

  try {
    const res = await apiFetch(`/api/photos${query}`, PHOTOS_TAG);
    if (!res.ok) {
      console.error(`[data] GET /api/photos failed — ${res.status} ${res.statusText}`);
      return { photos: [], failed: true };
    }
    const raw: ApiPhoto[] = await res.json();
    return { photos: raw.map(toPhoto), failed: false };
  } catch (err) {
    console.error("[data] GET /api/photos threw —", err);
    return { photos: [], failed: true };
  }
}

/**
 * One photo by id. `photo: null, failed: false` means it genuinely does not
 * exist (render the 404). `failed: true` means the API could not answer
 * (render the error page — telling a visitor a photograph is gone because
 * the database blinked is wrong).
 */
export async function fetchPhoto(id: string): Promise<{ photo: Photo | null; failed: boolean }> {
  // Validate before it reaches a URL path: "../contact" would otherwise
  // resolve to a different endpoint.
  if (!OBJECT_ID.test(id)) return { photo: null, failed: false };

  try {
    const res = await apiFetch(`/api/photos/${id}`, PHOTOS_TAG);
    if (res.status === 404) return { photo: null, failed: false };
    if (!res.ok) {
      console.error(`[data] GET /api/photos/${id} failed — ${res.status} ${res.statusText}`);
      return { photo: null, failed: true };
    }
    const raw: ApiPhoto = await res.json();
    return { photo: toPhoto(raw), failed: false };
  } catch (err) {
    console.error(`[data] GET /api/photos/${id} threw —`, err);
    return { photo: null, failed: true };
  }
}

/**
 * A photo for an old /lightbox/<id> link, which now only redirects to the
 * gallery's viewer. Read from the (filtered) list, which is the cached
 * request every gallery page shares; the by-id request is only a fallback
 * for an id that isn't in the filtered list (a stale ?filter= on an old link).
 * (It used to return prev/next neighbours too, for the lightbox page this
 * route no longer renders; removed in the 2026-11-21 audit.)
 */
export async function fetchLightbox(
  id: string,
  filter?: string
): Promise<{ photo: Photo | null; failed: boolean }> {
  if (!OBJECT_ID.test(id)) return { photo: null, failed: false };

  const { photos: pool, failed } = await fetchPhotos(filter);
  const found = pool.find((p) => p.id === id);
  if (found) return { photo: found, failed: false };

  // Not in this pool. If the list itself failed, the single lookup almost
  // certainly will too, but try it: it is one request and may be cached.
  const single = await fetchPhoto(id);
  return { photo: single.photo, failed: single.failed || (failed && !single.photo) };
}

// ---------------------------------------------------------------------------
// Site content
// ---------------------------------------------------------------------------

/**
 * Last-resort copy for the About page, used only when the API is unreachable.
 * Mirrors DEFAULTS in backend/models/SiteContent.js — keep the two in sync.
 * The backend already substitutes its own defaults when no document exists,
 * so this only fires on a network error or a non-2xx response.
 */
export const DEFAULT_SITE_CONTENT: SiteContent = {
  quote: "Chasing light, quietly.",
  bio: [
    "I am a photographer working mostly at the edges of the day — the hour before the sun clears the horizon, and the long blue minutes after it drops behind it.",
    "My work is about absence as much as presence: an empty platform, a road with nobody on it, one boat holding the centre of an enormous stretch of water. When people appear in a frame, they are weather, not subject.",
    "I shoot on a mix of digital and film, print small, and travel light. The Shutter Bug is where the work collects.",
  ].join("\n\n"),
  aboutImageUrl:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCFd3kHx3f7TeKHtxF_JbbMOx1gcgGN2yJwun0sRZTvkpH0C5Os9LO4SOCnp3UlHBkmbBdbD9r7C6ScpOSyILvBtEOoSi0flavIB50fRf7kmqOL86vKVCMADob9KFsiurnit21aw1Oq79dX5bfimo8ulSvwskvjA7fhD8eVHmylQFGnnJfLDtoxMj4pehyK71qvCKTeclW6BetKTFL02lrphZAeuRvfWazNDSz6sSrgd0PZuCEQBN_D",
  heroImageUrl:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBN4WALWq_emxJIYSU6-Ph6fTn37OTV7OLsoCQ18yhMT1Ch35bNiLM4PlaQGpX7yMywVF0SKr_lWFJ0A6ljA2Yse8ng0wVoQcgD1VWlj6NH6Vg-IzAvUuJumBOqGqNybIThpITt94pICLEZ8H6K_d4Wb02uA12APN9PrHFTTgDRm8p5-amoOw1XUMQii1fxOS90Sa87ajqewjmm2EyiY2NfdJGKNZS3vFiAIkpfpm1A2Y83s1FHV9wH=w2400",
  heroImageAlt: "A lone rowing boat on still water at dusk, mirrored in the lake",
  showWorkStatement: true,
  workStatement: "",
};

/**
 * The editable About-page copy. Never fails outward — About degrades to its
 * original copy rather than rendering blanks or an error page.
 */
export async function fetchSiteContent(): Promise<SiteContent> {
  try {
    const res = await apiFetch("/api/site-content", SITE_CONTENT_TAG);

    if (!res.ok) {
      console.error(
        `[data] GET /api/site-content failed — ${res.status} ${res.statusText}`
      );
      return DEFAULT_SITE_CONTENT;
    }

    const raw: Partial<SiteContent> = await res.json();

    // Field-level fallback: an older document written before a field existed
    // would otherwise render as an empty string.
    return {
      quote: raw.quote || DEFAULT_SITE_CONTENT.quote,
      bio: raw.bio || DEFAULT_SITE_CONTENT.bio,
      aboutImageUrl: directImageUrl(raw.aboutImageUrl || DEFAULT_SITE_CONTENT.aboutImageUrl),
      heroImageUrl: raw.heroImageUrl || DEFAULT_SITE_CONTENT.heroImageUrl,
      heroImages: raw.heroImages && typeof raw.heroImages === "object" ? raw.heroImages : null,
      heroImageAlt: raw.heroImageAlt || DEFAULT_SITE_CONTENT.heroImageAlt,
      // Explicit boolean check: `|| true` would make "hidden" impossible.
      showWorkStatement:
        typeof raw.showWorkStatement === "boolean"
          ? raw.showWorkStatement
          : DEFAULT_SITE_CONTENT.showWorkStatement,
      workStatement: raw.workStatement ?? "",
    };
  } catch (err) {
    console.error("[data] GET /api/site-content threw —", err);
    return DEFAULT_SITE_CONTENT;
  }
}

/**
 * A Google Drive share link points at Drive's preview page, not an image, so
 * an About portrait pasted as one showed nothing (owner, 2026-11-22). Rewrite
 * it to Google's direct image address (2000 px wide). The API does the same
 * on save (backend/routes/siteContent.js, keep the two in step); this covers
 * a link saved before that existed. Anything else is returned unchanged.
 */
export function directImageUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return value;
  }
  if (url.hostname !== "drive.google.com") return value;
  const id = url.pathname.match(/^\/file\/d\/([^/]+)/)?.[1] ?? url.searchParams.get("id");
  return id && /^[A-Za-z0-9_-]{20,}$/.test(id) ? `https://lh3.googleusercontent.com/d/${id}=w2000` : value;
}

/** Split a stored bio into paragraphs on blank lines. */
export function splitBio(bio: string): string[] {
  return bio
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * Home's "The work" text: the owner's own statement when set, else the
 * second paragraph of the bio (what Home showed before the setting existed),
 * else the first. `null` when the owner has switched the section off.
 */
export function workStatementFor(content: SiteContent): string | null {
  if (!content.showWorkStatement) return null;
  const own = content.workStatement.trim();
  if (own) return own;
  const paragraphs = splitBio(content.bio);
  return paragraphs[1] ?? paragraphs[0] ?? null;
}

/** The hero photograph as responsive sources. An uploaded hero comes as
 *  signed, width-capped renditions; the original placeholder is used as is. */
export function heroImage(content: SiteContent): { src: string; srcSet?: string; alt: string } {
  if (content.heroImages) {
    return {
      src: pickImage(content.heroImages, 2400),
      srcSet: imageSetSrcSet(content.heroImages, 1200),
      alt: content.heroImageAlt,
    };
  }
  // The built-in placeholder (no upload yet): a plain URL, used as is.
  return { src: content.heroImageUrl, alt: content.heroImageAlt };
}
