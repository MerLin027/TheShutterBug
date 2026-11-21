"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { Photo } from "@/lib/data";

/** Must match the grid's `sizes` so the viewer's first image is the one the
 *  browser already downloaded for the card — it appears instantly, from cache. */
export const GRID_SIZES = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw";

/** True in the browser, false while server-rendering, without a hydration
 *  mismatch (the server snapshot is used for the first client render). */
const noSubscribe = () => () => {};
function useIsClient() {
  return useSyncExternalStore(noSubscribe, () => true, () => false);
}

export function photoTitle(p: Photo): string {
  return p.caption || p.category;
}
export function photoMeta(p: Photo): string {
  return [p.caption ? p.category : null, p.location || null, p.year || null]
    .filter(Boolean)
    .join(" · ");
}

/**
 * In-page photo viewer (Phase R) — replaces navigating to /lightbox/[id].
 *
 * Why: every open used to be a full server render on Vercel (~350 ms, cache
 * MISS every time) with nothing on screen meanwhile, and the experimental
 * route transition swallowed clicks made while it ran (measured: four quick
 * "Next" presses moved one photo). Here nothing navigates:
 *   - the card's already-downloaded image shows immediately (same srcSet and
 *     sizes as the grid), and the sharp 2400px rendition fades in over it;
 *   - neighbours' sharp renditions are preloaded, so Next/Prev are instant;
 *   - each step is a functional state update, so rapid clicks all count.
 * Keyboard: ← → move, Escape closes. Touch: swipe. Focus moves in on open
 * and back to the card on close; the page behind can't scroll.
 *
 * Rendered into document.body (a portal), not inside the gallery. Inside,
 * any ancestor that becomes a stacking context (an opacity animation such
 * as the page fade, a transform) traps the viewer's z-index below the fixed
 * site header, which then sat over the top row and swallowed clicks on
 * Close (2026-11-21, measured live: Close did nothing after arriving at the
 * gallery through a link; Escape still worked).
 */
export default function Viewer({
  photos,
  index,
  onStep,
  onClose,
}: {
  photos: Photo[];
  index: number;
  /** Move by ±1, wrapping. */
  onStep: (delta: number) => void;
  onClose: () => void;
}) {
  const photo = photos[index];
  const count = photos.length;
  const [direction, setDirection] = useState(0);
  const [loaded, setLoaded] = useState<Record<string, true>>({});
  const closeButton = useRef<HTMLButtonElement>(null);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);

  const step = (delta: number) => {
    setDirection(delta);
    onStep(delta);
  };

  // Keyboard, scroll lock, focus in/out.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeButton.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
      opener?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" && count > 1) { setDirection(1); onStep(1); }
      else if (e.key === "ArrowLeft" && count > 1) { setDirection(-1); onStep(-1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [count, onClose, onStep]);

  // Preload the neighbours' sharp renditions so the next step is instant.
  useEffect(() => {
    if (count < 2) return;
    for (const d of [1, -1]) {
      const n = photos[(index + d + count) % count];
      const img = new Image();
      img.src = n.src;
    }
  }, [index, photos, count]);

  const markLoaded = (id: string) => setLoaded((m) => (m[id] ? m : { ...m, [id]: true }));

  const onPointerDown = (e: PointerEvent) => {
    swipeStart.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: PointerEvent) => {
    const s = swipeStart.current;
    swipeStart.current = null;
    if (!s || count < 2) return;
    const dx = e.clientX - s.x;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - s.y)) step(dx < 0 ? 1 : -1);
  };

  // A shared ?photo= link renders this on the server too, where there is no
  // document.body to portal into: nothing there, the viewer on the client.
  const isClient = useIsClient();
  if (!isClient) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${photoTitle(photo)}, photograph ${index + 1} of ${count}`}
      className="viewer"
    >
      <div className="flex items-center justify-between px-margin-mobile py-4 md:px-margin-desktop">
        <span className="caps" aria-live="polite">
          {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
        </span>
        <button ref={closeButton} type="button" onClick={onClose} className="nav-link gap-2">
          Close <X size={16} aria-hidden="true" />
        </button>
      </div>

      <div className="viewer-stage" onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
        {count > 1 && (
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Previous photograph"
            className="viewer-arrow viewer-arrow-prev"
          >
            <ChevronLeft size={28} aria-hidden="true" />
          </button>
        )}

        <figure
          key={photo.id}
          className="viewer-figure"
          style={{ "--r": photo.ratio, "--dx": `${direction * 28}px` } as CSSProperties}
        >
          {/* Instant: the card's own image, from cache. */}
          {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary renditions; no next/image by decision */}
          <img src={photo.thumb} srcSet={photo.srcSet} sizes={GRID_SIZES} alt="" aria-hidden="true" draggable={false} />
          {/* Sharp: fades in over it once downloaded. */}
          {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary rendition */}
          <img
            ref={(el) => {
              if (el?.complete && el.naturalWidth > 0) markLoaded(photo.id);
            }}
            src={photo.src}
            alt={photo.alt}
            draggable={false}
            className="viewer-hi"
            data-loaded={loaded[photo.id] ? "true" : "false"}
            onLoad={() => markLoaded(photo.id)}
          />
        </figure>

        {count > 1 && (
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Next photograph"
            className="viewer-arrow viewer-arrow-next"
          >
            <ChevronRight size={28} aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="px-margin-mobile pb-7 pt-4 text-center md:px-margin-desktop">
        <p className="cap-title">{photoTitle(photo)}</p>
        {photoMeta(photo) && <p className="frame-meta mt-1">{photoMeta(photo)}</p>}
      </div>
    </div>,
    document.body
  );
}
