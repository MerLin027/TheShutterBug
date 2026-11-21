"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type CSSProperties, type ReactNode } from "react";
import { Camera, CloudOff, FunnelX } from "lucide-react";
import { normaliseFilter, type Photo } from "@/lib/data";
import { GALLERY_FILTERS as FILTERS } from "@/lib/categories";
import PhotoBrowser from "@/components/PhotoBrowser";

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
    <div role={alert ? "alert" : undefined} className="flex flex-col items-center px-6 py-28 text-center">
      <Icon size={28} className="mb-6 text-fg-3" aria-hidden="true" />
      <h2 className="section-title">{title}</h2>
      {children}
    </div>
  );
}

/** The API could not be reached. Distinct from "empty" on purpose. */
function LoadFailedState() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Notice icon={CloudOff} title="The Gallery Couldn't Load" alert>
      <p className="lede mt-4 max-w-md">
        The photographs are safe. The server didn&apos;t answer and may be
        waking up, so try again in a moment.
      </p>
      <button
        type="button"
        onClick={() => startTransition(() => router.refresh())}
        disabled={pending}
        className="text-link mt-6"
      >
        {pending ? "Trying…" : "Try again"}
      </button>
    </Notice>
  );
}

/**
 * Gallery (Phase R): editorial heading, small-caps filter tabs, and the
 * masonry PhotoBrowser, whose cards open the in-page viewer instantly.
 */
export default function GalleryClient({
  photos,
  failed = false,
  initialFilter,
  initialPhotoId,
  initialColumns,
}: {
  photos: Photo[];
  failed?: boolean;
  initialFilter?: string;
  initialPhotoId?: string;
  initialColumns: number;
}) {
  const [activeFilter, setActiveFilter] = useState<string>(normaliseFilter(initialFilter));
  // A shared ?photo= link opens the viewer once. Changing filter remounts the
  // browser, so the hand-off is cleared then — or it would reopen every time.
  const [sharedPhotoId, setSharedPhotoId] = useState(initialPhotoId);
  // After the first filter change, the new set fades in (.filter-swap)
  // instead of snapping. Not on the first render: the page has its own entry.
  const [swapped, setSwapped] = useState(false);
  const chooseFilter = (f: string) => {
    setActiveFilter(f);
    setSharedPhotoId(undefined);
    setSwapped(true);
  };
  const visible = activeFilter === "All" ? photos : photos.filter((p) => p.category === activeFilter);

  return (
    <>
      <header className="mb-12 md:mb-16">
        <p className="caps enter">The collection</p>
        <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <h1 className="display-title enter" style={{ "--i": 1 } as CSSProperties}>Gallery</h1>
          <div role="group" aria-label="Filter by category" className="enter tab-row flex flex-wrap gap-x-7 gap-y-1" style={{ "--i": 2 } as CSSProperties}>
            {FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                aria-pressed={activeFilter === filter}
                onClick={() => chooseFilter(filter)}
                className="tab"
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div key={activeFilter} className={swapped ? "filter-swap" : undefined}>
        {failed ? (
          <LoadFailedState />
        ) : photos.length === 0 ? (
          <Notice icon={Camera} title="No Photographs Yet">
            <p className="lede mt-4 max-w-md">The collection is empty for now.</p>
          </Notice>
        ) : visible.length === 0 ? (
          <Notice icon={FunnelX} title={`No ${activeFilter} Photographs Yet`}>
            <button type="button" onClick={() => chooseFilter("All")} className="text-link mt-6">
              Show all
            </button>
          </Notice>
        ) : (
          <PhotoBrowser
            // Re-key on filter so the masonry rebalances and any open photo
            // index refers to the list being shown.
            key={activeFilter}
            photos={visible}
            label={activeFilter === "All" ? "All photographs" : `${activeFilter} photographs`}
            basePath="/work"
            query={activeFilter === "All" ? {} : { filter: activeFilter }}
            initialColumns={initialColumns}
            initialPhotoId={sharedPhotoId}
            eager={6}
          />
        )}
      </div>
    </>
  );
}
