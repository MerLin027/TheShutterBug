/**
 * Public footer: the serif wordmark and a line about the work on the left,
 * the year on the right, on a hairline. No links (owner's request,
 * 2026-11-15 — the navbar already carries them) and no Studio link (the
 * Studio is reached from a bookmark).
 */
export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto px-margin-mobile md:px-margin-desktop">
      <div className="site-container flex flex-col gap-6 border-t border-line py-12 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="wordmark">The Shutter Bug</p>
          <p className="lede mt-2 !text-base">Light, absence, and the edges of the day</p>
        </div>
        <p className="caps">© {year}</p>
      </div>
    </footer>
  );
}
