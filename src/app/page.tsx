import { fetchFeaturedPhotos } from "@/lib/data";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import HeroParallax from "@/components/HeroParallax";
import SelectedFrames from "@/components/SelectedFrames";

// Revalidate every 60 s (matches the fetch revalidation in data.ts).
export const revalidate = 60;

export default async function Home() {
  const featured = await fetchFeaturedPhotos();

  return (
    <div className="bg-primary-container text-on-surface font-body-md antialiased">
      <SiteNav />
      {/* Home had no <main> at all — the hero is a <header> and Selected
          Frames a bare <section>, which left the page with no primary
          landmark for screen readers or the skip-link to target. */}
      <main id="main">
        <HeroParallax />
        <SelectedFrames photos={featured} />
      </main>
      <SiteFooter />
    </div>
  );
}
