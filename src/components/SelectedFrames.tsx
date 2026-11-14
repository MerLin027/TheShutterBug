import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Photo } from "@/lib/data";
import FrameGrid from "./FrameGrid";

/**
 * Home's "Selected frames": the photos the owner flagged featured in the
 * Studio, in the same justified rows as the gallery. Renders nothing when no
 * photo is featured (or the API could not be reached) — an empty heading
 * with no grid would read as broken rather than as a choice.
 */
export default function SelectedFrames({ photos }: { photos: Photo[] }) {
  if (photos.length === 0) return null;

  return (
    <section
      aria-labelledby="selected-frames"
      className="px-margin-mobile pb-24 pt-4 md:px-margin-desktop md:pb-32"
    >
      <div className="site-container">
        <div className="mb-8 flex items-baseline justify-between gap-6">
          <h2 id="selected-frames" className="text-heading font-medium text-fg">
            Selected frames
          </h2>
          <Link href="/work" className="btn btn-text -mr-3 h-auto py-2">
            View all
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <FrameGrid
          photos={photos}
          label="Selected frames"
          hrefFor={(photo) => `/lightbox/${photo.id}`}
        />
      </div>
    </section>
  );
}
