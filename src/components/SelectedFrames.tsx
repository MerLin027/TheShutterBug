import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Photo } from "@/lib/data";
import PhotoBrowser from "./PhotoBrowser";
import HomeSection from "./HomeSection";

/**
 * Home's "Curated Work" (renamed from "Selected Work", owner, 2026-11-21):
 * the photos starred in the Studio, and only those. Same section shape as
 * "The Work" (HomeSection). The photos open in the same in-page viewer as the
 * gallery. Renders nothing while none are starred (or the API was down).
 *
 * There used to be a fallback: with nothing starred, the first six gallery
 * photos showed here as "From the Gallery". The owner removed it
 * (2026-11-22): an unstarred upload appeared on Home, and starring is what
 * decides what Home shows.
 */
export default function SelectedFrames({
  photos,
  index,
  className = "",
}: {
  photos: Photo[];
  index: string;
  className?: string;
}) {
  if (photos.length === 0) return null;

  return (
    <HomeSection
      id="curated-work"
      index={index}
      title="Curated Work"
      className={`home-frames pb-28 md:pb-40 ${className}`}
      aside={
        <Link href="/work" className="text-link">
          View the full gallery
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      }
    >
      <PhotoBrowser
        photos={photos}
        label="Curated work"
        basePath="/"
        layout="grid"
        gridClassName="grid items-start gap-x-8 gap-y-12 sm:grid-cols-2"
      />
    </HomeSection>
  );
}
