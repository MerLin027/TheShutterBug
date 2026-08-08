import Link from "next/link";
import type { Photo } from "@/lib/data";
import Reveal from "./Reveal";

/**
 * Home's "Selected Frames" section (§1.2). Renders nothing when no photo
 * is flagged featured — an empty heading with no grid would read as
 * broken rather than as an intentional empty state.
 */
export default function SelectedFrames({ photos }: { photos: Photo[] }) {
  if (photos.length === 0) return null;

  return (
    <section className="w-full px-margin-mobile md:px-margin-desktop py-section-gap">
      <Reveal className="flex items-end justify-between mb-12">
        {/* One step below a page <h1> (headline-lg): section headings sit at
            headline-lg-mobile at every width, so the type scale reads as a
            hierarchy rather than two things at the same size. */}
        <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
          Selected frames
        </h2>
        <Link
          href="/work"
          className="font-label-sm text-label-sm tracking-widest uppercase text-on-surface-variant hover:text-accent transition-colors"
        >
          View All
        </Link>
      </Reveal>

      {/* Masonry columns, not a uniform 3-up grid. A row of equal-height
          cards forces every photograph into the same box regardless of its
          real aspect ratio — and context.md's design philosophy asks for
          exactly the opposite ("masonry/staggered grid for photo layouts,
          not uniform squares"). This also matches the Gallery page, which
          was already using columns while this section was not. */}
      <div className="columns-1 md:columns-2 lg:columns-3 gap-gutter space-y-gutter">
        {photos.map((photo, i) => (
          <Reveal
            key={photo.id}
            delay={Math.min(i * 0.08, 0.4)}
            className="break-inside-avoid"
          >
            <Link
              href={`/lightbox/${photo.id}`}
              className="group block"
            >
              <div
                className={`${photo.aspect} w-full rounded-2xl overflow-hidden bg-surface-container-low`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  alt={photo.alt}
                  src={photo.src}
                />
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="font-body-md text-body-md font-bold text-on-surface">
                  {photo.title}
                </span>
                <span className="font-label-sm text-label-sm tracking-widest uppercase text-on-surface-variant">
                  {photo.category}
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
