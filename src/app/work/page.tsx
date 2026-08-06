import Link from "next/link";
import { fetchPhotos } from "@/lib/data";
import GalleryClient from "./GalleryClient";
import AdminNavLink from "@/components/AdminNavLink";

// Revalidate the page every 60 s (matches the fetch revalidation in data.ts).
export const revalidate = 60;

export default async function Work({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  // Fetches from the live Render API. Returns [] when DB is empty.
  const photos = await fetchPhotos();

  return (
    <div className="bg-background text-on-surface font-body-md antialiased min-h-screen flex flex-col">
      {/* TopNavBar (Floating Pill Variant) */}
      <header className="fixed top-8 left-1/2 -translate-x-1/2 z-50 flex justify-between items-center px-8 py-4 w-11/12 max-w-5xl rounded-full bg-white/10 backdrop-blur-[30px] border-[0.5px] border-white/15">
        <Link href="/" className="font-display-lg text-headline-md tracking-tighter text-on-surface uppercase hover:text-primary transition-colors">
          The Shutter Bug
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          <Link
            className="font-headline-md text-headline-md text-on-surface border-b border-on-surface pb-1 scale-95 active:scale-90 transition-transform"
            href="/work"
          >
            Gallery
          </Link>
          <Link
            className="font-headline-md text-headline-md text-outline hover:text-on-surface transition-colors hover:opacity-80 scale-95 active:scale-90 transition-transform"
            href="/about"
          >
            About
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link
            className="font-headline-md text-headline-md text-primary hover:opacity-80 transition-opacity"
            href="/contact"
          >
            Connect
          </Link>
          <AdminNavLink className="text-on-surface hover:text-primary transition-colors flex items-center justify-center hover:bg-white/20 rounded-full p-2 scale-105 active:scale-95 transition-transform" />
        </div>
      </header>

      <main className="flex-grow pt-40 px-margin-mobile md:px-margin-desktop">
        {/* GalleryClient owns filter state; receives all photos from the server. */}
        <GalleryClient photos={photos} initialFilter={filter} />
      </main>

      {/* Footer */}
      <footer className="bg-background text-on-surface font-label-sm text-label-sm py-section-gap flex flex-col md:flex-row justify-between items-center px-margin-mobile md:px-margin-desktop w-full border-t border-white/5 pt-12">
        <div className="font-display-lg text-headline-md text-on-surface mb-8 md:mb-0">
          © 2024 The Shutter Bug
        </div>
        <div className="flex gap-8">
          <Link
            className="text-outline hover:text-primary transition-colors opacity-70 hover:opacity-100 uppercase tracking-[0.1em]"
            href="#"
          >
            Instagram
          </Link>
          <Link
            className="text-outline hover:text-primary transition-colors opacity-70 hover:opacity-100 uppercase tracking-[0.1em]"
            href="#"
          >
            Vimeo
          </Link>
          <Link
            className="text-outline hover:text-primary transition-colors opacity-70 hover:opacity-100 uppercase tracking-[0.1em]"
            href="#"
          >
            Journal
          </Link>
          <Link
            className="text-outline hover:text-primary transition-colors opacity-70 hover:opacity-100 uppercase tracking-[0.1em]"
            href="#"
          >
            License
          </Link>
        </div>
      </footer>
    </div>
  );
}
