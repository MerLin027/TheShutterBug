import { fetchPhotos } from "@/lib/data";
import GalleryClient from "./GalleryClient";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import Reveal from "@/components/Reveal";

// Revalidate the page every 60 s (matches the fetch revalidation in data.ts).
export const revalidate = 60;

export default async function Work({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  // Fetches from the live Render API. Returns [] when DB is empty.
  const photos = await fetchPhotos();

  return (
    <div className="bg-primary-container text-on-surface font-body-md antialiased min-h-[100dvh] flex flex-col">
      <SiteNav />

      <main id="main" className="flex-grow pt-32 md:pt-40 px-margin-mobile md:px-margin-desktop">
        <Reveal className="site-container mb-12 text-center">
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-3">
            Gallery
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            {photos.length} {photos.length === 1 ? "frame" : "frames"} — click any photograph to open it full screen.
          </p>
        </Reveal>
        {/* GalleryClient owns filter state; receives all photos from the server. */}
        <GalleryClient photos={photos} initialFilter={filter} />
      </main>

      <SiteFooter />
    </div>
  );
}
