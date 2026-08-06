"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Shared navbar for every public page (§1.1). Order: title, Gallery (icon
 * button, not text), About, Contact. No Home item — the title serves that
 * role. No Admin link — Studio access lives in the footer only (§1.4).
 */
export default function SiteNav() {
  const pathname = usePathname();
  const isGallery = pathname === "/work";
  const isAbout = pathname === "/about";
  const isContact = pathname === "/contact";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center items-center w-full mt-6 px-margin-mobile md:px-margin-desktop pointer-events-none">
      {/* w-auto + max-w-full so the pill hugs its content rather than
          stretching to a fixed max-width with dead space in the middle. */}
      <nav className="nav-pill rounded-full w-auto max-w-full px-7 py-2 flex items-center gap-7 pointer-events-auto">
        {/* Berkshire Swash has a low x-height (0.507em; x-height/cap 0.559,
            vs ~0.73 for a UI sans), so at the previous 24px its lowercase
            rendered ~12px and the swash detail broke down. 28px brings the
            x-height back to ~14px. Tracking must stay positive — the
            ornamental terminals collide under the old tracking-tight. */}
        <Link
          className="font-title text-[28px] leading-none tracking-[0.012em] text-on-surface hover:text-accent transition-colors whitespace-nowrap"
          href="/"
        >
          The Shutter Bug
        </Link>

        <div className="flex items-center gap-1.5">
          <Link
            href="/work"
            aria-label="Gallery"
            aria-current={isGallery ? "page" : undefined}
            className={`flex items-center justify-center rounded-full p-2 transition-all duration-300 active:scale-95 ${
              isGallery
                ? "text-accent bg-accent/10"
                : "text-on-surface/80 hover:text-accent hover:bg-white/10"
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: `'FILL' ${isGallery ? 1 : 0}` }}
            >
              grid_view
            </span>
          </Link>
          <Link
            aria-current={isAbout ? "page" : undefined}
            className={`font-label-sm text-label-sm tracking-widest uppercase transition-all duration-300 px-3 py-1.5 rounded-full whitespace-nowrap ${
              isAbout
                ? "text-accent font-bold bg-accent/10"
                : "text-on-surface/70 hover:text-accent hover:bg-white/10"
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
                : "text-on-surface/70 hover:text-accent hover:bg-white/10"
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
