import Link from "next/link";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { fetchLightbox, normaliseFilter } from "@/lib/data";
import LightboxKeys from "@/components/LightboxKeys";

export const revalidate = 60;

/**
 * Full view of one photograph (Redesign Phase B).
 *
 * Layout: the photo takes all the space above; caption and controls live in
 * their own bar below it. Nothing sits on the photograph — the old glass
 * caption pill and the bottom-centre controls were absolutely positioned and
 * covered the image on small screens.
 *
 * The <img> shares its <ViewTransition> name with its grid card, so the
 * photo grows into place from wherever it was clicked (task B10).
 */
export default async function Lightbox({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ filter?: string }>;
}) {
  const { id } = await params;
  // Untrusted query value → one of the fixed gallery filters, else "All".
  const filter = normaliseFilter((await searchParams).filter);

  // One list request gives the photo and its neighbours within the active
  // filter; see fetchLightbox for the by-id fallback.
  const { photo, prev, next, failed } = await fetchLightbox(id, filter);

  // An outage is not a missing photo. Throwing hands this to app/error.tsx
  // ("couldn't load, try again") instead of claiming the photograph is gone.
  if (failed) {
    throw new Error("The photograph could not be loaded.");
  }

  if (!photo) {
    notFound();
  }

  const filterParam = filter !== "All" ? `?filter=${encodeURIComponent(filter)}` : "";
  const lightboxHref = (photoId: string) => `/lightbox/${photoId}${filterParam}`;
  const closeHref = filter !== "All" ? `/work?filter=${encodeURIComponent(filter)}` : "/work";

  const meta = [photo.frame, photo.category, photo.year, photo.location].filter(Boolean).join(" · ");

  return (
    <div className="flex h-[100dvh] flex-col bg-paper text-fg">
      {/* Escape closes, arrows page. Renders nothing. */}
      <LightboxKeys
        prevHref={prev ? lightboxHref(prev.id) : undefined}
        nextHref={next ? lightboxHref(next.id) : undefined}
        closeHref={closeHref}
      />

      <main
        id="main"
        className="flex min-h-0 flex-1 items-center justify-center px-4 pt-4 md:px-12 md:pt-10"
      >
        <ViewTransition name={`photo-${photo.id}`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary rendition; no next/image by decision (REDESIGN.md §2) */}
          <img
            src={photo.src}
            alt={photo.alt}
            fetchPriority="high"
            decoding="async"
            className="block h-auto max-h-full w-auto max-w-full rounded-photo object-contain"
          />
        </ViewTransition>
      </main>

      <footer className="flex shrink-0 flex-col items-center gap-4 px-4 pb-5 pt-5 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center md:px-12 md:pb-8">
        <div className="min-w-0 text-center md:text-left">
          {/* The page's one heading. Visible when the owner wrote a caption;
              otherwise the frame line carries the visible text. */}
          <h1 className={photo.caption ? "truncate text-label font-medium text-fg" : "sr-only"}>
            {photo.title}
          </h1>
          <p className="frame-meta mt-1">{meta}</p>
        </div>

        <nav aria-label="Photograph" className="flex items-center gap-3">
          {prev ? (
            <Link href={lightboxHref(prev.id)} aria-label="Previous photograph" className="icon-btn">
              <ChevronLeft size={20} aria-hidden="true" />
            </Link>
          ) : (
            <span aria-hidden="true" data-inactive className="icon-btn">
              <ChevronLeft size={20} />
            </span>
          )}
          <Link href={closeHref} aria-label="Close" className="icon-btn">
            <X size={20} aria-hidden="true" />
          </Link>
          {next ? (
            <Link href={lightboxHref(next.id)} aria-label="Next photograph" className="icon-btn">
              <ChevronRight size={20} aria-hidden="true" />
            </Link>
          ) : (
            <span aria-hidden="true" data-inactive className="icon-btn">
              <ChevronRight size={20} />
            </span>
          )}
        </nav>

        <div aria-hidden="true" className="hidden md:block" />
      </footer>
    </div>
  );
}
