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
        {/* On the type-scale tokens, same as every other page <h1>. This used
            to carry `text-4xl md:text-6xl` because `text-headline-lg`
            generated no utility under the old `--font-size-*` names and the
            heading rendered at 14.4px; the tokens are real now, so the
            workaround is gone.

            The "{n} frames — click any photograph…" line under it is gone by
            request. */}
        <Reveal className="site-container mb-12 text-center" blur>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-on-surface">
            Gallery
          </h1>
        </Reveal>
        {/* GalleryClient owns filter state; receives all photos from the server. */}
        <GalleryClient photos={photos} initialFilter={filter} />
      </main>

      <SiteFooter />
    </div>
  );
}
