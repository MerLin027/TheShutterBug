"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import type { ApiPhoto } from "@/lib/data";
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
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
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
  return (
    <StudioShell>
      {/* One page heading, in the bar. This page used to print "Curated
          Gallery" here and "Portfolio Management / Gallery" again 80px
          below it, with the item count as a third element off to the side. */}
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
        {/* Category filter — working functionality, kept alongside the restyle.
            The label used to sit visibly off-centre in its pill: `px-4 pr-8`
            reserved 32px on the right for a dropdown arrow, but
            `appearance-none` had removed the native arrow and nothing was
            drawn in its place, so the reserved space read as 16px of padding
            on one side and 32px on the other. Both sides are equal now and
            the chevron is drawn explicitly, outside the text's box, so the
            text is centred against the whole pill. py-2.5 to match the Upload
            button beside it (both 42px tall; this was 38px). */}
        <div className="hidden sm:block relative">
          <select
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
            aria-label="Filter by category"
            className="btn-outline appearance-none w-full px-9 py-2.5 text-center text-on-surface font-label-sm text-label-sm uppercase cursor-pointer focus:ring-0"
          >
            {STUDIO_FILTERS.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "All categories" : categoryLabel(c)}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden="true"
            size={18}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
          />
        </div>

        <button
          onClick={() => setShowUpload(true)}
          className="btn-accent flex items-center gap-2 px-5 py-2.5"
        >
          <Plus size={18} aria-hidden="true" />
          <span className="hidden sm:inline font-label-sm text-label-sm uppercase">
            Upload photo
          </span>
        </button>
      </StudioTopBar>

      {/* Content Area */}
      <div className="px-margin-mobile md:px-margin-desktop py-10 min-h-full">
        {/* ── Photo Grid / Empty state ──────────────────────────────── */}
        {actionError && !error && (
          <p
            role="alert"
            className="mb-6 rounded-xl border border-error/30 bg-error/10 px-4 py-3 font-body-md text-body-md text-error"
          >
            {actionError}
          </p>
        )}
        {loading ? (
          <PhotoGridSkeleton />
        ) : error ? (
          <div
            role="alert"
            className="flex flex-col items-center justify-center py-32 gap-4 text-center"
          >
            <CircleAlert className="text-error/60" size={48} aria-hidden="true" />
            <p className="font-body-md text-body-md text-on-surface-variant max-w-xs">
              {error}
            </p>
            <button
              onClick={() => {
                setLoading(true);
                fetchPhotos();
              }}
              className="btn-outline flex items-center gap-2 px-6 py-2.5 text-on-surface font-label-sm text-label-sm uppercase"
            >
              <RefreshCw size={16} aria-hidden="true" />
              Retry
            </button>
          </div>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <Images className="text-on-surface-variant/30 mb-6" size={64} aria-hidden="true" />
            <h3 className="font-headline-md text-headline-md text-on-surface mb-3">
              No photos yet
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant/70 max-w-xs leading-relaxed mb-6">
              Upload your first photo to start building your curated
              gallery.
            </p>
            <button
              onClick={() => setShowUpload(true)}
              className="btn-accent flex items-center gap-2 px-6 py-3"
            >
              <Plus size={18} aria-hidden="true" />
              <span className="font-label-sm text-label-sm uppercase font-bold">
                Upload Photo
              </span>
            </button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={photos.map((p) => p._id)}
              strategy={rectSortingStrategy}
            >
              <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-gutter space-y-gutter">
                {photos.map((photo) => (
                  <PhotoCard
                    key={photo._id}
                    photo={photo}
                    onEdit={setEditingPhoto}
                    onDelete={setDeletingPhoto}
                    onToggleFeatured={handleToggleFeatured}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────── */}

      {/* Upload Modal */}
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

      {/* Edit Modal */}
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

      {/* Delete Confirmation */}
      {deletingPhoto && (
        /* dismissible={!deleting} preserves the existing rule that a delete
           in flight can't be dismissed — now enforced for Escape as well as
           for the backdrop click. */
        <StudioModal
          size="sm"
          className="text-center"
          dismissible={!deleting}
          onClose={closeDeleteDialog}
        >
          <Trash2 className="text-error mx-auto" size={48} aria-hidden="true" />
          <h3 className="font-headline-md text-headline-md text-on-surface">
            Delete photo?
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant">
            This will permanently remove the image from Cloudinary and the
            database. This action cannot be undone.
          </p>
          {deleteError && (
            <p role="alert" className="font-body-md text-body-md text-error">
              {deleteError}
            </p>
          )}
          <div className="flex gap-3 justify-center">
            <button
              onClick={closeDeleteDialog}
              disabled={deleting}
              className="btn-outline px-6 py-3 text-on-surface font-label-sm text-label-sm uppercase"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="btn-danger px-6 py-3 font-label-sm text-label-sm uppercase flex items-center gap-2"
            >
              {deleting ? (
                <Spinner />
              ) : (
                <Trash2 size={16} aria-hidden="true" />
              )}
              Delete
            </button>
          </div>
        </StudioModal>
      )}
    </StudioShell>
  );
}
