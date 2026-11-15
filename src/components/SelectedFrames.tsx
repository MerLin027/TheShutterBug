import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Photo } from "@/lib/data";
import PhotoBrowser from "./PhotoBrowser";

/**
 * Home's "Selected work": the photos flagged featured in the Studio. They
 * open in the same instant in-page viewer as the gallery. Renders nothing
 * when nothing is featured (or the API was unreachable) — an empty heading
 * would read as broken rather than as a choice.
 */
export default function SelectedFrames({ photos }: { photos: Photo[] }) {
  if (photos.length === 0) return null;

  return (
    <section aria-labelledby="selected-work" className="px-margin-mobile pb-28 pt-8 md:px-margin-desktop md:pb-36">
      <div className="site-container">
        <div className="reveal mb-12 flex flex-col gap-4 md:mb-16 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="caps">Featured</p>
            <h2 id="selected-work" className="section-title mt-3">Selected work</h2>
          </div>
          <Link href="/work" className="text-link self-start md:self-auto">
            View the full gallery
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <PhotoBrowser photos={photos} label="Selected work" basePath="/" layout="grid" />
      </div>
    </section>
  );
}
