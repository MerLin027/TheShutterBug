"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ArrowLeft, House, Images, LogOut, Mail, User } from "lucide-react";
import { useAdminToken } from "@/lib/useAdminToken";
import StudioMenu, { type StudioNavItem } from "./StudioMenu";

const NAV_ITEMS: StudioNavItem[] = [
  { href: "/admin/dashboard", label: "Gallery", icon: Images },
  { href: "/admin/dashboard/home", label: "Home page", icon: House },
  { href: "/admin/dashboard/messages", label: "Messages", icon: Mail },
  { href: "/admin/dashboard/account", label: "Account", icon: User },
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

          <p className="caps mb-2 px-3.5 !text-[0.6875rem]">Manage</p>
          <ul className="flex flex-col">
            {NAV_ITEMS.map((item) => (
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

          <ul className="mt-auto flex flex-col border-t border-line pt-4">
            <li>
              <Link href="/" className="studio-nav-row">
                <ArrowLeft size={18} aria-hidden="true" />
                Back to site
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
          navItems={NAV_ITEMS}
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
