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
 * Fetch all photos and return the prev/next neighbours for a given photo id.
 * Used by the lightbox to build navigation links.
 * Returns null for both if the list is empty.
 */
export async function fetchPhotoNeighbours(
  currentId: string
): Promise<{ all: Photo[]; prev: Photo | null; next: Photo | null }> {
  const all = await fetchPhotos();
  if (all.length === 0) return { all: [], prev: null, next: null };

  const idx = all.findIndex((p) => p.id === currentId);
  if (idx === -1) return { all, prev: null, next: null };

  const prev = idx > 0 ? all[idx - 1] : all[all.length - 1];
  const next = idx < all.length - 1 ? all[idx + 1] : all[0];

  return { all, prev, next };
}
