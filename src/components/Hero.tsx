import Link from "next/link";
import { Fragment, type CSSProperties } from "react";
import { ArrowRight } from "lucide-react";

/**
 * Home hero (Phase R). Server-rendered, no JavaScript: every effect is CSS.
 *
 * - The photograph settles in on load (slow zoom-out from a soft, bright
 *   blur) and then drifts slower than the page as you scroll (parallax).
 * - The title "develops": each letter surfaces from a blurred, over-exposed
 *   smudge into a sharp print, one after another, and a single band of
 *   light then sweeps across it — the darkroom, not a template fade.
 * - Eyebrow, subtitle and link rise in around it; the whole block lifts
 *   away as you scroll; a scroll cue invites the first scroll.
 * Reduced motion: all of it off (globals.css).
 *
 * The photograph comes from Studio → Home page (SiteContent.heroImageUrl);
 * until the owner uploads one it is the original placeholder.
 */
const WORDS = ["The", "Shutter", "Bug"];

/** The title as words of letter spans, letters numbered for the stagger. */
function TitleLetters() {
  let n = 0;
  return (
    <>
      {WORDS.map((word, w) => (
        // The space goes BETWEEN the word spans: inside an inline-block a
        // trailing space is dropped, which rendered "TheShutterBug".
        <Fragment key={word}>
          {w > 0 && " "}
          <span className="word">
            {[...word].map((ch) => {
              const i = n++;
              return (
                <span key={i} className="char" style={{ "--i": i } as CSSProperties}>
                  {ch}
                </span>
              );
            })}
          </span>
        </Fragment>
      ))}
    </>
  );
}

export default function Hero({ image }: { image: { src: string; srcSet?: string; alt: string } }) {
  return (
    <section aria-labelledby="hero-title" className="hero">
      <div className="hero-media">
        {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary / placeholder host; no next/image by decision */}
        <img
          src={image.src}
          srcSet={image.srcSet}
          sizes={image.srcSet ? "100vw" : undefined}
          alt={image.alt}
          fetchPriority="high"
          decoding="async"
          className="hero-img"
        />
      </div>
      <div aria-hidden="true" className="hero-scrim" />

      <div className="hero-content px-margin-mobile md:px-margin-desktop">
        <p className="caps hero-eyebrow !text-fg-2">Nature · Objects · Monochrome · Urban</p>

        <h1 id="hero-title" className="hero-title mt-6" aria-label={WORDS.join(" ")}>
          <span className="hero-title-wrap" aria-hidden="true">
            <TitleLetters />
          </span>
        </h1>

        <p className="lede hero-sub mt-6 max-w-[34rem] !text-fg/85">
          A quiet study of light, absence, and the edges of the day
        </p>

        <Link href="/work" className="text-link hero-cta mt-8">
          Enter the gallery
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>

      <span aria-hidden="true" className="scroll-cue" />
    </section>
  );
}
