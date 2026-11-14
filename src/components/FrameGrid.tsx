import Link from "next/link";
import { ViewTransition, type CSSProperties } from "react";
import type { Photo } from "@/lib/data";

/**
 * The photo grid for the gallery and Home's Selected frames — justified rows
 * (see `.justified` in globals.css): every photo in a row shares one height,
 * widths follow each photo's aspect ratio, and the order is reading order.
 *
 * Each card carries the contact-sheet signature: a mono frame line under the
 * photo ("014 · Nature · 2026"). A caption, when the owner wrote one, sits
 * above it; when there isn't one nothing stands in for it. The old card
 * printed the category twice ("Nature … NATURE") whenever the caption was
 * empty.
 *
 * The image is wrapped in a named <ViewTransition>, matched by the lightbox,
 * so the photo grows from its card into the full view (task B10).
 */

/** Frame width ≈ --r × row height, grown to fill the line. */
const SIZES =
  "(min-width: 1536px) 30vw, (min-width: 1024px) 40vw, (min-width: 640px) 55vw, 100vw";

export default function FrameGrid({
  photos,
  hrefFor,
  eagerCount = 0,
  label,
}: {
  photos: Photo[];
  /** Where a card links. Lets the gallery carry its active filter. */
  hrefFor: (photo: Photo) => string;
  /** How many leading images load eagerly (the first visible row). */
  eagerCount?: number;
  /** Accessible name for the list. */
  label: string;
}) {
  return (
    <ul className="justified" aria-label={label}>
      {photos.map((photo, i) => (
        <li
          key={photo.id}
          className="frame"
          style={{ "--r": photo.ratio } as CSSProperties}
        >
          <Link href={hrefFor(photo)} className="group block rounded-photo">
            <ViewTransition name={`photo-${photo.id}`}>
              <div className="frame-media" style={{ aspectRatio: photo.ratio }}>
                {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary renditions via srcSet; no next/image by decision (REDESIGN.md §2) */}
                <img
                  src={photo.thumb}
                  srcSet={photo.srcSet}
                  sizes={SIZES}
                  alt={photo.alt}
                  loading={i < eagerCount ? "eager" : "lazy"}
                  decoding="async"
                />
              </div>
            </ViewTransition>
            <div className="mt-3 flex items-baseline justify-between gap-4">
              {photo.caption && (
                <span className="min-w-0 truncate text-label text-fg">
                  {photo.caption}
                </span>
              )}
              <span className={photo.caption ? "frame-meta ml-auto shrink-0" : "frame-meta"}>
                {photo.frame} · {photo.category}
                {photo.year && ` · ${photo.year}`}
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
