import type { ReactNode } from "react";

/**
 * One shape for every section below Home's hero (owner, 2026-11-21: "The
 * work" and the photo section looked like they came from different sites).
 *
 * A hairline draws across the container as the section arrives; under it,
 * the left four columns hold the number, the serif title (which tightens into
 * place as it scrolls in) and an optional link, and stay pinned on desktop
 * while the right eight columns scroll past. Phones stack the two.
 * All motion is scroll-driven CSS in globals.css (.home-rule, .home-title).
 */
export default function HomeSection({
  id,
  index,
  title,
  aside,
  className = "",
  children,
}: {
  id: string;
  index: string;
  title: string;
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className={`home-section px-margin-mobile md:px-margin-desktop ${className}`}>
      <div className="site-container">
        <div className="home-rule" aria-hidden="true" />
        <div className="grid gap-8 pt-10 md:grid-cols-12 md:gap-12 md:pt-14">
          <div className="md:col-span-4">
            <div className="md:sticky md:top-28">
              <p className="caps home-index">{index}</p>
              <h2 id={id} className="section-title home-title mt-3">
                {title}
              </h2>
              {aside && <div className="mt-6">{aside}</div>}
            </div>
          </div>
          <div className="md:col-span-8">{children}</div>
        </div>
      </div>
    </section>
  );
}
