import SiteNav from "@/components/SiteNav";
import { GALLERY_FILTERS } from "@/lib/categories";

/**
 * What /work shows while it waits for the API (Stage 5, finding L4).
 *
 * /work renders per request, and the API sits on Render's free tier: waking
 * it takes 20–50 s. Without a loading state a visitor got a blank page on a
 * direct visit, or a frozen previous page when clicking through, with no
 * sign anything was happening. This is the gallery's own shape: the same
 * heading and filters, and a contact sheet of empty frames with the quiet
 * skeleton sheen (stilled by reduced motion, globals.css).
 *
 * Deliberately NOT used for the old /lightbox/<id> route. A loading state
 * makes Next stream the response, so the status is committed as 200 before
 * the page decides: an old link answered 200 instead of 307, and a deleted
 * photo 200 instead of 404 (measured live, Stage 5). That route only checks
 * the photo and redirects to /work, which then shows this.
 */
const FRAMES = [
  // Aspect ratios like a real roll: mostly 3:2, some portrait, one square.
  [1.5, 0.75, 1.5],
  [0.8, 1.5, 1],
  [1.5, 1.5, 0.75],
];

export default function GallerySkeleton() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper text-fg antialiased">
      <SiteNav />
      <main
        id="main"
        aria-busy="true"
        className="flex-grow px-margin-mobile pb-24 pt-32 md:px-margin-desktop md:pb-28 md:pt-36"
      >
        <div className="site-container">
          <p role="status" className="sr-only">Loading the gallery</p>

          <header aria-hidden="true" className="mb-12 md:mb-16">
            <p className="caps">The collection</p>
            <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <p className="display-title">Gallery</p>
              <div className="flex flex-wrap gap-x-7 gap-y-1 opacity-40">
                {GALLERY_FILTERS.map((f) => (
                  <span key={f} className="tab">{f}</span>
                ))}
              </div>
            </div>
          </header>

          <div aria-hidden="true" className="grid items-start gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {FRAMES.map((column, c) => (
              <div
                key={c}
                className={`flex flex-col gap-y-12 ${c === 1 ? "hidden sm:flex" : ""} ${c === 2 ? "hidden lg:flex" : ""}`}
              >
                {column.map((ratio, r) => (
                  <div key={r}>
                    <div className="skeleton w-full" style={{ aspectRatio: ratio }} />
                    <div className="skeleton mt-4 h-3 w-1/3" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
