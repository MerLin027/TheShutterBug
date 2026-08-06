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
    <div className="text-on-surface antialiased bg-[#0A0A0A]">
      <SiteNav />
      <HeroParallax />
      <SelectedFrames photos={featured} />
      <SiteFooter />
    </div>
  );
}
