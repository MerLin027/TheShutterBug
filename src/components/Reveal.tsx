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

  // Content still has to arrive — it just arrives without travelling.
  const from = reduceMotion ? { opacity: 0 } : { opacity: 0, y };
  const to = reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 };

  return (
    <motion.div
      initial={from}
      whileInView={to}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: reduceMotion ? 0.2 : 0.6,
        delay: reduceMotion ? 0 : delay,
        ease: [0.25, 1, 0.5, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
