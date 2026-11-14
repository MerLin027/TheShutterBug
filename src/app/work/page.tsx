import { fetchPhotos } from "@/lib/data";
import GalleryClient from "./GalleryClient";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

// Revalidate the page every 60 s (matches the fetch revalidation in data.ts).
export const revalidate = 60;

export default async function Work({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const { photos, failed } = await fetchPhotos();

  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper text-fg antialiased">
      <SiteNav />

      <main
        id="main"
        className="flex-grow px-margin-mobile pb-24 pt-28 md:px-margin-desktop md:pb-32 md:pt-36"
      >
        <div className="site-container">
          {/* GalleryClient owns the heading row (it holds the filter state).
              `failed` lets it say "couldn't load" instead of "no photos". */}
          <GalleryClient photos={photos} failed={failed} initialFilter={filter} />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
