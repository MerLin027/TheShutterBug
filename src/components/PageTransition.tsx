"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Single page-transition wrapper, mounted once in the root layout so every
 * route change animates identically rather than some routes animating and
 * others not.
 *
 * Two deliberate constraints:
 *
 * 1. It animates OPACITY ONLY — never transform. A transform on an ancestor
 *    creates a containing block for `position: fixed` descendants, which
 *    would break the fixed navbar (SiteNav) and the fixed Studio sidebar,
 *    re-anchoring them to this wrapper instead of the viewport. Opacity
 *    creates a stacking context but not a containing block, so it's safe.
 *    The y-axis motion lives in <Reveal>, inside page content where no
 *    fixed elements are affected.
 *
 * 2. Enter-only, with `mode="wait"` omitted. Next's App Router unmounts the
 *    outgoing route before AnimatePresence can drive an exit animation, so
 *    an exit variant here would be declared but never actually play. Keying
 *    on pathname gives a reliable fade-in on every navigation instead.
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  // Reduced motion collapses the duration; it does not change what renders.
  // useReducedMotion resolves to `null` on the server and `true` on the
  // client's first pass, so branching either the element tree (returning bare
  // children) or `initial` would emit different HTML at hydration than at
  // SSR — around the whole page, in this component's case. `initial` is the
  // only one of these props serialised into the markup, so it stays constant
  // and the fade simply completes in a single frame instead.
  return (
    <AnimatePresence initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.3, ease: [0.25, 1, 0.5, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
