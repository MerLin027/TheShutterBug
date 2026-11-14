import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowRight } from "lucide-react";

/**
 * Home hero (Redesign Phase B, task B6a). One photograph, full bleed and
 * static; the title sits on the calm sky the frame leaves above the boat;
 * one action.
 *
 * Replaced HeroParallax: a four-layer SVG glass-letter wordmark over a scroll
 * parallax (REDESIGN.md §3.1 has the full record and the measured geometry;
 * `git show 9585aa65:src/components/HeroParallax.tsx` restores it). The owner
 * chose to try it this way and switch back if it doesn't work out.
 *
 * Composition, measured against this frame: the boat occupies 51.7–67.3% of
 * the image height and object-cover keeps it there at every aspect ratio, so
 * a text block starting at 22dvh ends well above it on desktop (≈385px of
 * 900) and on a 390×844 phone (≈375px of 844). Two tonal scrims in the page's
 * own colour do the legibility work — a soft darkening under the nav and
 * title, and a dissolve into the page at the bottom so the photograph has no
 * hard lower edge. No glow, no text-shadow.
 *
 * Still the AI-generated Stitch placeholder (1376px is its CDN ceiling).
 * It's demo content; the owner swaps in a real photograph.
 */
const HERO_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBN4WALWq_emxJIYSU6-Ph6fTn37OTV7OLsoCQ18yhMT1Ch35bNiLM4PlaQGpX7yMywVF0SKr_lWFJ0A6ljA2Yse8ng0wVoQcgD1VWlj6NH6Vg-IzAvUuJumBOqGqNybIThpITt94pICLEZ8H6K_d4Wb02uA12APN9PrHFTTgDRm8p5-amoOw1XUMQii1fxOS90Sa87ajqewjmm2EyiY2NfdJGKNZS3vFiAIkpfpm1A2Y83s1FHV9wH=w2400";

const SCRIM =
  "linear-gradient(to bottom, rgb(16 15 13 / 0.66) 0%, rgb(16 15 13 / 0.52) 34%, rgb(16 15 13 / 0) 54%, rgb(16 15 13 / 0) 84%, var(--color-paper) 100%)";

export default function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative h-[100dvh] min-h-[34rem] w-full overflow-hidden bg-paper"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- external placeholder host; no next/image by decision (REDESIGN.md §2) */}
      <img
        src={HERO_IMAGE}
        alt="A lone rowing boat on still water at dusk, mirrored in the lake"
        width={1376}
        height={768}
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div aria-hidden="true" className="absolute inset-0" style={{ background: SCRIM }} />

      <div className="relative z-10 flex h-full flex-col items-center px-margin-mobile pt-[22dvh] text-center md:px-margin-desktop">
        <h1
          id="hero-title"
          className="enter text-[clamp(2.6rem,6vw,5.5rem)] font-medium leading-[1.02] tracking-[-0.03em] text-fg"
        >
          The Shutter Bug
        </h1>
        <p
          className="enter mt-4 max-w-[36rem] text-lead text-fg"
          style={{ "--i": 1 } as CSSProperties}
        >
          A quiet study of light, absence, and the edges of the day
        </p>
        <Link
          href="/work"
          className="enter btn btn-primary mt-8"
          style={{ "--i": 2 } as CSSProperties}
        >
          Enter the gallery
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
