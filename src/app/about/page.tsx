import type { CSSProperties } from "react";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { fetchSiteContent, splitBio } from "@/lib/data";

// Match / and /work — a Save in Studio revalidates this immediately, so this
// is only the ceiling on how stale the page can get if that action is missed.
export const revalidate = 60;

/**
 * About (Redesign Phase B). Asymmetric split: portrait (5/12) beside the
 * text (7/12), centred against each other. The portrait is a plain print —
 * the hairline "glass tray" mount it used to sit in is gone with the rest of
 * the decorative glass.
 *
 * Quote, bio and portrait URL are the owner's content from Studio → Account.
 * The portrait URL is free text (context.md §8), so it is used as given.
 */
export default async function About() {
  const { quote, bio, aboutImageUrl } = await fetchSiteContent();
  const paragraphs = splitBio(bio);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper text-fg antialiased">
      <SiteNav />

      <main
        id="main"
        className="flex-1 px-margin-mobile pb-24 pt-28 md:px-margin-desktop md:pb-32 md:pt-36"
      >
        <div className="site-container grid items-center gap-10 md:grid-cols-12 md:gap-16">
          <div className="enter frame-media aspect-[4/5] md:col-span-5">
            {/* eslint-disable-next-line @next/next/no-img-element -- free-text URL from the Studio; any host */}
            <img
              src={aboutImageUrl}
              alt="Portrait of the photographer holding a camera"
              className="object-[70%_30%]"
              decoding="async"
            />
          </div>

          <div
            className="enter md:col-span-7"
            style={{ "--i": 1 } as CSSProperties}
          >
            <p className="mb-4 text-label text-fg-3">About</p>
            <h1 className="max-w-[18ch] text-title-sm font-medium text-fg md:text-title">
              {quote}
            </h1>
            {/* Paragraph count is whatever the owner saved. */}
            <div className="mt-8 max-w-[38rem] space-y-5 text-lead text-fg-2">
              {paragraphs.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
