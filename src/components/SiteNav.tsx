"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";

/**
 * The wordmark as letter spans, for Home only, where it "develops" into place
 * as the hero scrolls away (`.wordmark-docked` in globals.css). One wrapper
 * span, so the phone wordmark (a flex box) keeps the spaces between words.
 */
function WordmarkLetters() {
  let n = 0;
  return (
    <span className="wordmark-text">
      {"The Shutter Bug".split(" ").map((word, w) => (
        <span key={word}>
          {w > 0 && " "}
          {[...word].map((ch) => {
            const i = n++;
            return (
              <span key={i} className="wm-char" style={{ "--i": i } as CSSProperties}>
                {ch}
              </span>
            );
          })}
        </span>
      ))}
    </span>
  );
}

const LINKS = [
  { href: "/work", label: "Gallery" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

/**
 * Public navbar (Phase R). No box: a serif wordmark on the left and
 * small-caps links on the right, each with an underline that draws in on
 * hover; the current page keeps a gold underline.
 *
 * Over the hero it is transparent; as the page scrolls a solid, softly
 * blurred band fades in behind it (pure CSS scroll-driven animation —
 * `.site-header::before` in globals.css — so it costs no JavaScript).
 *
 * Phones get a "Menu" button that opens a full-screen sheet of large serif
 * links rising in one after another. Escape closes it, focus moves in and
 * back out, and the page behind can't scroll.
 */
export default function SiteNav() {
  const pathname = usePathname();
  // One navbar for the whole public site, rendered by the root layout so it
  // persists across page changes (2026-11-21). Each page used to render its
  // own copy, so it was rebuilt on every navigation: nothing could animate
  // between pages, and with per-page scales it visibly jumped. The Studio
  // has its own chrome.
  const hidden = pathname.startsWith("/admin");
  const [open, setOpen] = useState(false);
  const openButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeButton.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const opener = openButton.current;
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
      opener?.focus();
    };
  }, [open]);

  if (hidden) return null;

  return (
    <header className="site-header px-margin-mobile md:px-margin-desktop">
      {/* Gutters on the header, container inside — the same structure as
          every page, so the wordmark lines up with the content below it. */}
      <nav
        aria-label="Primary"
        className="site-container relative flex h-[4.75rem] items-center justify-between"
      >
        {/* On Home the wordmark fades in as the hero title fades away
            (`.wordmark-docked`, scroll-driven CSS in globals.css). */}
        <Link
          href="/"
          className={pathname === "/" ? "wordmark wordmark-docked" : "wordmark"}
          aria-current={pathname === "/" ? "page" : undefined}
        >
          {pathname === "/" ? <WordmarkLetters /> : "The Shutter Bug"}
        </Link>

        <ul className="hidden items-center gap-9 sm:flex">
          {LINKS.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className="nav-link"
                aria-current={pathname === href ? "page" : undefined}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <button
          ref={openButton}
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="site-menu"
          className="nav-link sm:hidden"
        >
          Menu
        </button>
      </nav>

      {open && (
        <div id="site-menu" role="dialog" aria-modal="true" aria-label="Menu" className="menu-sheet">
          <div className="flex h-[4.75rem] items-center justify-between px-margin-mobile">
            <Link href="/" className="wordmark" onClick={() => setOpen(false)}>
              The Shutter Bug
            </Link>
            <button
              ref={closeButton}
              type="button"
              onClick={() => setOpen(false)}
              className="nav-link"
            >
              Close
            </button>
          </div>
          <ul className="flex flex-1 flex-col justify-center gap-2 px-margin-mobile pb-16">
            {[{ href: "/", label: "Home" }, ...LINKS].map(({ href, label }, i) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  aria-current={pathname === href ? "page" : undefined}
                  className="menu-link py-1"
                  style={{ "--i": i } as CSSProperties}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="caps px-margin-mobile pb-8">Nature · Objects · Monochrome · Urban</p>
        </div>
      )}
    </header>
  );
}
