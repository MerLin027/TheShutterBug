import Link from "next/link";

/**
 * Shared footer for every public page (§1.4). Left: site name + year.
 * Right: link section ending in "Studio Access" — the only entry point
 * into the admin area now that the navbar's admin link is gone.
 */
export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-white/10 py-10 px-margin-mobile md:px-margin-desktop flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
      <p className="font-label-sm text-label-sm tracking-widest uppercase text-on-surface-variant/70">
        The Shutter Bug — {year}
      </p>
      <div className="flex items-center gap-6">
        <Link
          className="font-label-sm text-label-sm tracking-widest uppercase text-on-surface-variant/70 hover:text-on-surface transition-colors"
          href="/work"
        >
          Gallery
        </Link>
        <Link
          className="font-label-sm text-label-sm tracking-widest uppercase text-on-surface-variant/70 hover:text-on-surface transition-colors"
          href="/about"
        >
          About
        </Link>
        <Link
          className="font-label-sm text-label-sm tracking-widest uppercase text-on-surface-variant/70 hover:text-on-surface transition-colors"
          href="/contact"
        >
          Contact
        </Link>
        <Link
          className="font-label-sm text-label-sm tracking-widest uppercase text-primary hover:opacity-80 transition-opacity"
          href="/admin"
        >
          Studio Access
        </Link>
      </div>
    </footer>
  );
}
