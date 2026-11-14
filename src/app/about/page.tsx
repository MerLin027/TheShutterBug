import type { CSSProperties } from "react";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { fetchSiteContent, splitBio } from "@/lib/data";

// A Save in Studio revalidates this immediately; 60 s is only the ceiling.
export const revalidate = 60;

/**
 * About (Phase R): an editorial spread. Portrait left (5/12) with a slow
 * settle-in, the quote as a large serif title, the bio in comfortable text
 * that rises in as it's reached. Quote, bio and portrait URL are the owner's
 * content from Studio → Account; the URL is free text, used as given.
 */
export default async function About() {
  const { quote, bio, aboutImageUrl } = await fetchSiteContent();
  const paragraphs = splitBio(bio);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper text-fg antialiased">
      <SiteNav />

      <main id="main" className="flex-1 px-margin-mobile pb-28 pt-36 md:px-margin-desktop md:pb-36 md:pt-44">
        <div className="site-container grid items-start gap-12 md:grid-cols-12 md:gap-16">
          <div className="frame-media enter aspect-[4/5] md:sticky md:top-28 md:col-span-5">
            {/* eslint-disable-next-line @next/next/no-img-element -- free-text URL from the Studio; any host */}
            <img
              src={aboutImageUrl}
              alt="Portrait of the photographer holding a camera"
              className="hero-img object-[70%_30%]"
              decoding="async"
            />
          </div>

          <div className="md:col-span-7 md:pt-6">
            <p className="caps enter">About</p>
            <h1 className="display-title enter mt-5 max-w-[16ch]" style={{ "--i": 1 } as CSSProperties}>
              {quote}
            </h1>
            <div className="mt-10 max-w-[36rem] space-y-6 text-lead text-fg-2">
              {paragraphs.map((paragraph, i) => (
                <p key={i} className={i === 0 ? "lede !text-fg" : "reveal"}>
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
