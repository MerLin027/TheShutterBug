"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

export type StudioNavItem = { href: string; label: string; icon: string };

/**
 * Admin-only hamburger menu (§1.6), shown below `md`. Items slide in
 * directionally relative to the current page's position in the nav order —
 * items below the active page slide up from below, items above slide down
 * from above. Timing matches the glass-interaction language already used
 * elsewhere (duration-300 equivalent), so there's one animation system.
 */
export default function StudioMenu({
  navItems,
  pathname,
  email,
  open,
  onOpenChange,
  onSignOut,
}: {
  navItems: StudioNavItem[];
  pathname: string;
  email: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignOut: () => void;
}) {
  const activeIndex = navItems.findIndex((item) => item.href === pathname);

  return (
    <>
      <button
        onClick={() => onOpenChange(true)}
        className="md:hidden fixed top-6 left-6 z-40 p-3 rounded-full nav-pill text-on-surface"
        aria-label="Open menu"
      >
        <span className="material-symbols-outlined">menu</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden fixed inset-0 z-[90] admin-modal-backdrop flex flex-col"
            onClick={(e) => {
              if (e.target === e.currentTarget) onOpenChange(false);
            }}
          >
            <div className="flex flex-col h-full p-8 gap-2 bg-surface-container-lowest/95">
              <div className="flex items-center justify-between mb-10">
                <Link
                  href="/"
                  className="font-title text-headline-md text-on-surface"
                  onClick={() => onOpenChange(false)}
                >
                  The Shutter Bug
                </Link>
                <button
                  onClick={() => onOpenChange(false)}
                  className="p-2 rounded-full text-on-surface hover:bg-white/10 transition-colors"
                  aria-label="Close menu"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="flex-1 flex flex-col gap-2">
                {navItems.map((item, i) => {
                  const active = pathname === item.href;
                  const fromY = i > activeIndex ? 32 : i < activeIndex ? -32 : 0;
                  return (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, y: fromY }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.3,
                        delay: 0.05 * i,
                        ease: [0.25, 1, 0.5, 1],
                      }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => onOpenChange(false)}
                        className={`flex items-center gap-4 px-4 py-4 rounded-lg transition-all ${
                          active
                            ? "bg-secondary-container text-on-secondary-container font-bold"
                            : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {item.icon}
                        </span>
                        <span className="font-label-sm text-label-sm uppercase tracking-widest">
                          {item.label}
                        </span>
                      </Link>
                    </motion.div>
                  );
                })}
                <motion.button
                  initial={{ opacity: 0, y: 32 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: 0.05 * navItems.length,
                    ease: [0.25, 1, 0.5, 1],
                  }}
                  onClick={() => {
                    onOpenChange(false);
                    onSignOut();
                  }}
                  className="flex items-center gap-4 px-4 py-4 rounded-lg text-error hover:bg-surface-container-high transition-all text-left"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    logout
                  </span>
                  <span className="font-label-sm text-label-sm uppercase tracking-widest">
                    Sign Out
                  </span>
                </motion.button>
              </div>

              {email && (
                <p className="font-label-sm text-label-sm text-on-surface-variant/70 pt-4 border-t border-white/5 truncate">
                  {email}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
