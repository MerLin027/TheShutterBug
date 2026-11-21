import { fetchPhotos } from "@/lib/data";
import GalleryClient from "./GalleryClient";
import SiteFooter from "@/components/SiteFooter";

// The data refreshes every 60 s (the fetch revalidation in data.ts). The page
// itself renders per request, because it reads ?filter= and ?photo=.
//
// It no longer reads the User-Agent: that guessed the masonry column count,
// and a wrong guess moved every card after load. PhotoBrowser now sends all
// three arrangements and CSS shows the right one (2026-11-21 audit).

export default async function Work({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; photo?: string }>;
}) {
  const { filter, photo } = await searchParams;
  const { photos, failed } = await fetchPhotos();
  // Only a well-formed id can open the viewer; anything else is ignored.
  const initialPhotoId = photo && /^[0-9a-f]{24}$/i.test(photo) ? photo : undefined;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper text-fg antialiased">
      <main id="main" className="flex-grow px-margin-mobile pb-24 pt-24 md:px-margin-desktop md:pb-28 md:pt-36">
        <div className="site-container">
          <GalleryClient
            photos={photos}
            failed={failed}
            initialFilter={filter}
            initialPhotoId={initialPhotoId}
          />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
