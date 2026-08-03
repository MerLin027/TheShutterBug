"use client";

import Link from "next/link";
import { useState } from "react";
import type { Photo } from "@/lib/data";

const FILTERS = ["All", "Nature", "Objects", "Monochrome", "Urban"] as const;

// ---------------------------------------------------------------------------
// Empty-state UI — shown when the DB has no photos yet (pre-admin-panel)
// ---------------------------------------------------------------------------
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-32 px-8 text-center">
      {/* Camera icon using Material Symbols (already loaded globally) */}
      <span
        className="material-symbols-outlined text-[64px] text-outline/40 mb-6"
        data-icon="camera_alt"
      >
        camera_alt
      </span>
      <h2 className="font-headline-md text-headline-md text-on-surface mb-3">
        No photos yet
      </h2>
      <p className="font-body-md text-body-md text-outline max-w-xs leading-relaxed">
        The collection is empty for now. Photos will appear here once they are
        uploaded through the admin panel.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// GalleryClient — receives all photos from the server component parent,
// owns the filter state locally, and renders the masonry grid.
// ---------------------------------------------------------------------------
export default function GalleryClient({ photos }: { photos: Photo[] }) {
  const [activeFilter, setActiveFilter] = useState<string>("All");

  const filteredPhotos =
    activeFilter === "All"
      ? photos
      : photos.filter(
          (p) => p.category === activeFilter
        );

  return (
    <>
      {/* Filter pills */}
      <section className="mb-section-gap">
        <div className="flex items-center justify-center gap-element-gap overflow-x-auto no-scrollbar py-4">
          {FILTERS.map((filter) => (
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

      {/* Gallery — empty state or masonry grid */}
      <section className="pb-section-gap">
        {photos.length === 0 ? (
          <EmptyState />
        ) : filteredPhotos.length === 0 ? (
          /* Category filter is active but nothing matches — still a subset empty state */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span
              className="material-symbols-outlined text-[48px] text-outline/40 mb-4"
              data-icon="filter_list_off"
            >
              filter_list_off
            </span>
            <p className="font-body-md text-body-md text-outline">
              No photos in this category yet.
            </p>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-gutter space-y-gutter">
            {filteredPhotos.map((photo) => (
              <div
                key={photo.id}
                className="break-inside-avoid relative overflow-hidden group cursor-pointer"
              >
                <Link href={`/lightbox/${photo.id}`}>
                  <div className={`${photo.aspect} w-full bg-surface-container-low`}>
                    {/* Keep plain <img> consistent with the Phase 2 port.
                        next/image is reserved for when Cloudinary loader is
                        wired up in a future pass. */}
                    <img
                      className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-[1.03]"
                      alt={photo.alt}
                      src={photo.src}
                    />
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
