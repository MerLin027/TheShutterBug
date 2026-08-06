"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

// The bare googleusercontent URL serves a 512x286 thumbnail (12 KB), which
// was being upscaled ~4x to fill the hero — that was the blur. Appending a
// size request returns this asset's true master: 1376x768 (59 KB).
// NOTE: 1376px is the CDN's ceiling for this asset — it's an AI-generated
// Stitch placeholder, not a real photograph. Swapping it for a genuine
// high-res shot is the only way to get past ~1.5x upscale on a 1440p+ display.
const HERO_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBN4WALWq_emxJIYSU6-Ph6fTn37OTV7OLsoCQ18yhMT1Ch35bNiLM4PlaQGpX7yMywVF0SKr_lWFJ0A6ljA2Yse8ng0wVoQcgD1VWlj6NH6Vg-IzAvUuJumBOqGqNybIThpITt94pICLEZ8H6K_d4Wb02uA12APN9PrHFTTgDRm8p5-amoOw1XUMQii1fxOS90Sa87ajqewjmm2EyiY2NfdJGKNZS3vFiAIkpfpm1A2Y83s1FHV9wH=w2400";

const TITLE = "The Shutter Bug";

/**
 * Home hero: parallax background, glass-text title, subtitle, and the
 * "Enter the Gallery" CTA.
 *
 * The title is a true glass-text effect — a backdrop-blur layer clipped to
 * the exact letterform shapes by an inline SVG <mask>, so the frosted
 * refraction appears only inside the characters, with no box or card.
 *
 * Both the visible text and the mask text live in the same <svg> with
 * identical coordinates, which is what guarantees they stay in register.
 * (An HTML <h1> + a separate SVG mask would resolve their baselines by
 * different rules — this font's hhea descender is 0 while its real typo
 * descender is -0.262em, so that mismatch would show.) The SVG carries no
 * viewBox, so its percentage coords and the glass layer's box are the same
 * CSS-pixel space; responsive sizing comes from clamp() on font-size.
 *
 * The visible SVG text doubles as the fallback: the glass layer is gated
 * behind an @supports check, so browsers without usable mask/backdrop
 * support show solid drop-shadowed text rather than a blurred rectangle.
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
        {/* scale-105 rather than 110: the parallax translates downward, so
            only a small overscan margin is needed, and every extra percent
            of scale compounds the upscale of an already-limited source. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover opacity-80 scale-105"
          src={HERO_IMAGE}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0a]/30 to-[#0a0a0a]" />
      </motion.div>

      <motion.div
        className="relative z-10 text-center px-4 flex flex-col items-center gap-10 w-full"
        style={{ y: contentY, opacity: contentOpacity }}
      >
        {/* ── Glass-text title ──────────────────────────────────────────── */}
        <div className="hero-title relative w-full">
          {/* The accessible, machine-readable heading. The painted title is
              the SVG below, which is marked aria-hidden. */}
          <h1 className="sr-only">{TITLE}</h1>

          <svg
            className="hero-title-svg"
            width="100%"
            height="100%"
            aria-hidden="true"
            focusable="false"
          >
            <defs>
              <mask
                id="heroGlassMask"
                maskUnits="userSpaceOnUse"
                x="0"
                y="0"
                width="100%"
                height="100%"
              >
                <rect x="0" y="0" width="100%" height="100%" fill="black" />
                <text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="white"
                  className="hero-title-text"
                >
                  {TITLE}
                </text>
              </mask>
            </defs>

            {/* Visible base: legibility layer under the glass, and the
                complete fallback when the mask can't render. */}
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="central"
              className="hero-title-text hero-title-base"
            >
              {TITLE}
            </text>
          </svg>

          {/* Frosted refraction, clipped to the glyphs by the mask above. */}
          <div className="hero-title-glass" aria-hidden="true" />
        </div>

        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md">
          A quiet study of light, absence, and the edges of the day.
        </p>

        <Link
          href="/work"
          className="nav-pill rounded-full px-8 py-3.5 font-label-sm text-label-sm tracking-widest uppercase text-on-surface hover:text-accent hover:border-accent/40 transition-all duration-300 active:scale-95 flex items-center gap-3"
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
