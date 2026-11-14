"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/work", label: "Gallery" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

/**
 * Public navbar (Redesign Phase B). Wordmark left, three links right, in one
 * glass bar — the only glass left on the public site.
 *
 * The wordmark is the Home link; the separate "Home" item and the grid-icon
 * Gallery button are gone (REDESIGN.md §3.5 has the old layout). The wordmark
 * is set in Jost now, not the Playwrite VN script (decision 3, §3.3).
 *
 * The accent means exactly one thing here: "this is the page you're on".
 * Hover only brightens the label to full-strength text.
 */
export default function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-margin-mobile pt-3 md:px-margin-desktop md:pt-5">
      <nav
        aria-label="Primary"
        className="site-container site-nav pointer-events-auto flex h-14 items-center justify-between pl-4 pr-1.5 sm:pl-5 sm:pr-2"
      >
        <Link
          href="/"
          aria-current={pathname === "/" ? "page" : undefined}
          className="whitespace-nowrap text-lead font-medium leading-none tracking-[-0.01em] text-fg"
        >
          The Shutter Bug
        </Link>

        <ul className="flex items-center">
          {LINKS.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex h-11 items-center rounded-control px-2 text-label font-medium transition-colors sm:px-3 ${
                    active ? "text-accent" : "text-fg-2 hover:text-fg"
                  }`}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
