import Link from "next/link";

/**
 * Public footer (Phase R): the serif wordmark and a line about the work on
 * the left, the three links and the year on the right, on a hairline. No
 * Studio link (owner's decision; the Studio is reached from a bookmark).
 */
export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto px-margin-mobile md:px-margin-desktop">
      <div className="site-container flex flex-col gap-8 border-t border-line py-12 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="wordmark">The Shutter Bug</p>
          <p className="lede mt-2 !text-base">Light, absence, and the edges of the day</p>
        </div>
        <div className="flex flex-col gap-3 md:items-end">
          <nav aria-label="Footer" className="flex gap-7">
            <Link href="/work" className="nav-link !h-auto">Gallery</Link>
            <Link href="/about" className="nav-link !h-auto">About</Link>
            <Link href="/contact" className="nav-link !h-auto">Contact</Link>
          </nav>
          <p className="caps">© {year}</p>
        </div>
      </div>
    </footer>
  );
}
