"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { Camera, CloudOff, FunnelX } from "lucide-react";
import { normaliseFilter, type Photo } from "@/lib/data";
import { GALLERY_FILTERS as FILTERS } from "@/lib/categories";
import FrameGrid from "@/components/FrameGrid";

// ---------------------------------------------------------------------------
// States. All three share one quiet shape: muted line icon, one sentence,
// at most one action.
// ---------------------------------------------------------------------------
function Notice({
  icon: Icon,
  title,
  children,
  alert = false,
}: {
  icon: typeof Camera;
  title: string;
  children?: ReactNode;
  alert?: boolean;
}) {
  return (
    <div
      role={alert ? "alert" : undefined}
      className="flex flex-col items-center px-6 py-24 text-center"
    >
      <Icon size={32} className="mb-5 text-fg-3" aria-hidden="true" />
      <h2 className="text-heading font-medium text-fg">{title}</h2>
      {children}
    </div>
  );
}

/** The API could not be reached. Distinct from "empty" on purpose. */
function LoadFailedState() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Notice icon={CloudOff} title="The gallery couldn't load" alert>
      <p className="mt-3 max-w-sm text-body-md text-fg-2">
        The photographs are safe. The server didn&apos;t answer and may be
        waking up, so try again in a moment.
      </p>
      <button
        type="button"
        onClick={() => startTransition(() => router.refresh())}
        disabled={pending}
        className="btn btn-quiet mt-6"
      >
        {pending ? "Trying…" : "Try again"}
      </button>
    </Notice>
  );
}

// ---------------------------------------------------------------------------
// GalleryClient — receives every photo from the server, owns the filter.
// ---------------------------------------------------------------------------
export default function GalleryClient({
  photos,
  failed = false,
  initialFilter,
}: {
  photos: Photo[];
  failed?: boolean;
  initialFilter?: string;
}) {
  const [activeFilter, setActiveFilter] = useState<string>(normaliseFilter(initialFilter));

  const visible =
    activeFilter === "All" ? photos : photos.filter((p) => p.category === activeFilter);

  return (
    <>
      {/* Heading row: title left, filters right; the filters wrap under the
          title on narrow screens. Was a centred title over a glass
          segmented control that overflowed at 390px ("Monochr…", Urban
          hidden) — REDESIGN.md §3.6. */}
      <div className="enter mb-8 flex flex-col gap-3 md:mb-10 md:flex-row md:items-end md:justify-between">
        <h1 className="text-title-sm font-medium text-fg md:text-title">Gallery</h1>
        <div
          role="group"
          aria-label="Filter by category"
          className="-mx-1 flex flex-wrap gap-x-4 gap-y-0 sm:gap-x-6"
        >
          {FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              aria-pressed={activeFilter === filter}
              onClick={() => setActiveFilter(filter)}
              className="tab"
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {failed ? (
        <LoadFailedState />
      ) : photos.length === 0 ? (
        <Notice icon={Camera} title="No photographs yet">
          <p className="mt-3 max-w-sm text-body-md text-fg-2">
            The collection is empty for now.
          </p>
        </Notice>
      ) : visible.length === 0 ? (
        <Notice icon={FunnelX} title={`No ${activeFilter.toLowerCase()} photographs yet`}>
          <button type="button" onClick={() => setActiveFilter("All")} className="btn btn-quiet mt-6">
            Show all
          </button>
        </Notice>
      ) : (
        <FrameGrid
          photos={visible}
          label={activeFilter === "All" ? "All photographs" : `${activeFilter} photographs`}
          eagerCount={4}
          hrefFor={(photo) =>
            activeFilter === "All"
              ? `/lightbox/${photo.id}`
              : `/lightbox/${photo.id}?filter=${encodeURIComponent(activeFilter)}`
          }
        />
      )}
    </>
  );
}
