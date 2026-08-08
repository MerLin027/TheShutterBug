import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import Reveal from "@/components/Reveal";

/**
 * Custom 404. Next's default is an unstyled black-on-white page, which on a
 * dark portfolio reads as the site having broken rather than as a wrong URL —
 * and it strands the visitor with no way back. `/lightbox/[id]` already calls
 * notFound() for a photo id that no longer exists, so this is a route people
 * genuinely reach.
 */
export default function NotFound() {
  return (
    <div className="bg-primary-container text-on-surface font-body-md antialiased min-h-[100dvh] flex flex-col">
      <SiteNav />

      <main
        id="main"
        className="site-container flex-grow flex flex-col items-center justify-center text-center px-margin-mobile md:px-margin-desktop pt-32 md:pt-40 pb-section-gap"
      >
        <Reveal className="space-y-6 max-w-md" blur>
          <span className="block font-label-sm text-label-sm uppercase tracking-widest text-accent">
            404
          </span>
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">
            Nothing in this frame
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            The page you were looking for isn&apos;t here. It may have been
            moved, or the photograph may no longer be in the collection.
          </p>
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/work"
              className="btn-glass group pl-8 pr-2 py-2 font-label-sm text-label-sm tracking-widest uppercase text-on-surface flex items-center gap-4"
            >
              Browse the Gallery
              <span className="btn-icon-nest">
                <span className="material-symbols-outlined text-[18px]">
                  arrow_forward
                </span>
              </span>
            </Link>
            <Link
              href="/"
              className="px-5 py-3.5 font-label-sm text-label-sm tracking-widest uppercase text-on-surface-variant hover:text-accent transition-colors"
            >
              Back Home
            </Link>
          </div>
        </Reveal>
      </main>

      <SiteFooter />
    </div>
  );
}
