import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

/**
 * Custom 404. Next's default is an unstyled page, which on a dark portfolio
 * reads as the site having broken rather than as a wrong URL — and it
 * strands the visitor. /lightbox/[id] calls notFound() for a photo id that
 * no longer exists, so this is a route people genuinely reach.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper text-fg antialiased">
      <SiteNav />

      <main
        id="main"
        className="flex flex-1 items-center px-margin-mobile pb-24 pt-28 md:px-margin-desktop md:pt-36"
      >
        <div className="site-container enter">
          <p className="frame-meta">404 · Empty frame</p>
          <h1 className="mt-3 text-title-sm font-medium text-fg md:text-title">
            Nothing in this frame
          </h1>
          <p className="mt-4 max-w-[34rem] text-lead text-fg-2">
            The page you were looking for isn&apos;t here. It may have moved,
            or the photograph may no longer be in the collection.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <Link href="/work" className="btn btn-primary">
              Browse the gallery
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link href="/" className="btn btn-text">
              Back home
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
