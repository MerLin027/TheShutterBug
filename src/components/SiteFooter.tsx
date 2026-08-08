import Link from "next/link";

/**
 * Shared footer for every public page. Exactly two elements: site name +
 * year on the left, "Studio Access" on the right. The Gallery/About/Contact
 * links that used to sit here were straight duplicates of the navbar, which
 * the navbar already carries on every page.
 */
export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full px-margin-mobile md:px-margin-desktop relative z-10">
      {/* The rule is inside the container rather than full-bleed, so it ends
          where the content ends. A full-width rule under inset content still
          reads as edge-to-edge, which is the thing being fixed here. */}
      <div className="site-container border-t border-white/10 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="font-label-sm text-label-sm tracking-widest uppercase text-on-surface-variant/70">
          The Shutter Bug — {year}
        </p>
        <Link
          className="font-label-sm text-label-sm tracking-widest uppercase text-on-surface-variant/70 hover:text-accent transition-colors"
          href="/admin"
        >
          Studio Access
        </Link>
      </div>
    </footer>
  );
}
