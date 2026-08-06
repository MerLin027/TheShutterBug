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
        <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">
          Selected frames
        </h2>
        <Link
          href="/work"
          className="font-label-sm text-label-sm tracking-widest uppercase text-on-surface-variant hover:text-primary transition-colors"
        >
          View All
        </Link>
      </Reveal>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
        {photos.map((photo, i) => (
          <Reveal key={photo.id} delay={Math.min(i * 0.08, 0.4)}>
            <Link
              href={`/lightbox/${photo.id}`}
              className="group block rounded-lg overflow-hidden bg-surface-container-low"
            >
              <div className={`${photo.aspect} w-full overflow-hidden`}>
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
