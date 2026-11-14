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
  const { photos, failed } = await fetchPhotos();

  return (
    <div className="bg-primary-container text-on-surface font-body-md antialiased min-h-[100dvh] flex flex-col">
      <SiteNav />

      <main id="main" className="flex-grow pt-32 md:pt-40 px-margin-mobile md:px-margin-desktop">
        <Reveal className="site-container mb-12 text-center" blur>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-on-surface">
            Gallery
          </h1>
        </Reveal>
        {/* GalleryClient owns filter state; receives all photos from the server.
            `failed` lets it say "couldn't load" instead of "no photos yet". */}
        <GalleryClient photos={photos} failed={failed} initialFilter={filter} />
      </main>

      <SiteFooter />
    </div>
  );
}
