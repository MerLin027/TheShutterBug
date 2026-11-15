"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ArrowUpRight, FileText, House, Images, LayoutGrid, LogOut, Mail, KeyRound } from "lucide-react";
import { useAdminToken } from "@/lib/useAdminToken";
import StudioMenu, { type StudioNavGroup } from "./StudioMenu";

/**
 * Studio information architecture (reorganised 2026-11-15):
 *   Overview      — the landing screen: what's on the site, what's new.
 *   Photographs   — the collection (upload, edit, order, feature).
 *   Messages      — the contact-form inbox.
 *   Pages · Home  — hero photograph, "The work", Selected work.
 *   Pages · About — bio, heading, portrait.
 * Content you manage as a collection is in the first group; the copy and
 * images of individual public pages are under "Pages", named after the page.
 */
export const NAV_GROUPS: StudioNavGroup[] = [
  {
    items: [
      { href: "/admin/dashboard", label: "Overview", icon: LayoutGrid },
      { href: "/admin/dashboard/photos", label: "Photographs", icon: Images },
      { href: "/admin/dashboard/messages", label: "Messages", icon: Mail },
    ],
  },
  {
    label: "Pages",
    items: [
      { href: "/admin/dashboard/home", label: "Home", icon: House },
      { href: "/admin/dashboard/about", label: "About", icon: FileText },
    ],
  },
  {
    label: "Settings",
    items: [{ href: "/admin/dashboard/account", label: "Account", icon: KeyRound }],
  },
];

/**
 * Studio chrome (Redesign Phase C): sidebar on desktop, menu sheet on
 * mobile, shared by Gallery, Messages and Account.
 *
 * A 16rem (≈230px) sidebar on the deepest surface with the serif wordmark
 * from the public site. The active row is full-strength text with a short
 * gold rule at its left edge (Studio refinement, 2026-11-15) — no surface
 * blocks, so it reads like the public navbar rather than an admin template.
 */
export default function StudioShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Sign-out lives in useAdminToken alongside the read, so "what counts as a
  // session" is defined in one place. redirectWhenMissing is off because the
  // page inside this shell already owns that guard — two copies would race.
  const { signOut } = useAdminToken({ redirectWhenMissing: false });

  return (
    <div className="min-h-[100dvh] bg-paper text-fg antialiased">
      <div className="flex h-[100dvh] overflow-hidden">
        <nav
          aria-label="Studio"
          className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line bg-paper-deep px-3 py-6 md:flex"
        >
          <Link href="/" className="mb-10 block px-3 pt-1">
            <span className="wordmark block">The Shutter Bug</span>
            <span className="caps mt-2 block">Studio</span>
          </Link>

          {NAV_GROUPS.map((group, g) => (
            <div key={g} className={g > 0 ? "mt-7" : ""}>
              {group.label && <p className="caps mb-2 px-3.5 !text-[0.6875rem]">{group.label}</p>}
              <ul className="flex flex-col">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={pathname === item.href ? "page" : undefined}
                      className="studio-nav-row"
                    >
                      <item.icon size={18} aria-hidden="true" />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <ul className="mt-auto flex flex-col border-t border-line pt-4">
            <li>
              <Link href="/" className="studio-nav-row">
                <ArrowUpRight size={18} aria-hidden="true" />
                View the site
              </Link>
            </li>
            <li>
              <button type="button" onClick={signOut} className="studio-nav-row w-full">
                <LogOut size={18} aria-hidden="true" />
                Sign out
              </button>
            </li>
          </ul>
          {/* No signed-in address here, by the owner's earlier request: in a
              single-admin Studio it identified nothing, and it put an email
              address in every screenshot and screen-share. */}
        </nav>

        <StudioMenu
          navGroups={NAV_GROUPS}
          pathname={pathname}
          open={menuOpen}
          onOpenChange={setMenuOpen}
          onSignOut={signOut}
        />

        <main id="main" className="relative h-full flex-1 overflow-y-auto overflow-x-hidden md:ml-64">
          {children}
        </main>
      </div>
    </div>
  );
}
