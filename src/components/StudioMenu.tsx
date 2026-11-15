"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { LogOut, Menu, X, type LucideIcon } from "lucide-react";

export type StudioNavItem = { href: string; label: string; icon: LucideIcon };

/**
 * Studio menu below `md`: a button in the top bar's corner opens a full
 * sheet with the same rows as the desktop sidebar.
 *
 * Phase C: the Framer Motion directional slide-in is gone (it was the last
 * thing in the project using Framer Motion). The sheet fades and rises a
 * few pixels in CSS — unslop's rule for menus — and simply disappears on
 * close. Escape closes it, focus moves into it on open and back to the
 * button on close, and the page behind cannot scroll.
 */
export default function StudioMenu({
  navItems,
  pathname,
  open,
  onOpenChange,
  onSignOut,
}: {
  navItems: StudioNavItem[];
  pathname: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignOut: () => void;
}) {
  const openButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      closeButton.current?.focus();
    } else if (wasOpen.current) {
      wasOpen.current = false;
      openButton.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
      }
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [open, onOpenChange]);

  return (
    <>
      <button
        ref={openButton}
        type="button"
        onClick={() => onOpenChange(true)}
        className="tool-btn fixed left-3 top-3 z-40 size-11 md:hidden"
        aria-label="Open menu"
        aria-expanded={open}
      >
        <Menu size={20} aria-hidden="true" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Studio menu"
          className="studio-sheet fixed inset-0 z-[90] flex flex-col bg-paper-deep px-3 pb-6 pt-3 md:hidden"
        >
          <div className="mb-10 flex items-center justify-between pl-3">
            <Link href="/" onClick={() => onOpenChange(false)} className="block">
              <span className="wordmark block">The Shutter Bug</span>
              <span className="caps mt-1.5 block">Studio</span>
            </Link>
            <button
              ref={closeButton}
              type="button"
              onClick={() => onOpenChange(false)}
              className="tool-btn size-11"
              aria-label="Close menu"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          <ul className="flex flex-col">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={pathname === item.href ? "page" : undefined}
                  onClick={() => onOpenChange(false)}
                  className="studio-nav-row h-14 !text-lead"
                >
                  <item.icon size={18} aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <ul className="mt-auto flex flex-col border-t border-line pt-4">
            <li>
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  onSignOut();
                }}
                className="studio-nav-row h-12 w-full"
              >
                <LogOut size={18} aria-hidden="true" />
                Sign out
              </button>
            </li>
          </ul>
        </div>
      )}
    </>
  );
}
