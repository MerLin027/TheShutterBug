import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { fetchFeaturedPhotos, fetchPhotos, fetchSiteContent, heroImage, workStatementFor } from "@/lib/data";
import SiteFooter from "@/components/SiteFooter";
import Hero from "@/components/Hero";
import SelectedFrames from "@/components/SelectedFrames";
import HomeSection from "@/components/HomeSection";

// Revalidate every 60 s (matches the fetch revalidation in data.ts).
export const revalidate = 60;

export default async function Home() {
  // On failure Curated Work renders nothing, and the hero and statement fall
  // back to the default copy, so Home stays whole.
  const [{ photos: featured }, content] = await Promise.all([
    fetchFeaturedPhotos(),
    fetchSiteContent(),
  ]);
  // Nothing starred yet: show the first six in the owner's gallery order, so
  // Home always has photographs below the statement (2026-11-21). Starring
  // any photo in the Studio switches this back to "Curated Work".
  const frames = featured.length > 0 ? featured : (await fetchPhotos()).photos.slice(0, 6);
  const framesAreFeatured = featured.length > 0;
  // Studio → Home page: the statement can be switched off or rewritten.
  const statement = workStatementFor(content);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper text-fg antialiased">
      <main id="main">
        <Hero image={heroImage(content)} />

        {/* Below the hero, every section shares one shape (HomeSection):
            numbered, a hairline that draws across, a serif title on the
            left that stays pinned on desktop, content on the right. */}
        {statement && (
          <HomeSection id="the-work" index="01" title="The Work" className="pt-28 md:pt-40">
            {/* Each word "develops" as it scrolls past, dim to full, like a
                print in the tray (globals.css, .develop-word). It is still
                one paragraph to screen readers. */}
            <p className="font-[family-name:var(--font-display)] text-[clamp(1.75rem,3.2vw,2.75rem)] font-light leading-[1.28] text-fg">
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
          </HomeSection>
        )}

        <SelectedFrames
          photos={frames}
          featured={framesAreFeatured}
          index={statement ? "02" : "01"}
          className={statement ? "pt-20 md:pt-28" : "pt-28 md:pt-40"}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
