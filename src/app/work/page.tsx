"use client";

import Link from "next/link";
import { useState } from "react";
import { photos } from "@/lib/data";

export default function Work() {
  const [activeFilter, setActiveFilter] = useState("All");

  const filteredPhotos = activeFilter === "All" 
    ? photos 
    : photos.filter(photo => photo.category === activeFilter);

  return (
    <div className="bg-background text-on-surface font-body-md antialiased min-h-screen flex flex-col">
      {/* TopNavBar (Floating Pill Variant as requested, adapting JSON content) */}
      <header className="fixed top-8 left-1/2 -translate-x-1/2 z-50 flex justify-between items-center px-8 py-4 w-11/12 max-w-5xl rounded-full bg-white/10 backdrop-blur-[30px] border-[0.5px] border-white/15">
        <Link href="/" className="font-display-lg text-headline-md tracking-tighter text-on-surface uppercase hover:text-primary transition-colors">
          The Shutter Bug
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          {/* Active Tab: Series */}
          <Link
            className="font-headline-md text-headline-md text-on-surface border-b border-on-surface pb-1 scale-95 active:scale-90 transition-transform"
            href="/work"
          >
            Series
          </Link>
          <Link
            className="font-headline-md text-headline-md text-outline hover:text-on-surface transition-colors hover:opacity-80 scale-95 active:scale-90 transition-transform"
            href="/work" // Placeholder for Archives
          >
            Archives
          </Link>
          <Link
            className="font-headline-md text-headline-md text-outline hover:text-on-surface transition-colors hover:opacity-80 scale-95 active:scale-90 transition-transform"
            href="/about"
          >
            About
          </Link>
        </nav>
        <Link
          className="font-headline-md text-headline-md text-primary hover:opacity-80 transition-opacity"
          href="/contact"
        >
          Connect
        </Link>
      </header>

      <main className="flex-grow pt-40 px-margin-mobile md:px-margin-desktop">
        {/* Filters */}
        <section className="mb-section-gap">
          <div className="flex items-center justify-center gap-element-gap overflow-x-auto no-scrollbar py-4">
            {["All", "Nature", "Objects", "Monochrome", "Urban"].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-6 py-2 rounded-full font-label-sm text-label-sm backdrop-blur-xl border-[0.5px] border-white/15 transition-all uppercase tracking-[0.1em] ${
                  activeFilter === filter
                    ? "text-on-surface glass-pill-active"
                    : "bg-white/5 text-outline hover:text-on-surface hover:bg-white/10"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </section>

        {/* Masonry Gallery */}
        <section className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-gutter pb-section-gap space-y-gutter">
          {filteredPhotos.map((photo) => (
            <div key={photo.id} className="break-inside-avoid relative overflow-hidden group cursor-pointer">
              <Link href={`/lightbox/${photo.id}`}>
                <div className={`${photo.aspect} w-full bg-surface-container-low`}>
                  <img
                    className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-[1.03]"
                    data-alt={photo.alt}
                    alt={photo.alt}
                    src={photo.src}
                  />
                </div>
              </Link>
            </div>
          ))}
        </section>
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
