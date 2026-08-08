"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Single scroll-in animation primitive (§1.10), reused everywhere instead
 * of building a bespoke animation per section.
 *
 * Honours prefers-reduced-motion: Framer Motion drives these as inline
 * transforms, not CSS transitions, so the global reduced-motion block in
 * globals.css cannot reach them — the gate has to live here.
 *
 * The gate deliberately touches ONLY `transition`, never `initial`/`animate`.
 * useReducedMotion resolves to `null` during SSR (motion-dom's initialiser
 * bails out when there's no window) and to `true` on the client's first pass,
 * so branching `initial` would emit a different inline style on the server
 * than at hydration and trip a mismatch on every Reveal on the page. Only
 * `initial` is serialised into the HTML, so collapsing the duration instead
 * keeps the markup identical either way — and still means no perceptible
 * movement, because the travel happens in a single frame.
 */
export default function Reveal({
  children,
  delay = 0,
  className,
  y = 24,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: reduceMotion ? 0 : 0.6,
        delay: reduceMotion ? 0 : delay,
        ease: [0.25, 1, 0.5, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
