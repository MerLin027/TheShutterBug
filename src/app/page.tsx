import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { fetchFeaturedPhotos, fetchSiteContent, heroImage, workStatementFor } from "@/lib/data";
import SiteNav from "@/components/SiteNav";
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
  // Studio → Home page: the statement can be switched off or rewritten.
  const statement = workStatementFor(content);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper text-fg antialiased">
      <SiteNav />
      <main id="main">
        <Hero image={heroImage(content)} />

        {/* A pause between the hero and the work: the owner's statement
            (Studio → Home page), set large. */}
        {statement && (
          <section aria-label="About the work" className="px-margin-mobile py-28 md:px-margin-desktop md:py-40">
            <div className="site-container grid gap-10 md:grid-cols-12">
              <p className="caps reveal md:col-span-3">The work</p>
              <div className="md:col-span-9">
                <p className="reveal font-[family-name:var(--font-display)] text-[clamp(1.75rem,3.4vw,3rem)] font-light leading-[1.25] text-fg">
                  {statement}
                </p>
                <Link href="/about" className="text-link reveal mt-8">
                  About the photographer
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </section>
        )}

        <SelectedFrames photos={featured} />
      </main>
      <SiteFooter />
    </div>
  );
}
