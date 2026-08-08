import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchPhoto, fetchPhotoNeighbours } from "@/lib/data";

export const revalidate = 60;

export default async function Lightbox({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ filter?: string }>;
}) {
  const { id } = await params;
  const { filter } = await searchParams;

  // Fetch the target photo and its neighbours in parallel.
  // Pass the active filter so prev/next stay within the filtered set.
  const [photo, { prev, next }] = await Promise.all([
    fetchPhoto(id),
    fetchPhotoNeighbours(id, filter),
  ]);

  // If the photo genuinely doesn't exist, use Next.js notFound().
  if (!photo) {
    notFound();
  }

  // Build helpers for constructing prev/next/close hrefs that preserve the
  // active filter when one is set.
  const filterParam = filter && filter !== "All" ? `?filter=${encodeURIComponent(filter)}` : "";
  const lightboxHref = (photoId: string) =>
    `/lightbox/${photoId}${filterParam}`;
  const closeHref = filter && filter !== "All" ? `/work?filter=${encodeURIComponent(filter)}` : "/work";


  return (
    <div className="bg-primary-container min-h-[100dvh] w-full flex items-center justify-center overflow-hidden font-body-md text-on-surface">
      {/* Main Lightbox Image Container */}
      <div className="relative w-full h-[100dvh] flex items-center justify-center p-4 md:p-12 lg:p-24">
        {/* The Image */}
        <img
          alt={photo.alt}
          className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl transition-transform duration-700 ease-out hover:scale-[1.01]"
          src={photo.src}
        />
        {/* Subtle Caption Overlay */}
        <div className="absolute bottom-8 left-8 md:bottom-12 md:left-12 max-w-sm">
          <div className="nav-pill rounded-2xl p-4 transition-opacity duration-300">
            <h2 className="font-headline-md text-headline-md text-on-surface mb-1">
              {photo.title}
            </h2>
            {photo.location && (
              <div className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm">
                <span
                  className="material-symbols-outlined text-[16px]"
                  data-icon="location_on"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  location_on
                </span>
                <span>{photo.location}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BottomNavBar (Lightbox Controls) */}
      {/* .nav-pill rather than this page's own inline glass recipe, so the
          lightbox chrome matches the navbar and the hero CTA exactly. */}
      <nav className="nav-pill fixed bottom-10 left-1/2 -translate-x-1/2 w-fit rounded-full flex gap-4 p-2 z-50">
        {/* Previous — disabled/hidden when only one photo */}
        {prev ? (
          <Link
            href={lightboxHref(prev.id)}
            aria-label="Previous"
            className="flex flex-col items-center justify-center text-on-surface-variant px-6 py-2 transition-colors hover:text-accent group"
          >
            <span
              className="material-symbols-outlined group-active:scale-95 transition-transform duration-200"
              data-icon="arrow_back_ios"
            >
              arrow_back_ios
            </span>
            <span className="font-label-sm text-label-sm mt-1 opacity-0 h-0 group-hover:opacity-100 group-hover:h-auto transition-all duration-300 overflow-hidden">
              Previous
            </span>
          </Link>
        ) : (
          <span
            aria-hidden
            className="flex flex-col items-center justify-center text-on-surface-variant/20 px-6 py-2 cursor-not-allowed"
          >
            <span
              className="material-symbols-outlined"
              data-icon="arrow_back_ios"
            >
              arrow_back_ios
            </span>
          </span>
        )}

        {/* Info */}
        <button
          aria-label="Info"
          className="flex flex-col items-center justify-center text-on-surface-variant px-6 py-2 transition-colors hover:text-accent group"
        >
          <span
            className="material-symbols-outlined group-active:scale-95 transition-transform duration-200"
            data-icon="info"
          >
            info
          </span>
          <span className="font-label-sm text-label-sm mt-1 opacity-0 h-0 group-hover:opacity-100 group-hover:h-auto transition-all duration-300 overflow-hidden">
            Info
          </span>
        </button>

        {/* Close (X) */}
        <Link
          href={closeHref}
          aria-label="Close"
          className="flex flex-col items-center justify-center text-on-surface-variant px-6 py-2 transition-colors hover:text-accent group"
        >
          <span
            className="material-symbols-outlined group-active:scale-95 transition-transform duration-200"
            data-icon="close"
          >
            close
          </span>
          <span className="font-label-sm text-label-sm mt-1 opacity-0 h-0 group-hover:opacity-100 group-hover:h-auto transition-all duration-300 overflow-hidden">
            Close
          </span>
        </Link>

        {/* Next */}
        {next ? (
          <Link
            href={lightboxHref(next.id)}
            aria-label="Next"
            className="flex flex-col items-center justify-center text-on-surface-variant px-6 py-2 transition-colors hover:text-accent group"
          >
            <span
              className="material-symbols-outlined group-active:scale-95 transition-transform duration-200"
              data-icon="arrow_forward_ios"
            >
              arrow_forward_ios
            </span>
            <span className="font-label-sm text-label-sm mt-1 opacity-0 h-0 group-hover:opacity-100 group-hover:h-auto transition-all duration-300 overflow-hidden">
              Next
            </span>
          </Link>
        ) : (
          <span
            aria-hidden
            className="flex flex-col items-center justify-center text-on-surface-variant/20 px-6 py-2 cursor-not-allowed"
          >
            <span
              className="material-symbols-outlined"
              data-icon="arrow_forward_ios"
            >
              arrow_forward_ios
            </span>
          </span>
        )}
      </nav>
    </div>
  );
}
