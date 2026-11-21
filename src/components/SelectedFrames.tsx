import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Photo } from "@/lib/data";
import PhotoBrowser from "./PhotoBrowser";
import HomeSection from "./HomeSection";

/**
 * Home's "Curated Work" (renamed from "Selected Work", owner, 2026-11-21):
 * the photos starred in the Studio, or, while none are, the first six in
 * gallery order under "From the Gallery". Same section shape as "The Work"
 * (HomeSection). The photos open in the same in-page viewer as the gallery.
 * Renders nothing if there are no photos at all (or the API was down).
 */
export default function SelectedFrames({
  photos,
  featured = true,
  index,
  className = "",
}: {
  photos: Photo[];
  featured?: boolean;
  index: string;
  className?: string;
}) {
  if (photos.length === 0) return null;

  return (
    <HomeSection
      id="curated-work"
      index={index}
      title={featured ? "Curated Work" : "From the Gallery"}
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
        label={featured ? "Curated work" : "From the gallery"}
        basePath="/"
        layout="grid"
        gridClassName="grid items-start gap-x-8 gap-y-12 sm:grid-cols-2"
      />
    </HomeSection>
  );
}
