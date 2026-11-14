/**
 * Public footer. One line: name and year.
 *
 * The "Studio Access" link that sat on the right is gone by the owner's
 * decision (REDESIGN.md §2, decision 4; old markup in §3.2). The Studio is
 * reached from a bookmark at /admin. This is not a security measure — the
 * login itself is what protects it — it just stops advertising the door.
 */
export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto px-margin-mobile md:px-margin-desktop">
      <div className="site-container border-t border-line py-8">
        <p className="text-label text-fg-3">The Shutter Bug · {year}</p>
      </div>
    </footer>
  );
}
