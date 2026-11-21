import { headers } from "next/headers";
import { fetchPhotos } from "@/lib/data";
import GalleryClient from "./GalleryClient";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

// Revalidate the page every 60 s (matches the fetch revalidation in data.ts).
export const revalidate = 60;

/**
 * The masonry needs a column count before the browser can say how wide the
 * screen is. Guess from the User-Agent so phones don't render three columns
 * and then jump to one; the client corrects any wrong guess on hydration.
 * The UA is only pattern-matched here — never stored, logged or echoed.
 */
function columnsFor(userAgent: string): number {
  if (/iPad|Tablet|Android(?!.*Mobile)/i.test(userAgent)) return 2;
  if (/Mobi|iPhone|iPod|Android/i.test(userAgent)) return 1;
  return 3;
}

export default async function Work({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; photo?: string }>;
}) {
  const { filter, photo } = await searchParams;
  const { photos, failed } = await fetchPhotos();
  const initialColumns = columnsFor((await headers()).get("user-agent") ?? "");
  // Only a well-formed id can open the viewer; anything else is ignored.
  const initialPhotoId = photo && /^[0-9a-f]{24}$/i.test(photo) ? photo : undefined;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper text-fg antialiased">
      <SiteNav />
      <main id="main" className="flex-grow px-margin-mobile pb-24 pt-32 md:px-margin-desktop md:pb-28 md:pt-36">
        <div className="site-container">
          <GalleryClient
            photos={photos}
            failed={failed}
            initialFilter={filter}
            initialPhotoId={initialPhotoId}
            initialColumns={initialColumns}
          />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
