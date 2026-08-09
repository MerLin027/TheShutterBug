"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import StudioMenu, { type StudioNavItem } from "./StudioMenu";

const NAV_ITEMS: StudioNavItem[] = [
  { href: "/admin/dashboard", label: "Gallery", icon: "photo_library" },
  { href: "/admin/dashboard/messages", label: "Messages", icon: "mail" },
  { href: "/admin/dashboard/account", label: "Account", icon: "person" },
];

/**
 * Shared Studio chrome (§1.5, §1.6): sidebar on desktop, hamburger menu on
 * mobile. Used by the Gallery dashboard, Messages, and Account pages so
 * there's one nav implementation instead of three copies.
 */
export default function StudioShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleSignOut() {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_email");
    router.replace("/admin");
  }

  return (
    <div className="bg-primary-container text-on-surface font-body-md min-h-[100dvh] antialiased selection:bg-surface-variant selection:text-on-surface">
      <div className="flex h-[100dvh] overflow-hidden">
        {/* ─── Sidebar (desktop) ──────────────────────────────────────────── */}
        <nav className="studio-sidebar hidden md:flex flex-col h-full p-4 gap-element-gap fixed left-0 top-0 w-64 z-40">
          {/* Wordmark + "Studio" read as one stacked lockup: both centred on
              the sidebar's axis, with the wordmark dropped off the very top
              edge so it sits in the panel rather than against its corner. */}
          <Link
            href="/"
            className="font-title text-[1.4rem] leading-none text-on-surface hover:text-accent transition-colors block text-center px-2 mt-4 mb-2"
          >
            The Shutter Bug
          </Link>
          <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest text-center px-2 mb-8">
            Studio
          </p>

          <div className="flex-1 flex flex-col gap-2">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${
                    active
                      ? "bg-accent/10 text-accent font-bold"
                      : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">
                    {item.icon}
                  </span>
                  <span className="font-label-sm text-label-sm uppercase">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="flex flex-col gap-2 mt-auto border-t border-white/5 pt-4">
            <Link
              href="/"
              className="flex items-center gap-4 px-4 py-3 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all group"
            >
              <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">
                arrow_back
              </span>
              <span className="font-label-sm text-label-sm uppercase">
                Back to Site
              </span>
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-4 px-4 py-3 rounded-xl text-error hover:text-error/80 hover:bg-surface-container-high transition-all group w-full text-left"
            >
              <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">
                logout
              </span>
              <span className="font-label-sm text-label-sm uppercase">
                Sign Out
              </span>
            </button>
            {/* The logged-in address used to print here (and at the foot of
                the mobile menu). Removed by request: this is a single-admin
                Studio, so it identified nothing the person reading it didn't
                already know, and it put an email address on screen in every
                screenshot and screen-share of the dashboard. */}
          </div>
        </nav>

        {/* ─── Hamburger menu (mobile) ────────────────────────────────────── */}
        <StudioMenu
          navItems={NAV_ITEMS}
          pathname={pathname}
          open={menuOpen}
          onOpenChange={setMenuOpen}
          onSignOut={handleSignOut}
        />

        {/* ─── Main content ───────────────────────────────────────────────── */}
        <main
          id="main"
          className="flex-1 md:ml-64 relative h-full overflow-y-auto overflow-x-hidden"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
