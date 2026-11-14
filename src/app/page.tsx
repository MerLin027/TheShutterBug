import { fetchFeaturedPhotos } from "@/lib/data";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import Hero from "@/components/Hero";
import SelectedFrames from "@/components/SelectedFrames";

// Revalidate every 60 s (matches the fetch revalidation in data.ts).
export const revalidate = 60;

export default async function Home() {
  // On failure Selected Frames renders nothing, exactly as when nothing is
  // featured: the hero needs no data, so Home stays whole during an outage
  // rather than showing an error block on the landing page.
  const { photos: featured } = await fetchFeaturedPhotos();

  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper text-fg antialiased">
      <SiteNav />
      <main id="main">
        <Hero />
        <SelectedFrames photos={featured} />
      </main>
      <SiteFooter />
    </div>
  );
}
