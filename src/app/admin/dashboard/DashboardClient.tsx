"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type KeyboardCoordinateGetter,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { cloudinaryUrl, type ApiPhoto } from "@/lib/data";
import { apiUrl } from "@/lib/api";
import { STUDIO_FILTERS, categoryLabel } from "@/lib/categories";
import { useAdminToken } from "@/lib/useAdminToken";
import { revalidatePublicPages } from "../actions";
import StudioShell from "@/components/StudioShell";
import StudioTopBar from "@/components/StudioTopBar";
import StudioModal from "@/components/StudioModal";
import Spinner from "@/components/Spinner";
import { PhotoGridSkeleton, StudioBoot } from "@/components/StudioSkeletons";
import PhotoCard from "./PhotoCard";
import UploadModal from "./UploadModal";
import EditModal from "./EditModal";
import { ChevronDown, CircleAlert, Images, Plus, RefreshCw, Trash2 } from "lucide-react";

/**
 * Keyboard reordering in READING order. dnd-kit's stock getter is spatial:
 * an arrow moves to the nearest card in that direction, which in justified
 * rows means a photo at the start of a row can't move left at all, and
 * Right can jump it to the end of the row above (found in the Phase C
 * check). Here Left/Up always mean "one frame earlier" and Right/Down "one
 * frame later", matching the order visitors read. The dragged card is
 * centred on the target so closestCenter picks exactly that slot.
 */
const readingOrderCoordinates: KeyboardCoordinateGetter = (event, { context }) => {
  const steps: Record<string, number> = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 };
  const step = steps[event.code];
  if (!step) return undefined;
  event.preventDefault();

  const { active, over, collisionRect, droppableRects } = context;
  if (!active || !collisionRect) return undefined;

  const items = (active.data.current?.sortable?.items ?? []) as UniqueIdentifier[];
  const target = items[items.indexOf(over?.id ?? active.id) + step];
  const rect = target === undefined ? undefined : droppableRects.get(target);
  if (!rect) return undefined;

  return {
    x: rect.left + rect.width / 2 - collisionRect.width / 2,
    y: rect.top + rect.height / 2 - collisionRect.height / 2,
  };
};

