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
      <nav className="nav-pill rounded-full mx-auto w-full max-w-6xl px-10 py-2.5 flex items-center justify-between gap-8 pointer-events-auto">
        <Link
          className="font-title text-headline-md tracking-tight text-on-surface hover:text-primary transition-colors"
          href="/"
        >
          The Shutter Bug
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/work"
            aria-label="Gallery"
            className={`flex items-center justify-center rounded-full p-2 transition-all duration-300 scale-105 active:scale-95 ${
              isGallery
                ? "text-primary bg-white/15"
                : "text-on-surface/80 hover:text-on-surface hover:bg-white/10"
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
            className={`font-label-sm text-label-sm tracking-widest uppercase transition-all duration-300 px-3 py-1.5 rounded-full ${
              isAbout
                ? "text-primary font-bold bg-white/10"
                : "text-on-surface/70 hover:text-on-surface hover:bg-white/10"
            }`}
            href="/about"
          >
            About
          </Link>
          <Link
            className={`font-label-sm text-label-sm tracking-widest uppercase transition-all duration-300 px-3 py-1.5 rounded-full ${
              isContact
                ? "text-primary font-bold bg-white/10"
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
