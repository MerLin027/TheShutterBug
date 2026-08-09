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
        {/* Sized with built-in utilities, not `text-headline-lg` — that token
            generates no utility under Tailwind v4's namespaces, so this
            heading was rendering at 14.4px, the same size as the paragraph
            under it. See the note above the font-size tokens in globals.css.
            text-6xl matches the 48px the headline-lg token was always meant
            to produce.

            The "{n} frames — click any photograph…" line under it is gone by
            request. */}
        <Reveal className="site-container mb-12 text-center" blur>
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-4xl md:text-6xl leading-tight text-on-surface">
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
