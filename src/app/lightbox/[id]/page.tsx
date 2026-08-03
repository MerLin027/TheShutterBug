"use client";

import Link from "next/link";
import { use } from "react";
import { photos } from "@/lib/data";

export default function Lightbox({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const currentIndex = photos.findIndex((p) => p.id === id);
  const photo = currentIndex !== -1 ? photos[currentIndex] : null;

  if (!photo) {
    return (
      <div className="bg-primary-container min-h-screen w-full flex items-center justify-center text-on-surface">
        Photo not found.
      </div>
    );
  }

  const prevPhoto = currentIndex > 0 ? photos[currentIndex - 1] : photos[photos.length - 1];
  const nextPhoto = currentIndex < photos.length - 1 ? photos[currentIndex + 1] : photos[0];

  return (
    <div className="bg-primary-container min-h-screen w-full flex items-center justify-center overflow-hidden font-body-md text-on-surface">
      {/* Main Lightbox Image Container */}
      <div className="relative w-full h-screen flex items-center justify-center p-4 md:p-12 lg:p-24">
        {/* The Image */}
        <img
          alt={photo.alt}
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-transform duration-700 ease-out hover:scale-[1.01]"
          src={photo.src}
        />
        {/* Subtle Caption Overlay */}
        <div className="absolute bottom-8 left-8 md:bottom-12 md:left-12 max-w-sm">
          <div className="backdrop-blur-[20px] bg-white/5 border border-white/10 rounded-xl p-4 transition-opacity duration-300">
            <h2 className="font-headline-md text-headline-md text-on-surface mb-1">
              {photo.title}
            </h2>
            <div className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm">
              <span
                className="material-symbols-outlined text-[16px]"
                data-icon="location_on"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                location_on
              </span>
              <span>{photo.location}</span>
            </div>
          </div>
        </div>
      </div>

      {/* BottomNavBar (Lightbox Controls) */}
      <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 w-fit rounded-full backdrop-blur-[20px] border-[0.5px] border-white/10 bg-white/5 dark:bg-white/5 flex gap-4 p-2 z-50">
        {/* Previous */}
        <Link
          href={`/lightbox/${prevPhoto.id}`}
          aria-label="Previous"
          className="flex flex-col items-center justify-center text-on-surface-variant px-6 py-2 hover:opacity-100 transition-opacity hover:text-on-surface group"
        >
          <span
            className="material-symbols-outlined group-active:scale-95 transition-transform duration-200"
            data-icon="arrow_back_ios"
          >
            arrow_back_ios
          </span>
          <span className="font-label-sm text-label-sm mt-1 opacity-0 h-0 group-hover:opacity-100 group-hover:h-auto transition-all duration-300 overflow-hidden">
            Previous
          </span>
        </Link>
        {/* Info */}
        <button
          aria-label="Info"
          className="flex flex-col items-center justify-center text-on-surface-variant px-6 py-2 hover:opacity-100 transition-opacity hover:text-on-surface group"
        >
          <span
            className="material-symbols-outlined group-active:scale-95 transition-transform duration-200"
            data-icon="info"
          >
            info
          </span>
          <span className="font-label-sm text-label-sm mt-1 opacity-0 h-0 group-hover:opacity-100 group-hover:h-auto transition-all duration-300 overflow-hidden">
            Info
          </span>
        </button>
        {/* Close (X) */}
        <Link
          href="/work"
          aria-label="Close"
          className="flex flex-col items-center justify-center text-on-surface-variant px-6 py-2 hover:opacity-100 transition-opacity hover:text-on-surface group"
        >
          <span
            className="material-symbols-outlined group-active:scale-95 transition-transform duration-200"
            data-icon="close"
          >
            close
          </span>
          <span className="font-label-sm text-label-sm mt-1 opacity-0 h-0 group-hover:opacity-100 group-hover:h-auto transition-all duration-300 overflow-hidden">
            Close
          </span>
        </Link>
        {/* Next */}
        <Link
          href={`/lightbox/${nextPhoto.id}`}
          aria-label="Next"
          className="flex flex-col items-center justify-center text-on-surface-variant px-6 py-2 hover:opacity-100 transition-opacity hover:text-on-surface group"
        >
          <span
            className="material-symbols-outlined group-active:scale-95 transition-transform duration-200"
            data-icon="arrow_forward_ios"
          >
            arrow_forward_ios
          </span>
          <span className="font-label-sm text-label-sm mt-1 opacity-0 h-0 group-hover:opacity-100 group-hover:h-auto transition-all duration-300 overflow-hidden">
            Next
          </span>
        </Link>
      </nav>
    </div>
  );
}
