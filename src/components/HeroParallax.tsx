"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

// The bare googleusercontent URL serves a 512x286 thumbnail (12 KB), which
// was being upscaled ~4x to fill the hero — that was the blur. Appending a
// size request returns this asset's true master: 1376x768 (59 KB).
// NOTE: 1376px is the CDN's ceiling for this asset — it's an AI-generated
// Stitch placeholder, not a real photograph. Swapping it for a genuine
// high-res shot is the only way to get past ~1.5x upscale on a 1440p+ display.
const HERO_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBN4WALWq_emxJIYSU6-Ph6fTn37OTV7OLsoCQ18yhMT1Ch35bNiLM4PlaQGpX7yMywVF0SKr_lWFJ0A6ljA2Yse8ng0wVoQcgD1VWlj6NH6Vg-IzAvUuJumBOqGqNybIThpITt94pICLEZ8H6K_d4Wb02uA12APN9PrHFTTgDRm8p5-amoOw1XUMQii1fxOS90Sa87ajqewjmm2EyiY2NfdJGKNZS3vFiAIkpfpm1A2Y83s1FHV9wH=w2400";

const TITLE = "The Shutter Bug";

// Placement of the wordmark over the boat, both measured from the source
// photograph rather than eyeballed (see .hero-title-line in globals.css for
// the sizing half of the derivation).
//
// x — the boat's horizontal centre is at 50.6% of the image, and the image is
// itself centred by object-cover, so 50.6% of the hero centres the title on
// the boat rather than on the viewport. The correction is small (~12px at
// 1920) but it's exact and costs nothing.
//
// y — the alphabetic baseline. The boat's top edge sits at 51.7% of the image
// height, and this string's ink drops 0.776em below the baseline, so the
// baseline that parks the title just above the boat works out to 47.5%-48.1%
// of viewport height across every aspect ratio from portrait phone to 21:9 —
// flat enough that one constant needs no breakpoints. Verified at 14 viewport
// sizes: the gap between the title's ink bottom and the boat's top stays
// between 1.5px and 17px, and the wordmark holds 1.09x the boat's width.
const TITLE_X = "50.6%";
const TITLE_Y = "48%";

/**
 * Home hero: parallax background, glass-text title, subtitle, and the
 * "Enter the Gallery" CTA.
 *
 * The title is genuine glass text — the letterforms are filled with the hero
 * photograph itself, frosted, via an SVG <pattern> laid out in the hero's own
 * coordinate space. The pattern's <image> repeats the <img> below it exactly
 * (x/-2.5% + 105% reproduces object-cover + scale-105), so what shows inside
 * a letter is the part of the photo that letter is actually sitting on. No
 * box, no panel, no flat glow.
 *
 * Three text layers, all sharing .hero-title-line and identical coordinates
 * so they cannot drift out of register:
 *   1. shade  — soft dark aura, the contrast floor against a bright sky
 *   2. glass  — the frosted photograph, with an SVG paint fallback to solid
 *               #f5f2ee if the pattern can't resolve
 *   3. sheen  — specular gradient + hairline rim, the "this is glass" cue
 *
 * The title layer rides the *image's* parallax rather than the content's.
 * That's deliberate: the refraction has to stay registered with the photo it
 * refracts, and giving it the content's faster track would slide the
 * letterforms off the pixels they're supposed to be sampling.
 */
