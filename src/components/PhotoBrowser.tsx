"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type MouseEvent } from "react";
import type { Photo } from "@/lib/data";
import Viewer, { GRID_SIZES, photoMeta, photoTitle } from "./Viewer";

// ---------------------------------------------------------------------------
// Column count — 1 / 2 / 3 at the 640px and 1024px breakpoints.
// The server can't know the viewport, so it renders `initialColumns` (the
// /work page guesses from the User-Agent: phone 1, tablet 2, desktop 3) and
// the client corrects it after hydration if the guess was wrong.
// ---------------------------------------------------------------------------
const QUERIES = ["(min-width: 640px)", "(min-width: 1024px)"];

function subscribe(onChange: () => void) {
  const lists = QUERIES.map((q) => window.matchMedia(q));
  lists.forEach((l) => l.addEventListener("change", onChange));
  return () => lists.forEach((l) => l.removeEventListener("change", onChange));
}
function columnsNow() {
  return 1 + QUERIES.filter((q) => window.matchMedia(q).matches).length;
}

/** Caption block height, in units of column width (for balancing columns). */
const CAPTION = 0.14;

/**
 * Masonry in reading order. Each photo goes into the currently shortest
 * column (leftmost on a tie), using heights known from the stored aspect
 * ratios — so the first photos run left to right across the top, the way
 * people read, and the order dragged in the Studio is the order seen here.
 * (CSS `columns` filled column by column, which scrambled that order.)
 */
function distribute(photos: Photo[], columns: number) {
  const cols = Array.from({ length: columns }, () => ({ height: 0, items: [] as { photo: Photo; index: number }[] }));
  photos.forEach((photo, index) => {
    let target = cols[0];
    for (const c of cols) if (c.height < target.height - 1e-6) target = c;
    target.items.push({ photo, index });
    target.height += 1 / photo.ratio + CAPTION;
  });
  return cols;
}

/**
 * A gallery of photo cards that open in the in-page Viewer.
 *
 * URL: opening pushes `?photo=<id>` (keeping any filter), so the browser's
 * Back button closes the viewer and the URL can be shared; stepping
 * replaces it; closing goes back. The cards are real links to that URL, so
 * middle-click / open-in-new-tab still work.
 */
export default function PhotoBrowser({
  photos,
  label,
  basePath,
  query = {},
  initialColumns = 3,
  initialPhotoId,
  eager = 0,
  layout = "masonry",
  gridClassName = "grid items-start gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3",
}: {
  photos: Photo[];
  label: string;
  /** Path the viewer URL is built on, e.g. "/work". */
  basePath: string;
  /** Extra query kept in the URL, e.g. { filter: "Nature" }. */
  query?: Record<string, string>;
  initialColumns?: number;
  /** Open this photo on first render (a shared ?photo= link). */
  initialPhotoId?: string;
  /** Number of leading images to load eagerly. */
  eager?: number;
  /**
   * "masonry" (gallery) or "grid": a plain responsive CSS grid for short,
   * static lists like Home's featured photos, where the server can't know the
   * viewport and a JS column count would flash on phones.
   */
  layout?: "masonry" | "grid";
  /** Classes for the "grid" layout's container, to change its columns. */
  gridClassName?: string;
}) {
  const columns = Math.min(
    3,
    useSyncExternalStore(subscribe, columnsNow, () => initialColumns)
  );

  const [index, setIndex] = useState<number | null>(() => {
    if (!initialPhotoId) return null;
    const i = photos.findIndex((p) => p.id === initialPhotoId);
    return i === -1 ? null : i;
  });
  const pushed = useRef(false);

  // `query` is a fresh object every render; its serialised content is the
  // stable identity the URL builder depends on.
  const queryString = new URLSearchParams(query).toString();
  const urlFor = useCallback(
    (id?: string) => {
      const q = new URLSearchParams(queryString);
      if (id) q.set("photo", id);
      const s = q.toString();
      return basePath + (s ? `?${s}` : "");
    },
    [basePath, queryString]
  );

  // Keep the URL on the photo being shown.
  useEffect(() => {
    if (index === null || !photos[index]) return;
    window.history.replaceState(window.history.state, "", urlFor(photos[index].id));
  }, [index, photos, urlFor]);

  // Back/forward: follow the URL.
  useEffect(() => {
    const onPop = () => {
      const id = new URLSearchParams(window.location.search).get("photo");
      const i = id ? photos.findIndex((p) => p.id === id) : -1;
      if (i === -1) pushed.current = false;
      setIndex(i === -1 ? null : i);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [photos]);

  const open = (i: number) => (e: MouseEvent) => {
    // Let modified clicks (new tab, etc.) behave like normal links.
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    window.history.pushState(window.history.state, "", urlFor(photos[i].id));
    pushed.current = true;
    setIndex(i);
  };

  const close = useCallback(() => {
    setIndex(null);
    if (pushed.current) {
      pushed.current = false;
      window.history.back();
    } else {
      window.history.replaceState(window.history.state, "", urlFor());
    }
  }, [urlFor]);

  const step = useCallback(
    (delta: number) =>
      setIndex((i) => (i === null ? i : (i + delta + photos.length) % photos.length)),
    [photos.length]
  );

  const card = (photo: Photo, i: number) => (
    <div key={photo.id} role="listitem">
                <a href={urlFor(photo.id)} onClick={open(i)} className="photo-card reveal">
                  <div className="frame-media" style={{ aspectRatio: photo.ratio }}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary renditions via srcSet; no next/image by decision */}
                    <img
                      src={photo.thumb}
                      srcSet={photo.srcSet}
                      sizes={GRID_SIZES}
                      alt={photo.alt}
                      loading={i < eager ? "eager" : "lazy"}
                      decoding="async"
                    />
                  </div>
                  <div className="cap">
                    <span className="cap-title">{photoTitle(photo)}</span>
                    {photoMeta(photo) && <span className="frame-meta shrink-0">{photoMeta(photo)}</span>}
                  </div>
                </a>
    </div>
  );

  return (
    <>
      {layout === "grid" ? (
        <div role="list" aria-label={label} className={gridClassName}>
          {photos.map((photo, i) => card(photo, i))}
        </div>
      ) : (
        <div className="masonry" role="list" aria-label={label}>
          {distribute(photos, columns).map((col, c) => (
            <div key={c} className="masonry-col">
              {col.items.map(({ photo, index: i }) => card(photo, i))}
            </div>
          ))}
        </div>
      )}

      {index !== null && photos[index] && (
        <Viewer photos={photos} index={index} onStep={step} onClose={close} />
      )}
    </>
  );
}
