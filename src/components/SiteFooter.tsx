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
    <footer className="w-full border-t border-white/10 py-10 px-margin-mobile md:px-margin-desktop flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
      <p className="font-label-sm text-label-sm tracking-widest uppercase text-on-surface-variant/70">
        The Shutter Bug — {year}
      </p>
      <Link
        className="font-label-sm text-label-sm tracking-widest uppercase text-on-surface-variant/70 hover:text-accent transition-colors"
        href="/admin"
      >
        Studio Access
      </Link>
    </footer>
  );
}
