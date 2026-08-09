// ---------------------------------------------------------------------------
// data.ts — API client for the Render backend
// Replaces the former hardcoded photo array with real fetch calls.
// All functions are async and intended for use in Server Components or
// Server Actions (they run on the Next.js server, never in the browser).
// ---------------------------------------------------------------------------

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://theshutterbug.onrender.com";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Raw shape returned by the Express API (mirrors the Mongoose schema). */
export type ApiPhoto = {
  _id: string;
  imageUrl: string;
  cloudinaryId: string;
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

/**
 * Editable About-page copy, served by GET /api/site-content.
 * `bio` holds paragraphs separated by a blank line.
 */
export type SiteContent = {
  quote: string;
  bio: string;
  aboutImageUrl: string;
};

/** Normalised shape used by all frontend components. */
export type Photo = {
  id: string;
  src: string;
  alt: string;
  /** Tailwind aspect-ratio class derived from aspectRatio */
  aspect: string;
  title: string;
  location: string;
  year: string;
  category: "Nature" | "Objects" | "Monochrome" | "Urban";
  isFeatured: boolean;
};

// ---------------------------------------------------------------------------
// Adapter helpers
// ---------------------------------------------------------------------------

/** Convert an aspect-ratio number to the closest Tailwind aspect class. */
function aspectClass(ratio: number): string {
  // ratio = width / height
  if (ratio <= 0.57) return "aspect-[9/16]";
  if (ratio <= 0.68) return "aspect-[2/3]";
  if (ratio <= 0.8)  return "aspect-[3/4]";
  if (ratio <= 0.9)  return "aspect-[4/5]";
  if (ratio <= 1.1)  return "aspect-square";
  if (ratio <= 1.4)  return "aspect-[5/4]";
  if (ratio <= 1.6)  return "aspect-[3/2]";
  if (ratio <= 1.85) return "aspect-[16/9]";
  if (ratio <= 2.1)  return "aspect-video";
  return "aspect-[21/9]";
}

/** Capitalise the first letter so DB "nature" → "Nature". */
function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Convert a raw API document to the normalised Photo type. */
function toPhoto(raw: ApiPhoto): Photo {
  const categoryMap: Record<string, Photo["category"]> = {
    nature: "Nature",
    objects: "Objects",
    monochrome: "Monochrome",
    urban: "Urban",
  };

  return {
    id: raw._id,
    src: raw.imageUrl,
    alt: raw.caption || `${capitalise(raw.category)} photograph`,
    aspect: aspectClass(raw.aspectRatio),
    title: raw.caption || capitalise(raw.category),
    location: raw.location || "",
    year: raw.createdAt ? new Date(raw.createdAt).getFullYear().toString() : "",
    category: categoryMap[raw.category] ?? "Nature",
    isFeatured: raw.isFeatured,
  };
}

// ---------------------------------------------------------------------------
// Fetch functions
// ---------------------------------------------------------------------------

/**
 * Fetch all photos, sorted by position (ascending).
 * Optionally filter by lowercase category string.
 * Returns [] when the DB is empty — callers should render an empty state.
 */
export async function fetchPhotos(category?: string): Promise<Photo[]> {
  const url = new URL(`${API_URL}/api/photos`);
  if (category && category !== "All") {
    url.searchParams.set("category", category.toLowerCase());
  }

  const res = await fetch(url.toString(), {
    // Revalidate every 60 s on the server so a newly-uploaded photo
    // appears without a full redeploy.
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    // Surface the error in the Next.js server logs but don't crash the page.
    console.error(`[data] GET /api/photos failed — ${res.status} ${res.statusText}`);
    return [];
  }

  const raw: ApiPhoto[] = await res.json();
  return raw.map(toPhoto);
}

/**
 * Fetch photos flagged `isFeatured`, for Home's "Selected Frames" section.
 * The backend's GET /api/photos only accepts a `category` filter, so
 * featured-filtering happens here rather than as a new query param.
 */
export async function fetchFeaturedPhotos(limit?: number): Promise<Photo[]> {
  const all = await fetchPhotos();
  const featured = all.filter((p) => p.isFeatured);
  return limit ? featured.slice(0, limit) : featured;
}

/**
 * Fetch a single photo by its MongoDB _id.
 * Returns null when the photo doesn't exist or the request fails.
 */
export async function fetchPhoto(id: string): Promise<Photo | null> {
  const res = await fetch(`${API_URL}/api/photos/${id}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    if (res.status !== 404) {
      console.error(`[data] GET /api/photos/${id} failed — ${res.status} ${res.statusText}`);
    }
    return null;
  }

  const raw: ApiPhoto = await res.json();
  return toPhoto(raw);
}

/**
 * Fetch photos (optionally filtered by category) and return the prev/next
 * neighbours for a given photo id within that set.
 * Used by the lightbox to build navigation links.
 *
 * @param currentId   MongoDB _id of the photo currently open in the lightbox.
 * @param filter      Active gallery filter (e.g. "Nature"). Pass "All" or
 *                    omit to use the full unfiltered list.
 */
export async function fetchPhotoNeighbours(
  currentId: string,
  filter?: string
): Promise<{ all: Photo[]; prev: Photo | null; next: Photo | null }> {
  // Use the same filter the gallery was showing so prev/next stay within the
  // filtered set rather than jumping to unrelated categories.
  const pool = await fetchPhotos(filter && filter !== "All" ? filter : undefined);
  if (pool.length === 0) return { all: [], prev: null, next: null };

  const idx = pool.findIndex((p) => p.id === currentId);
  // Photo not found in this filtered pool (shouldn't happen, but fall back
  // to disabling navigation rather than crashing).
  if (idx === -1) return { all: pool, prev: null, next: null };

  // Wrap-around navigation: last photo's "next" is the first, and vice-versa.
  const prev = idx > 0 ? pool[idx - 1] : pool[pool.length - 1];
  const next = idx < pool.length - 1 ? pool[idx + 1] : pool[0];

  return { all: pool, prev, next };
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
};

/**
 * Fetch the editable About-page copy.
 * Never returns null — falls back to DEFAULT_SITE_CONTENT so About degrades
 * to its original copy rather than rendering blanks.
 */
export async function fetchSiteContent(): Promise<SiteContent> {
  try {
    const res = await fetch(`${API_URL}/api/site-content`, {
      next: { revalidate: 60 },
    });

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
      aboutImageUrl: raw.aboutImageUrl || DEFAULT_SITE_CONTENT.aboutImageUrl,
    };
  } catch (err) {
    console.error("[data] GET /api/site-content threw —", err);
    return DEFAULT_SITE_CONTENT;
  }
}

/** Split a stored bio into paragraphs on blank lines. */
export function splitBio(bio: string): string[] {
  return bio
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