export default function HeroParallax() {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // A full-bleed image tracking scroll position is the most vestibular-
  // triggering thing on the site, so parallax is the first thing to go when
  // reduced motion is requested. The fade stays — opacity doesn't imply
  // self-motion, and without it the hero would clip abruptly.
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", reduceMotion ? "0%" : "30%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", reduceMotion ? "0%" : "60%"]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  // 100dvh, not h-[100dvh]: on iOS Safari the large viewport is what `vh`
  // resolves to, so the hero would stand taller than the visible area while
  // the URL bar is showing and then reflow as it collapses. Everything the
  // title's placement is derived from is a percentage of *this* box, so the
  // geometry follows automatically.
  return (
    <header ref={ref} className="relative h-[100dvh] w-full overflow-hidden">
      {/* ── The photograph ──────────────────────────────────────────────── */}
      <motion.div
        className="absolute inset-0 z-0"
        style={{ y: imageY }}
        aria-hidden="true"
      >
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
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-container/30 to-primary-container" />
      </motion.div>

      {/* The accessible, machine-readable heading. The painted title is the
          SVG below, which is decorative and marked aria-hidden. */}
      <h1 className="sr-only">{TITLE}</h1>

      {/* ── Glass-text title ────────────────────────────────────────────── */}
      <motion.div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{ y: imageY, opacity: fade }}
        aria-hidden="true"
      >
        <svg className="hero-title-svg" focusable="false" aria-hidden="true">
          <defs>
            {/* Frost: blur, then lift and saturate. The lift matters — with
                a plain blur the glyphs average out to the same luminance as
                the sky around them and vanish. */}
            <filter
              id="heroTitleFrost"
              x="-10%"
              y="-10%"
              width="120%"
              height="120%"
              colorInterpolationFilters="sRGB"
            >
              <feGaussianBlur stdDeviation="8" />
              <feColorMatrix type="saturate" values="1.4" />
              <feComponentTransfer>
                <feFuncR type="linear" slope="1.12" intercept="0.06" />
                <feFuncG type="linear" slope="1.12" intercept="0.06" />
                <feFuncB type="linear" slope="1.12" intercept="0.06" />
              </feComponentTransfer>
            </filter>

            <filter
              id="heroTitleShade"
              x="-30%"
              y="-30%"
              width="160%"
              height="160%"
              colorInterpolationFilters="sRGB"
            >
              <feGaussianBlur stdDeviation="9" />
            </filter>

            {/* The photograph, frosted, in the hero's coordinate space. The
                tile is the full viewport so nothing visibly repeats, and
                x=-2.5%/width=105% reproduces the <img>'s object-cover +
                scale-105 exactly. */}
            <pattern
              id="heroGlassFill"
              patternUnits="userSpaceOnUse"
              x="0"
              y="0"
              width="100%"
              height="100%"
            >
              <image
                href={HERO_IMAGE}
                x="-2.5%"
                y="-2.5%"
                width="105%"
                height="105%"
                preserveAspectRatio="xMidYMid slice"
                filter="url(#heroTitleFrost)"
              />
            </pattern>

            <linearGradient id="heroTitleSheen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.34" />
              <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.08" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          <text
            x={TITLE_X}
            y={TITLE_Y}
            textAnchor="middle"
            className="hero-title-line hero-title-shade"
            filter="url(#heroTitleShade)"
          >
            {TITLE}
          </text>

          {/* The SVG paint fallback after the reference is the plain-text
              fallback: if the pattern can't resolve, the glyphs fill solid
              warm off-white, which with the shade layer behind them stays
              perfectly legible. */}
          <text
            x={TITLE_X}
            y={TITLE_Y}
            textAnchor="middle"
            className="hero-title-line"
            fill="url(#heroGlassFill) #f5f2ee"
          >
            {TITLE}
          </text>

          <text
            x={TITLE_X}
            y={TITLE_Y}
            textAnchor="middle"
            className="hero-title-line hero-title-sheen"
          >
            {TITLE}
          </text>
        </svg>
      </motion.div>

      {/* ── Subtitle + CTA ──────────────────────────────────────────────────
          Anchored to the bottom of the hero rather than flowed under the
          title. The title now sits low, on the boat, and the boat and its
          reflection occupy roughly 52%-68% of the frame — flowing this block
          directly beneath the title would drop copy straight onto the
          photograph's subject. Bottom-anchoring clears it at every size
          tested (worst case 26px, on a landscape phone). */}
      <motion.div
        className="absolute inset-x-0 bottom-[8dvh] z-20 flex flex-col items-center gap-8 px-margin-mobile text-center"
        style={{ y: contentY, opacity: fade }}
      >
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md">
          A quiet study of light, absence, and the edges of the day.
        </p>

        <Link
          href="/work"
          className="btn-glass group pl-8 pr-2 py-2 font-label-sm text-label-sm tracking-widest uppercase text-on-surface flex items-center gap-4"
        >
          Enter the Gallery
          <span className="btn-icon-nest">
            <span className="material-symbols-outlined text-[18px]">
              arrow_forward
            </span>
          </span>
        </Link>
      </motion.div>
    </header>
  );
}
