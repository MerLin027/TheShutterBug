/**
 * The site's mark (owner, 2026-11-22): a teal planet inside a white inverted
 * triangle, drawn after the owner's artwork (planet + triangle on a
 * starfield). Drawn rather than photographic: the photo version blurred into
 * a smudge at navbar size, and the owner chose this simplified drawing.
 * The tab and iOS icons (src/app/icon.png, apple-icon.png) are rendered from
 * this same drawing.
 *
 * Decorative: the navbar link's name comes from the text beside it.
 */
export default function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="brand-planet" cx="0.38" cy="0.32" r="0.75">
          <stop offset="0" stopColor="#bfeef2" />
          <stop offset="0.35" stopColor="#5fc3cf" />
          <stop offset="0.75" stopColor="#23707b" />
          <stop offset="1" stopColor="#0f2f35" />
        </radialGradient>
      </defs>
      <circle cx="30" cy="31" r="17.5" fill="url(#brand-planet)" />
      <path d="M11 17 H53 L32 53 Z" fill="none" stroke="#fff" strokeWidth="3" strokeLinejoin="miter" />
      <path d="M7.5 16 L14 27.5 M6 19.5 L11 28.5" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