export default function DashboardClient() {
  // ── Auth state ──────────────────────────────────────────────────────────
  // See useAdminToken for why this is an effect rather than a lazy
  // initialiser: localStorage doesn't exist at SSR time, so reading it during
  // the first render made the server and client disagree about which tree to
  // paint. The hook also owns the redirect when there's no token.
  const { token, ready, signOut } = useAdminToken();

  // ── Data state ──────────────────────────────────────────────────────────
  const [photos, setPhotos] = useState<ApiPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  // Full-page load failure. Gated ahead of the empty state: a dead backend
  // used to render "No photos yet — upload your first photo".
  const [error, setError] = useState("");
  // A single action failed (featured toggle, reorder). The grid stays; this
  // says why the change didn't stick. Cleared by the next attempt.
  const [actionError, setActionError] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // ── Modal state ─────────────────────────────────────────────────────────
  const [showUpload, setShowUpload] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<ApiPhoto | null>(null);
  const [deletingPhoto, setDeletingPhoto] = useState<ApiPhoto | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // ── dnd-kit sensors ─────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    // Keyboard reordering: focus a card's handle, Space to lift, arrows to
    // move, Space to drop, Escape to cancel. Drag used to be pointer-only.
    useSensor(KeyboardSensor, { coordinateGetter: readingOrderCoordinates })
  );

  // ── Fetch photos ────────────────────────────────────────────────────────
  const fetchPhotos = useCallback(async () => {
    if (!token) return;

    const url = new URL(apiUrl("/api/photos"));
    if (activeCategory !== "all") {
      url.searchParams.set("category", activeCategory);
    }

    try {
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        signOut();
        return;
      }

      if (!res.ok) {
        setError("The gallery couldn't be loaded. Please try again.");
        return;
      }

      const data: ApiPhoto[] = await res.json();
      setPhotos(data);
      setError("");
    } catch (err) {
      console.error("[admin] fetch photos failed:", err);
      setError("Network error — the server didn't answer. It may be waking up.");
    } finally {
      setLoading(false);
    }
  }, [token, activeCategory, signOut]);

  // Fetch on mount and when category changes.
  // The fetchPhotos callback calls setPhotos/setLoading internally, but
  // the effect itself just invokes the async function — the setState calls
  // happen in the fetch promise callbacks, not synchronously in the effect body.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPhotos();
  }, [fetchPhotos]);

  // ── Delete handler ──────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deletingPhoto || !token) return;
    setDeleting(true);
    setDeleteError("");

    try {
      const res = await fetch(apiUrl(`/api/photos/${deletingPhoto._id}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        signOut();
        return;
      }

      // Shown inside the confirm dialog, as Messages does. This used to
      // close nothing and say nothing — the dialog just stopped spinning.
      if (!res.ok) {
        setDeleteError("The photo couldn't be deleted. Please try again.");
        return;
      }

      setDeletingPhoto(null);
      await fetchPhotos();
      await revalidatePublicPages();
    } catch (err) {
      console.error("[admin] delete failed:", err);
      setDeleteError("Network error — the photo wasn't deleted.");
    } finally {
      setDeleting(false);
    }
  }

  // ── Drag-to-reorder handler ─────────────────────────────────────────────
  //
  // The payload used to be `reordered.map((p, i) => ({ id, position: i }))` —
  // absolute positions 0…n-1. That is only correct when `photos` is the whole
  // gallery, and it isn't whenever a category filter is active: the filter
  // refetches with ?category=, so dragging inside "Nature" rewrote every
  // Nature photo to 0…k and collided head-on with the Urban and Objects
  // photos already holding those numbers. `GET /api/photos` sorts on
  // `position`, so the public gallery's order went arbitrary — and the Stage 2
  // upload fix (max+1) made this MORE reachable, not less, by spreading
  // positions across a real range instead of leaving them all at 0.
  //
  // Instead, permute the positions the visible set already holds. The list
  // arrives sorted by position, so reassigning that same multiset of values in
  // the new visual order is exactly "swap these two cards' slots" — correct
  // filtered or not, and it cannot touch a photo that isn't on screen.
  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !token) return;

    const oldIndex = photos.findIndex((p) => p._id === active.id);
    const newIndex = photos.findIndex((p) => p._id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const slots = photos.map((p) => p.position);
    const moved = arrayMove(photos, oldIndex, newIndex);

    // Carry the new positions into local state too, so a second drag before
    // the refetch lands reads the values the server now holds rather than the
    // pre-drag ones.
    const reordered = moved.map((p, i) => ({ ...p, position: slots[i] }));
    setPhotos(reordered);

    const items = reordered.map((p) => ({ id: p._id, position: p.position }));
    setActionError("");

    try {
      const res = await fetch(apiUrl("/api/photos/reorder"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items }),
      });

      if (res.status === 401) {
        signOut();
        return;
      }

      if (!res.ok) {
        // Roll back to what the server holds, and say so — the cards used to
        // snap back with no explanation.
        setActionError("The new order wasn't saved. The gallery has been reset.");
        await fetchPhotos();
      } else {
        await revalidatePublicPages();
      }
    } catch (err) {
      console.error("[admin] reorder request failed:", err);
      setActionError("Network error — the new order wasn't saved.");
      await fetchPhotos();
    }
  }

  // ── Featured toggle (§1.8) — optimistic, with rollback on failure ───────
  async function handleToggleFeatured(photo: ApiPhoto) {
    if (!token) return;
    const nextValue = !photo.isFeatured;
    const rollback = () =>
      setPhotos((prev) =>
        prev.map((p) => (p._id === photo._id ? { ...p, isFeatured: !nextValue } : p))
      );

    setActionError("");
    setPhotos((prev) =>
      prev.map((p) => (p._id === photo._id ? { ...p, isFeatured: nextValue } : p))
    );

    try {
      const res = await fetch(apiUrl(`/api/photos/${photo._id}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isFeatured: nextValue }),
      });

      if (res.status === 401) {
        signOut();
        return;
      }

      if (!res.ok) {
        rollback();
        setActionError("That change wasn't saved. Please try again.");
        return;
      }

      await revalidatePublicPages();
    } catch (err) {
      console.error("[admin] toggle featured failed:", err);
      rollback();
      setActionError("Network error — that change wasn't saved.");
    }
  }

  function closeDeleteDialog() {
    setDeletingPhoto(null);
    setDeleteError("");
  }

  // ── Pre-auth: the session read hasn't happened yet, or there's no token
  //    and the hook's redirect is in flight ─────────────────────────────────
  if (!ready || !token) {
    return <StudioBoot />;
  }

  // ── Render ──────────────────────────────────────────────────────────────
  const categorySelect = (id: string) => (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        Filter by category
      </label>
      <select
        id={id}
        value={activeCategory}
        onChange={(e) => setActiveCategory(e.target.value)}
        className="field h-11 cursor-pointer appearance-none py-0 pl-3 pr-9 text-label"
      >
        {STUDIO_FILTERS.map((c) => (
          <option key={c} value={c}>
            {c === "all" ? "All categories" : categoryLabel(c)}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-fg-3"
      />
    </div>
  );

  return (
    <StudioShell>
      <StudioTopBar
        title="Gallery"
        count={
          // No count while loading or failed: "0 frames" during an outage
          // repeats the false "empty gallery" claim in a smaller font.
          loading || error
            ? undefined
            : `${photos.length} ${photos.length === 1 ? "frame" : "frames"}`
        }
      >
        <div className="hidden sm:block">{categorySelect("category-filter")}</div>
        <button
          type="button"
          onClick={() => setShowUpload(true)}
          className="btn btn-primary h-11 px-3 sm:px-4"
          aria-label="Upload photo"
        >
          <Plus size={18} aria-hidden="true" />
          <span className="hidden sm:inline">Upload</span>
        </button>
      </StudioTopBar>

      <div className="px-4 pb-16 pt-6 md:px-8 md:pt-8">
        {/* Phones: the filter was simply missing below `sm`. */}
        <div className="mb-6 sm:hidden">{categorySelect("category-filter-mobile")}</div>

        {actionError && !error && (
          <p
            role="alert"
            className="mb-6 rounded-control border border-error/30 bg-error/10 px-4 py-3 text-body-md text-error"
          >
            {actionError}
          </p>
        )}

        {loading ? (
          <PhotoGridSkeleton />
        ) : error ? (
          <div role="alert" className="flex flex-col items-center px-6 py-24 text-center">
            <CircleAlert size={32} className="mb-5 text-fg-3" aria-hidden="true" />
            <p className="max-w-sm text-body-md text-fg-2">{error}</p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                fetchPhotos();
              }}
              className="btn btn-quiet mt-6"
            >
              <RefreshCw size={16} aria-hidden="true" />
              Retry
            </button>
          </div>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-24 text-center">
            <Images size={32} className="mb-5 text-fg-3" aria-hidden="true" />
            <h2 className="text-heading font-medium text-fg">No photographs yet</h2>
            <p className="mt-3 max-w-sm text-body-md text-fg-2">
              {activeCategory === "all"
                ? "Upload the first one to start the gallery."
                : `Nothing in ${categoryLabel(activeCategory)} yet.`}
            </p>
            <button type="button" onClick={() => setShowUpload(true)} className="btn btn-primary mt-6">
              <Plus size={18} aria-hidden="true" />
              Upload photo
            </button>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={photos.map((p) => p._id)} strategy={rectSortingStrategy}>
              {/* Same justified rows as the public gallery (task C2), so the
                  drag order here is the reading order there. */}
              {/* A shorter row than the public grid: the Studio is for overview,
                  so about four frames fit per row at 1440px instead of two. */}
              <ul className="justified [--row:11rem]" aria-label="Photographs, in gallery order">
                {photos.map((photo) => (
                  <PhotoCard
                    key={photo._id}
                    photo={photo}
                    onEdit={setEditingPhoto}
                    onDelete={setDeletingPhoto}
                    onToggleFeatured={handleToggleFeatured}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {showUpload && token && (
        <UploadModal
          token={token}
          onUnauthorized={signOut}
          onClose={() => setShowUpload(false)}
          onSuccess={async () => {
            setShowUpload(false);
            await fetchPhotos();
            await revalidatePublicPages();
          }}
        />
      )}

      {editingPhoto && token && (
        <EditModal
          photo={editingPhoto}
          token={token}
          onUnauthorized={signOut}
          onClose={() => setEditingPhoto(null)}
          onSuccess={async () => {
            setEditingPhoto(null);
            await fetchPhotos();
            await revalidatePublicPages();
          }}
        />
      )}

      {deletingPhoto && (
        /* dismissible={!deleting}: a delete in flight can't be dismissed by
           Escape or a backdrop click. */
        <StudioModal size="sm" title="Delete photo?" dismissible={!deleting} onClose={closeDeleteDialog}>
          <div className="frame-media mx-auto max-h-40 w-fit">
            {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary rendition */}
            <img
              src={cloudinaryUrl(deletingPhoto.imageUrl, 480)}
              alt=""
              className="max-h-40 w-auto"
            />
          </div>
          <p className="text-body-md text-fg-2">
            This permanently removes the photograph from the gallery and from
            Cloudinary. It can&apos;t be undone.
          </p>
          {deleteError && (
            <p role="alert" className="text-body-md text-error">
              {deleteError}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={closeDeleteDialog} disabled={deleting} className="btn btn-quiet">
              Cancel
            </button>
            <button type="button" onClick={handleDelete} disabled={deleting} className="btn btn-danger">
              {deleting ? <Spinner /> : <Trash2 size={16} aria-hidden="true" />}
              Delete
            </button>
          </div>
        </StudioModal>
      )}
    </StudioShell>
  );
}
