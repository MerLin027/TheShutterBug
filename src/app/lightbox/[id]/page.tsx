import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchPhoto, fetchPhotoNeighbours } from "@/lib/data";
import LightboxKeys from "@/components/LightboxKeys";

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
      {/* Escape closes, arrows page. Renders nothing. */}
      <LightboxKeys
        prevHref={prev ? lightboxHref(prev.id) : undefined}
        nextHref={next ? lightboxHref(next.id) : undefined}
        closeHref={closeHref}
      />

      {/* Main Lightbox Image Container. <main id="main"> because the root
          layout renders the skip link on every route including this one, and
          it had no target here. */}
      <main
        id="main"
        className="relative w-full h-[100dvh] flex items-center justify-center p-4 md:p-12 lg:p-24"
      >
        {/* The Image */}
        <img
          alt={photo.alt}
          className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl transition-transform duration-700 ease-out hover:scale-[1.01]"
          src={photo.src}
        />
        {/* Subtle Caption Overlay */}
        <div className="absolute bottom-8 left-8 md:bottom-12 md:left-12 max-w-sm">
          <div className="nav-pill rounded-2xl p-4 transition-opacity duration-300">
            {/* <h1>, not <h2> — this is the page's only heading, and it was
                starting the document outline at level 2. */}
            <h1 className="font-headline-md text-headline-md text-on-surface mb-1">
              {photo.title}
            </h1>
            {photo.location && (
              <div className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm">
                <span
                  className="material-symbols-outlined text-[16px]"
                  style={{ fontVariationSettings: "'FILL' 1, 'wght' 250" }}
                >
                  location_on
                </span>
                <span>{photo.location}</span>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Lightbox controls.

          Three equal glass circles, the same button the Studio's card
          overlays and modal closes use, one size up. What they replaced was
          three square-cornered rectangles of three different widths (96.6,
          78.6 and 72.6px measured), each carrying a caption that was clipped
          to zero height until hover and then expanded — so the row changed
          size under the cursor, and the "matching set" of prev/close/next
          never actually matched.

          No pill around them: a blurred bar behind three blurred buttons is
          the glass-inside-glass this site deliberately avoids elsewhere.

          Navigation is unchanged — same hrefs, same filter preservation, same
          keyboard handling in LightboxKeys. chevron rather than
          arrow_back_ios: the `_ios` glyphs carry asymmetric side bearings and
          sit visibly off-centre once the box around them is a fixed circle. */}
      <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 w-fit flex items-center gap-3 z-50">
        {/* Previous — inert placeholder when there's nothing before this */}
        {prev ? (
          <Link
            href={lightboxHref(prev.id)}
            aria-label="Previous"
            title="Previous"
            className="btn-icon-glass-lg text-on-surface"
          >
            <span className="material-symbols-outlined">
              chevron_left
            </span>
          </Link>
        ) : (
          <span aria-hidden data-inactive className="btn-icon-glass-lg text-on-surface">
            <span className="material-symbols-outlined">
              chevron_left
            </span>
          </span>
        )}

        {/* The "Info" button that used to sit here is gone. It had no
            onClick — it hovered, it labelled itself, it did nothing — and the
            only thing it could plausibly have toggled (title + location) is
            already permanently visible in the caption pill above. Prev /
            Close / Next is the complete set of actions this view has. */}

        {/* Close (X) */}
        <Link
          href={closeHref}
          aria-label="Close"
          title="Close"
          className="btn-icon-glass-lg text-on-surface"
        >
          <span className="material-symbols-outlined">
            close
          </span>
        </Link>

        {/* Next */}
        {next ? (
          <Link
            href={lightboxHref(next.id)}
            aria-label="Next"
            title="Next"
            className="btn-icon-glass-lg text-on-surface"
          >
            <span className="material-symbols-outlined">
              chevron_right
            </span>
          </Link>
        ) : (
          <span aria-hidden data-inactive className="btn-icon-glass-lg text-on-surface">
            <span className="material-symbols-outlined">
              chevron_right
            </span>
          </span>
        )}
      </nav>
    </div>
  );
}
