"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const HERO_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBN4WALWq_emxJIYSU6-Ph6fTn37OTV7OLsoCQ18yhMT1Ch35bNiLM4PlaQGpX7yMywVF0SKr_lWFJ0A6ljA2Yse8ng0wVoQcgD1VWlj6NH6Vg-IzAvUuJumBOqGqNybIThpITt94pICLEZ8H6K_d4Wb02uA12APN9PrHFTTgDRm8p5-amoOw1XUMQii1fxOS90Sa87ajqewjmm2EyiY2NfdJGKNZS3vFiAIkpfpm1A2Y83s1FHV9wH";

/**
 * Home hero (§1.2): background image + parallax scroll, glass-panelled
 * title, subtitle, and the new "Enter the Gallery" CTA.
 */
export default function HeroParallax() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "60%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <header
      ref={ref}
      className="relative h-screen w-full overflow-hidden flex items-center justify-center"
    >
      <motion.div className="absolute inset-0 z-0" style={{ y: imageY }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt="Hero Background"
          className="w-full h-full object-cover opacity-80 scale-110"
          src={HERO_IMAGE}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0a]/30 to-[#0a0a0a]" />
      </motion.div>

      <motion.div
        className="relative z-10 text-center px-4 flex flex-col items-center gap-8"
        style={{ y: contentY, opacity: contentOpacity }}
      >
        <div className="hero-title-glass rounded-2xl px-10 py-6 md:px-16 md:py-8">
          <h1 className="font-title text-display-lg text-white tracking-tight">
            The Shutter Bug
          </h1>
        </div>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md">
          A quiet study of light, absence, and the edges of the day.
        </p>
        <Link
          href="/work"
          className="nav-pill rounded-full px-8 py-3.5 font-label-sm text-label-sm tracking-widest uppercase text-on-surface hover:bg-white/15 transition-all duration-300 active:scale-95 flex items-center gap-3"
        >
          Enter the Gallery
          <span className="material-symbols-outlined text-[18px]">
            arrow_forward
          </span>
        </Link>
      </motion.div>
    </header>
  );
}
