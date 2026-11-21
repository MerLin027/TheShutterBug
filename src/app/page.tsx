import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { fetchFeaturedPhotos, fetchPhotos, fetchSiteContent, heroImage, workStatementFor } from "@/lib/data";
import SiteFooter from "@/components/SiteFooter";
import Hero from "@/components/Hero";
import SelectedFrames from "@/components/SelectedFrames";

// Revalidate every 60 s (matches the fetch revalidation in data.ts).
export const revalidate = 60;

export default async function Home() {
  // On failure Selected work renders nothing, and the hero and statement fall
  // back to the default copy, so Home stays whole.
  const [{ photos: featured }, content] = await Promise.all([
    fetchFeaturedPhotos(),
    fetchSiteContent(),
  ]);
  // Nothing starred yet: show the first six in the owner's gallery order, so
  // Home always has photographs below the statement (2026-11-21). Starring
  // any photo in the Studio switches this back to "Selected Work".
  const frames = featured.length > 0 ? featured : (await fetchPhotos()).photos.slice(0, 6);
  const framesAreFeatured = featured.length > 0;
  // Studio → Home page: the statement can be switched off or rewritten.
  const statement = workStatementFor(content);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper text-fg antialiased">
      <main id="main">
        <Hero image={heroImage(content)} />

        {/* A pause between the hero and the work: the owner's statement
            (Studio → Home page), set large. */}
        {statement && (
          <section aria-label="About the work" className="px-margin-mobile py-28 md:px-margin-desktop md:py-40">
            <div className="site-container grid gap-10 md:grid-cols-12">
              <p className="caps reveal md:col-span-3">The work</p>
              <div className="md:col-span-9">
                {/* Each word "develops" as it scrolls past: dim to full,
                    like a print in the tray (globals.css, .develop-word).
                    The sentence is still one paragraph to screen readers. */}
                <p className="reveal font-[family-name:var(--font-display)] text-[clamp(1.75rem,3.4vw,3rem)] font-light leading-[1.25] text-fg">
                  {statement.split(/(\s+)/).map((part, i) =>
                    /^\s+$/.test(part) ? part : (
                      <span key={i} className="develop-word">{part}</span>
                    )
                  )}
                </p>
                <Link href="/about" className="text-link reveal mt-8">
                  About the photographer
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </section>
        )}

        <SelectedFrames photos={frames} featured={framesAreFeatured} />

        {/* Closing line: the page ends on the way into the gallery rather
            than just stopping. It tightens into place as it arrives. */}
        <section aria-label="The collection" className="px-margin-mobile pb-28 pt-8 md:px-margin-desktop md:pb-40 md:pt-12">
          <div className="site-container">
            <Link href="/work" className="closing-link">
              <span>See the whole collection</span>
              <ArrowRight aria-hidden="true" className="closing-arrow" />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
