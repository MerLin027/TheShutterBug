"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Shared navbar for every public page (§1.1). Order: Home, Gallery (icon
 * button, not text), About, Contact — four peers in one type treatment.
 * No Admin link — Studio access lives in the footer only (§1.4).
 *
 * The first slot was the Playwrite VN wordmark through Stage 1; it now
 * carries the same Jost label as its siblings, so the script face appears
 * on exactly one public surface (the hero title) instead of two.
 *
 * ACCENT MEANS EXACTLY ONE THING HERE: "this is the page you're on."
 * Hover brightens the label to full-strength on-surface instead. Both
 * states used to paint the same accent gold, differing only in a 10%-alpha
 * pill wash over blurred glass — so clicking a link and moving the cursor
 * away left the item gold, which read as a hover state stuck on. It wasn't
 * stuck (`:hover` releases correctly, and focus never lingers), the two
 * states were simply the same colour. Don't give hover the accent back.
 */
export default function SiteNav() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isGallery = pathname === "/work";
  const isAbout = pathname === "/about";
  const isContact = pathname === "/contact";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center items-center w-full mt-6 px-margin-mobile md:px-margin-desktop pointer-events-none">
      {/* w-auto + max-w-full so the pill hugs its content rather than
          stretching to a fixed max-width with dead space in the middle.

          Length vs. thickness: px-6/sm:px-10 and the wider inter-group gap
          are what make the pill longer horizontally; py-2 is deliberately
          unchanged, so it gains no thickness. Budget at the narrow end —
          measured against Jost's actual advances at the 90% root, the row
          needs ~300px and a 360px viewport leaves 324px, so it holds one
          row down to 360px and stacks below that. Dropping the script
          wordmark for a label-sized "Home" freed most of that headroom. */}
      <nav className="nav-pill rounded-3xl min-[360px]:rounded-full w-auto max-w-full px-6 sm:px-10 py-2 flex flex-col min-[360px]:flex-row items-center gap-1.5 min-[360px]:gap-4 sm:gap-8 pointer-events-auto">
        {/* Home carries the same label treatment as About/Contact rather than
            the Playwrite VN wordmark it used to. It reads as a peer nav item
            now, so it gets the same active/hover pill the others do — before
            this it was the one nav item with no active state at all, even
            though `/` is a page you can be on. */}
        <Link
          aria-current={isHome ? "page" : undefined}
          className={`font-label-sm text-label-sm tracking-widest uppercase transition-all duration-300 px-3 py-1.5 rounded-full whitespace-nowrap ${
            isHome
              ? "text-accent font-bold bg-accent/10"
              : "text-on-surface/70 hover:text-on-surface hover:bg-white/10"
          }`}
          href="/"
        >
          Home
        </Link>

        {/* Hairline separator — keeps "Home" reading as the anchor rather
            than just the first of four identical labels, now that it shares
            their type treatment. Hidden in the stacked sub-360px layout,
            where a vertical rule between rows would be meaningless. */}
        <span
          aria-hidden="true"
          className="hidden min-[360px]:block w-px h-4 bg-white/15"
        />

        <div className="flex items-center gap-1.5">
          <Link
            href="/work"
            aria-label="Gallery"
            aria-current={isGallery ? "page" : undefined}
            className={`flex items-center justify-center rounded-full p-2 transition-all duration-300 active:scale-95 ${
              isGallery
                ? "text-accent bg-accent/10"
                : "text-on-surface/80 hover:text-on-surface hover:bg-white/10"
            }`}
          >
            {/* Explicit size: with no font-size of its own this icon
                inherited the 14.4px root and rendered noticeably smaller than
                the nav labels it sits beside. 20px matches the Studio
                sidebar's icons, so icons are one size site-wide. */}
            <span
              className="material-symbols-outlined text-[20px]"
              style={{
                fontVariationSettings: `'FILL' ${isGallery ? 1 : 0}, 'wght' 250`,
              }}
            >
              grid_view
            </span>
          </Link>
          <Link
            aria-current={isAbout ? "page" : undefined}
            className={`font-label-sm text-label-sm tracking-widest uppercase transition-all duration-300 px-3 py-1.5 rounded-full whitespace-nowrap ${
              isAbout
                ? "text-accent font-bold bg-accent/10"
                : "text-on-surface/70 hover:text-on-surface hover:bg-white/10"
            }`}
            href="/about"
          >
            About
          </Link>
          <Link
            aria-current={isContact ? "page" : undefined}
            className={`font-label-sm text-label-sm tracking-widest uppercase transition-all duration-300 px-3 py-1.5 rounded-full whitespace-nowrap ${
              isContact
                ? "text-accent font-bold bg-accent/10"
                : "text-on-surface/70 hover:text-on-surface hover:bg-white/10"
            }`}
            href="/contact"
          >
            Contact
          </Link>
        </div>
      </nav>
    </header>
  );
}
