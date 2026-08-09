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
 * ── Why the title is built the way it is ─────────────────────────────────
 * The previous version filled the glyphs *with* the photograph (an SVG
 * <pattern> sampling the hero image at the letters' own position) and put a
 * white hairline rim on top. That can never be legible: by construction the
 * fill matches the pixels immediately around it, so the letterforms were
 * invisible and the only ink left was the rim — the wordmark rendered as a
 * hollow wire outline. The frosted photograph is a *texture*, not a fill.
 *
 * So the order is now: opaque legible letters first, frost on top.
 *
 * Four layers, all sharing .hero-title-line and identical coordinates so
 * they cannot drift out of register:
 *   1. shade — soft dark aura, the contrast floor against a bright sky
 *   2. fill  — SOLID warm off-white (#f5f2ee), fully opaque. This layer
 *              alone is a complete, legible wordmark; everything above it is
 *              decoration and can fail without hurting readability.
 *   3. frost — a separate copy of the hero photograph, blurred and lifted
 *              into the upper tonal range, masked down to the glyph shapes
 *              so it only ever tints the inside of the letters. Never
 *              darkens the fill past legibility (see #heroTitleFrost).
 *   4. sheen — top-edge specular gradient, also glyph-masked. No stroke:
 *              a rim is what made the old version read as an outline.
 *
 * Layers 3 and 4 are clipped by CSS `mask`/`-webkit-mask` pointing at one
 * shared SVG <mask> whose source is a <text> element using the same class
 * and coordinates as the visible text — so the frost lands on exactly the
 * glyph shapes, at any viewport size, with anti-aliased edges for free.
 *
 * Why an SVG <mask> rather than a CSS mask-image data-URI: an SVG loaded as
 * an image can't reach the document's webfonts, so a data-URI mask would be
 * shaped in a fallback face and mismatch the letters it is masking. Inline
 * SVG uses Playwrite VN like everything else.
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
            {/* Frost: blur the photograph, push its saturation up so the
                sunset hue survives, then compress the whole tonal range into
                the TOP of the scale (slope 0.68 / intercept 0.42 maps 0..1
                onto 0.42..1). That compression is the important part — it
                means even the darkest pixel of the photo can only ever tint
                the off-white fill beneath, never black it out.

                stdDeviation 4, not 10: Playwrite VN's strokes are hairlines,
                so a wide blur hands every letter an identical flat average
                and the frost reads as a uniform dimming rather than as
                refraction. At 4 the horizon band and the water's tonal
                banding still resolve *across* the wordmark, which is what
                actually looks like light bending through glass.

                The per-channel offset (R above G above B) is a warm bias.
                Without it the frost samples a mauve sky where R ≈ B, which
                neutralises the fill's warmth and lands the letters on a cool
                grey — measured at #d4d1d3, R-B of +1. The bias keeps the
                rendered fill a warm off-white in the palette's family
                regardless of which part of the photograph it crosses. */}
            <filter
              id="heroTitleFrost"
              x="-10%"
              y="-10%"
              width="120%"
              height="120%"
              colorInterpolationFilters="sRGB"
            >
              <feGaussianBlur stdDeviation="4" />
              <feColorMatrix type="saturate" values="1.9" />
              <feComponentTransfer>
                <feFuncR type="linear" slope="0.70" intercept="0.44" />
                <feFuncG type="linear" slope="0.68" intercept="0.42" />
                <feFuncB type="linear" slope="0.64" intercept="0.38" />
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

            {/* The glyph shapes, as a luminance mask. Same class and same
                x/y as every visible text layer, so the mask is the letters —
                not an approximation of them. White = keep. */}
            <mask
              id="heroTitleGlyphs"
              maskUnits="userSpaceOnUse"
              x="0"
              y="0"
              width="100%"
              height="100%"
            >
              <text
                x={TITLE_X}
                y={TITLE_Y}
                textAnchor="middle"
                className="hero-title-line"
                fill="#ffffff"
              >
                {TITLE}
              </text>
            </mask>

            {/* Specular falloff, top-lit — the highlight sits in the upper
                third of the wordmark and fades out below it. */}
            <linearGradient id="heroTitleSheen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.5" />
              <stop offset="0.45" stopColor="#ffffff" stopOpacity="0.1" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* 1 — dark aura */}
          <text
            x={TITLE_X}
            y={TITLE_Y}
            textAnchor="middle"
            className="hero-title-line hero-title-shade"
            filter="url(#heroTitleShade)"
          >
            {TITLE}
          </text>

          {/* 2 — the wordmark itself: solid, opaque, self-sufficient. */}
          <text
            x={TITLE_X}
            y={TITLE_Y}
            textAnchor="middle"
            className="hero-title-line hero-title-fill"
          >
            {TITLE}
          </text>

          {/* 3 — frosted photograph, glyph-masked. x=-2.5%/width=105%
                  reproduces the <img>'s object-cover + scale-105 exactly, so
                  the haze inside a letter comes from the part of the photo
                  that letter is actually sitting on.

                  The mask is applied twice on purpose, and only ever takes
                  effect once: .hero-title-frost sets the CSS `mask` (the
                  modern path, with the -webkit- alias for older Safari),
                  while the `mask` presentation attribute here is SVG 1.1 and
                  universally supported. Author CSS outranks a presentation
                  attribute in the cascade, so wherever CSS masking works the
                  attribute is simply overridden — no double-multiplied
                  alpha. Wherever it doesn't, the attribute still clips the
                  frost to the letters. Without that floor the failure mode is
                  ugly: an unmasked full-bleed frosted image would blanket
                  the entire hero. */}
          <image
            href={HERO_IMAGE}
            x="-2.5%"
            y="-2.5%"
            width="105%"
            height="105%"
            preserveAspectRatio="xMidYMid slice"
            filter="url(#heroTitleFrost)"
            mask="url(#heroTitleGlyphs)"
            className="hero-title-frost"
          />

          {/* 4 — sheen. Fill only, no stroke: a rim is what made the old
                  version read hollow. The gradient uses the default
                  objectBoundingBox units, so it spans this text element's own
                  bbox — the highlight tracks the wordmark at every viewport
                  size without needing the glyph mask or a hardcoded band. */}
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
