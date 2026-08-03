"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import { revalidatePublicPages } from "../actions";
import PhotoCard from "./PhotoCard";
import UploadModal from "./UploadModal";
import EditModal from "./EditModal";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://theshutterbug.onrender.com";

const CATEGORIES = ["all", "nature", "objects", "monochrome", "urban"] as const;

export default function DashboardClient() {
  const router = useRouter();

  // ── Auth state ──────────────────────────────────────────────────────────
  // Lazy initializer reads localStorage synchronously on first render.
  const [token] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("admin_token");
  });

  // ── Data state ──────────────────────────────────────────────────────────
  const [photos, setPhotos] = useState<ApiPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // ── Modal state ─────────────────────────────────────────────────────────
  const [showUpload, setShowUpload] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<ApiPhoto | null>(null);
  const [deletingPhoto, setDeletingPhoto] = useState<ApiPhoto | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── dnd-kit sensors ─────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // ── Auth redirect — pure side-effect, no setState ───────────────────────
  useEffect(() => {
    if (!token) {
      router.replace("/admin");
    }
  }, [token, router]);

  // ── Fetch photos ────────────────────────────────────────────────────────
  const fetchPhotos = useCallback(async () => {
    if (!token) return;

    const url = new URL(`${API_URL}/api/photos`);
    if (activeCategory !== "all") {
      url.searchParams.set("category", activeCategory);
    }

    try {
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        // Token expired/invalid — clear and redirect
        localStorage.removeItem("admin_token");
        router.replace("/admin");
        return;
      }

      if (res.ok) {
        const data: ApiPhoto[] = await res.json();
        setPhotos(data);
      }
    } catch (err) {
      console.error("[admin] fetch photos failed:", err);
    } finally {
      setLoading(false);
    }
  }, [token, activeCategory, router]);

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

    try {
      const res = await fetch(`${API_URL}/api/photos/${deletingPhoto._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setDeletingPhoto(null);
        await fetchPhotos();
        // Revalidate public pages (addition #1)
        await revalidatePublicPages();
      }
    } catch (err) {
      console.error("[admin] delete failed:", err);
    } finally {
      setDeleting(false);
    }
  }

  // ── Drag-to-reorder handler ─────────────────────────────────────────────
  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !token) return;

    const oldIndex = photos.findIndex((p) => p._id === active.id);
    const newIndex = photos.findIndex((p) => p._id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    // Optimistic update
    const reordered = arrayMove(photos, oldIndex, newIndex);
    setPhotos(reordered);

    // Build items array with new positions
    const items = reordered.map((p, i) => ({ id: p._id, position: i }));

    try {
      const res = await fetch(`${API_URL}/api/photos/reorder`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items }),
      });

      if (!res.ok) {
        // Rollback on failure
        console.error("[admin] reorder failed, rolling back");
        await fetchPhotos();
      } else {
        // Revalidate public pages (addition #1)
        await revalidatePublicPages();
      }
    } catch (err) {
      console.error("[admin] reorder request failed:", err);
      await fetchPhotos();
    }
  }

  // ── Sign Out (addition #5) ──────────────────────────────────────────────
  function handleSignOut() {
    localStorage.removeItem("admin_token");
    router.replace("/admin");
  }

  // ── Loading state (addition #3) — show spinner if no token ──────────────
  if (!token) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-primary-container">
        <div className="admin-spinner" />
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="bg-primary-container text-on-surface font-body-md min-h-screen antialiased selection:bg-surface-variant selection:text-on-surface">
      <div className="flex h-screen overflow-hidden">
        {/* ─── SideNavBar (from reference) ──────────────────────────────── */}
        <nav className="hidden md:flex flex-col h-full p-4 gap-element-gap bg-surface-container-lowest text-primary fixed left-0 top-0 w-64 border-r border-outline-variant z-40">
          {/* Header */}
          <div className="mb-8 px-2 flex flex-col gap-2">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="Portfolio Logo"
                className="w-10 h-10 rounded-full object-cover border border-white/10"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDYNW773jLhQpdZIoV8HPMnJKDiMphlHxAFrGd6jZza8mljuuIMVMsjLrlGXobIise9FJrDYGN3qJJvEdDVIjDGW1jP0vB2eD6ONysq--iFZ7Pp6rEh82zU5Ly7JjMCHEipK9c8vSZ5SOzRVjCIeslYsAhk3iiLX8pr9DHntZRVnafiPG5sqLfRh9j2M9r_wYz2b92DNYeW024RNX94e5fKbDE5M0Hs_62jqZK4l52bNEziquOV64qn"
              />
              <div>
                <h2 className="font-headline-md text-headline-md font-bold text-primary">
                  The Shutter Bug
                </h2>
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                  Photography Admin
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 flex flex-col gap-2 mt-4">
            <a
              className="flex items-center gap-4 px-4 py-3 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all group"
              href="#"
            >
              <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">
                dashboard
              </span>
              <span className="font-label-sm text-label-sm uppercase">
                Dashboard
              </span>
            </a>
            <a
              className="flex items-center gap-4 px-4 py-3 rounded-lg bg-secondary-container text-on-secondary-container transition-all group"
              href="#"
            >
              <span className="material-symbols-outlined text-[20px]">
                photo_library
              </span>
              <span className="font-label-sm text-label-sm uppercase font-bold">
                Gallery
              </span>
            </a>
            <a
              className="flex items-center gap-4 px-4 py-3 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all group"
              href="#"
            >
              <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">
                auto_awesome_motion
              </span>
              <span className="font-label-sm text-label-sm uppercase">
                Series
              </span>
            </a>
            <a
              className="flex items-center gap-4 px-4 py-3 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all group"
              href="#"
            >
              <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">
                analytics
              </span>
              <span className="font-label-sm text-label-sm uppercase">
                Analytics
              </span>
            </a>
            <a
              className="flex items-center gap-4 px-4 py-3 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all group"
              href="#"
            >
              <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">
                person
              </span>
              <span className="font-label-sm text-label-sm uppercase">
                Account
              </span>
            </a>
          </div>

          {/* Footer Links */}
          <div className="flex flex-col gap-2 mt-auto border-t border-white/5 pt-4">
            <a
              className="flex items-center gap-4 px-4 py-3 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all group"
              href="#"
            >
              <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">
                help
              </span>
              <span className="font-label-sm text-label-sm uppercase">
                Support
              </span>
            </a>
            {/* Sign Out — addition #5 */}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-4 px-4 py-3 rounded-lg text-error hover:text-error/80 hover:bg-surface-container-high transition-all group w-full text-left"
            >
              <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">
                logout
              </span>
              <span className="font-label-sm text-label-sm uppercase">
                Sign Out
              </span>
            </button>
          </div>
        </nav>

        {/* ─── Main Content Canvas ──────────────────────────────────────── */}
        <main className="flex-1 md:ml-64 relative h-full overflow-y-auto overflow-x-hidden">
          {/* TopAppBar (from reference) */}
          <header className="fixed top-0 w-full md:w-[calc(100%-16rem)] z-50 bg-surface/10 backdrop-blur-3xl border-b border-white/15">
            <div className="flex justify-between items-center px-gutter py-4 w-full h-20">
              {/* Brand/Title */}
              <div className="flex items-center gap-4">
                <h1 className="font-headline-md text-headline-md font-semibold text-on-surface truncate">
                  Shutter Bug Archive
                </h1>
              </div>

              {/* Search & Actions */}
              <div className="flex items-center gap-4">
                {/* Category filter dropdown */}
                <div className="hidden sm:flex relative group">
                  <select
                    value={activeCategory}
                    onChange={(e) => setActiveCategory(e.target.value)}
                    className="appearance-none flex items-center gap-2 px-4 py-2 pr-8 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-on-surface font-label-sm text-label-sm uppercase transition-colors cursor-pointer focus:ring-0 focus:border-white/30"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c === "all" ? "All Categories" : c.charAt(0).toUpperCase() + c.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Icon Actions */}
                <div className="flex items-center gap-1 border-r border-white/10 pr-4 mr-1">
                  <button className="p-2 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-white/10 scale-95 active:scale-90 transition-all">
                    <span
                      className="material-symbols-outlined"
                      style={{ fontVariationSettings: "'FILL' 0" }}
                    >
                      notifications
                    </span>
                  </button>
                  <button className="p-2 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-white/10 scale-95 active:scale-90 transition-all">
                    <span
                      className="material-symbols-outlined"
                      style={{ fontVariationSettings: "'FILL' 0" }}
                    >
                      settings
                    </span>
                  </button>
                </div>

                {/* Primary Action & Profile */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowUpload(true)}
                    className="hidden sm:flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-on-primary hover:bg-primary/90 scale-95 active:scale-90 transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      add
                    </span>
                    <span className="font-label-sm text-label-sm uppercase font-bold">
                      Upload New Photo
                    </span>
                  </button>
                  {/* Mobile simplified action */}
                  <button
                    onClick={() => setShowUpload(true)}
                    className="sm:hidden p-2 rounded-full bg-primary text-on-primary hover:bg-primary/90 scale-95 active:scale-90 transition-all"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      add
                    </span>
                  </button>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="Admin profile"
                    className="w-10 h-10 rounded-full object-cover border border-white/20 cursor-pointer hover:opacity-80 transition-opacity"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAF3babSoyoypQ4V5Bkjxfv03_jv8H8Ttdo1lRZ8tqkpbaHL_Z7Cv5NGCWEkQ3c3IFS6OgfH7dbrDZOYajXzrSYnvKgogX2GtqZwj_aeUGv2ke4SIyCGjBT_flAIfxN_jLrnMqxhhAQkVQKLz3q6zejx9sJdHn0MvgLVEkeFtn6xgmrg1QZA54tdqexTOIy4TwF6O6sBPfpayDHtaYW70ReMrS2DEzIAI5gUo2wjZwJcpIWPJyK8egQ"
                  />
                </div>
              </div>
            </div>
          </header>

          {/* Content Area */}
          <div className="pt-28 px-margin-mobile md:px-margin-desktop pb-section-gap min-h-full">
            {/* Section Header */}
            <div className="mb-12 flex justify-between items-end">
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase mb-2">
                  Portfolio Management
                </p>
                <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">
                  Curated Gallery
                </h2>
              </div>
              <div className="hidden md:flex gap-2">
                <span className="px-3 py-1 rounded-full bg-surface-container border border-outline-variant font-label-sm text-label-sm uppercase">
                  {photos.length} Items
                </span>
              </div>
            </div>

            {/* ── Photo Grid / Empty state ──────────────────────────────── */}
            {loading ? (
              <div className="flex items-center justify-center py-32">
                <div className="admin-spinner" />
              </div>
            ) : photos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <span className="material-symbols-outlined text-[64px] text-outline/40 mb-6">
                  photo_library
                </span>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-3">
                  No photos yet
                </h3>
                <p className="font-body-md text-body-md text-outline max-w-xs leading-relaxed mb-6">
                  Upload your first photo to start building your curated
                  gallery.
                </p>
                <button
                  onClick={() => setShowUpload(true)}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-on-primary hover:bg-primary/90 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    add
                  </span>
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
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>

          {/* ── Mobile Sign Out (visible only on small screens) ──────── */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-surface-container-lowest/90 backdrop-blur-lg border-t border-white/10 z-40">
            <button
              onClick={handleSignOut}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-full text-error hover:bg-error/10 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">
                logout
              </span>
              <span className="font-label-sm text-label-sm uppercase">
                Sign Out
              </span>
            </button>
          </div>
        </main>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────── */}

      {/* Upload Modal */}
      {showUpload && token && (
        <UploadModal
          token={token}
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
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center admin-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget && !deleting)
              setDeletingPhoto(null);
          }}
        >
          <div className="admin-modal-enter liquid-glass rounded-xl w-full max-w-sm mx-4 p-8 flex flex-col gap-6 text-center">
            <span className="material-symbols-outlined text-[48px] text-error mx-auto">
              delete_forever
            </span>
            <h3 className="font-headline-md text-headline-md text-on-surface">
              Delete Photo?
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant">
              This will permanently remove the image from Cloudinary and the
              database. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDeletingPhoto(null)}
                disabled={deleting}
                className="px-6 py-3 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-on-surface font-label-sm text-label-sm uppercase transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-6 py-3 rounded-full bg-error-container text-on-error-container hover:bg-error-container/80 font-label-sm text-label-sm uppercase transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {deleting ? (
                  <div className="admin-spinner !w-4 !h-4 !border-[1.5px]" />
                ) : (
                  <span className="material-symbols-outlined text-[16px]">
                    delete
                  </span>
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
