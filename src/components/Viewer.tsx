"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
} from "react";
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
 *
 * Keyboard: ← → move, Escape closes, Tab stays inside the viewer. Touch:
 * swipe, and the photo follows the finger. A click on the empty area around
 * the photo closes. Closing fades out. Focus moves in on open and back to
 * the card on close; the page behind can't scroll.
 *
 * Phones (< 768px, CSS): photo and caption are centred together and the
 * arrows sit beside the caption, not on the photo's edges.
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
  // Closing fades out first (180 ms), then the parent unmounts the viewer.
  const [closing, setClosing] = useState(false);
  const dialog = useRef<HTMLDivElement>(null);
  const figure = useRef<HTMLElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  // When the last swipe ended. The click that follows a swipe's touchend
  // must not count as a tap on the empty area; a later tap must. (A plain
  // boolean stayed set after a short drag and swallowed the next real tap.)
  const swipedAt = useRef(0);

  const step = (delta: number) => {
    setDirection(delta);
    onStep(delta);
  };

  const requestClose = useCallback(() => setClosing(true), []);

  // Unmount once the fade has run. A timer rather than animationend, which a
  // browser may skip (a background tab, reduced motion's near-zero duration).
  useEffect(() => {
    if (!closing) return;
    const t = window.setTimeout(onClose, 190);
    return () => window.clearTimeout(t);
  }, [closing, onClose]);

  // Scroll lock and focus in/out.
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
      if (e.key === "Escape") requestClose();
      else if (e.key === "ArrowRight" && count > 1) { setDirection(1); onStep(1); }
      else if (e.key === "ArrowLeft" && count > 1) { setDirection(-1); onStep(-1); }
      else if (e.key === "Tab" && dialog.current) {
        // Keep focus inside: Tab from the last control goes to the first,
        // Shift+Tab from the first to the last. The page behind is covered,
        // so focus escaping there is focus lost.
        const items = [...dialog.current.querySelectorAll<HTMLElement>("button")].filter(
          (b) => b.offsetParent !== null
        );
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        const active = document.activeElement;
        const inside = dialog.current.contains(active);
        if (e.shiftKey && (active === first || !inside)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && (active === last || !inside)) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [count, requestClose, onStep]);

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

  // Swipe: the photo follows the finger (a damped `translate`, which is
  // separate from the entrance animation's `transform`), then either steps
  // or springs back.
  const setDrag = (px: number, animate: boolean) => {
    const el = figure.current;
    if (!el) return;
    el.style.transition = animate ? "translate 320ms cubic-bezier(0.2, 0.7, 0.1, 1)" : "none";
    el.style.translate = px ? `${px}px 0` : "";
  };
  const onPointerDown = (e: PointerEvent) => {
    swipeStart.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerMove = (e: PointerEvent) => {
    const s = swipeStart.current;
    if (!s || count < 2 || e.pointerType === "mouse") return;
    const dx = e.clientX - s.x;
    if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(e.clientY - s.y)) setDrag(dx * 0.55, false);
  };
  const onPointerUp = (e: PointerEvent) => {
    const s = swipeStart.current;
    swipeStart.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    if (Math.abs(dx) > 10) swipedAt.current = performance.now();
    if (count > 1 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - s.y)) {
      setDrag(0, false);
      step(dx < 0 ? 1 : -1);
    } else {
      setDrag(0, true);
    }
  };
  const onPointerCancel = () => {
    swipeStart.current = null;
    setDrag(0, true);
  };

  // A click on the empty dark area (not the photo, arrows or caption) closes.
  const onBackdropClick = (e: MouseEvent) => {
    if (e.target !== e.currentTarget) return;
    if (performance.now() - swipedAt.current < 350) return;
    requestClose();
  };

  // A shared ?photo= link renders this on the server too, where there is no
  // document.body to portal into: nothing there, the viewer on the client.
  const isClient = useIsClient();
  if (!isClient) return null;

  const prevButton = (className: string) => (
    <button type="button" onClick={() => step(-1)} aria-label="Previous photograph" className={className}>
      <ChevronLeft size={28} aria-hidden="true" />
    </button>
  );
  const nextButton = (className: string) => (
    <button type="button" onClick={() => step(1)} aria-label="Next photograph" className={className}>
      <ChevronRight size={28} aria-hidden="true" />
    </button>
  );

  return createPortal(
    <div
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-label={`${photoTitle(photo)}, photograph ${index + 1} of ${count}`}
      className={closing ? "viewer viewer-closing" : "viewer"}
      onClick={onBackdropClick}
    >
      <div className="viewer-top flex items-center justify-between px-margin-mobile py-4 md:px-margin-desktop">
        <span className="caps" aria-live="polite">
          {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
        </span>
        <button ref={closeButton} type="button" onClick={requestClose} className="nav-link gap-2">
          Close <X size={16} aria-hidden="true" />
        </button>
      </div>

      <div
        className="viewer-stage"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onClick={onBackdropClick}
      >
        {/* Beside the photo on tablets and desktops; on a phone they would
            sit on its edges, so there they move beside the caption. */}
        {count > 1 && prevButton("viewer-arrow viewer-arrow-prev")}

        <figure
          ref={figure}
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

        {count > 1 && nextButton("viewer-arrow viewer-arrow-next")}
      </div>

      <div className="viewer-caption px-margin-mobile pb-7 pt-4 text-center md:px-margin-desktop">
        {count > 1 && prevButton("viewer-arrow-inline md:hidden")}
        <div>
          <p className="cap-title">{photoTitle(photo)}</p>
          {photoMeta(photo) && <p className="frame-meta mt-1">{photoMeta(photo)}</p>}
        </div>
        {count > 1 && nextButton("viewer-arrow-inline md:hidden")}
      </div>
    </div>,
    document.body
  );
}
