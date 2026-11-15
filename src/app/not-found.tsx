import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

/**
 * Custom 404. Next's default is an unstyled page that reads as the site
 * having broken, and it strands the visitor. Old /lightbox/<id> links to a
 * deleted photo land here.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper text-fg antialiased">
      <SiteNav />
      <main id="main" className="flex flex-1 items-center px-margin-mobile pb-28 pt-36 md:px-margin-desktop">
        <div className="site-container">
          <p className="caps enter">404 · Empty frame</p>
          <h1 className="display-title enter mt-5 max-w-[14ch]" style={{ "--i": 1 } as CSSProperties}>
            Nothing in this frame
          </h1>
          <p className="lede enter mt-6 max-w-[32rem]" style={{ "--i": 2 } as CSSProperties}>
            The page you were looking for isn&apos;t here. It may have moved, or
            the photograph may no longer be in the collection.
          </p>
          <div className="enter mt-8 flex flex-wrap items-center gap-8" style={{ "--i": 3 } as CSSProperties}>
            <Link href="/work" className="text-link">
              Browse the gallery
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link href="/" className="text-link !text-fg-2">
              Back home
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
