"use client";

import { useState, type FormEvent } from "react";
import type { ApiPhoto } from "@/lib/data";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://theshutterbug.onrender.com";

/** Matches backend Photo model enum — lowercase, same as DB (addition #6). */
const CATEGORIES = ["nature", "objects", "monochrome", "urban"] as const;

type Props = {
  photo: ApiPhoto;
  onClose: () => void;
  onSuccess: () => void;
  token: string;
};

export default function EditModal({ photo, onClose, onSuccess, token }: Props) {
  const [category, setCategory] = useState(photo.category);
  const [caption, setCaption] = useState(photo.caption);
  const [location, setLocation] = useState(photo.location);
  const [tags, setTags] = useState(photo.tags.join(", "));
  const [isFeatured, setIsFeatured] = useState(photo.isFeatured);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const res = await fetch(`${API_URL}/api/photos/${photo._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category,
          caption,
          location,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          isFeatured,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: "Update failed" }));
        setError(data.message || "Update failed");
        setSaving(false);
        return;
      }

      onSuccess();
    } catch {
      setError("Network error — is the backend running?");
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center admin-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="admin-modal-enter liquid-glass rounded-2xl w-full max-w-lg mx-4 p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-headline-md text-headline-md text-on-surface">
            Edit photo
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="btn-icon-glass text-on-surface"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Preview.

            The photo now fills the width it's given and the frame follows the
            photo, instead of the photo being pinned to 144px tall inside a
            401px-wide box. That box was doing exactly what it was told —
            `object-contain` was working, the image measured 256x144 at its
            true 16:9 — but a picture floating in the middle of a grey slab
            with 72px of dead space on each side reads as a broken thumbnail,
            not as a preview.

            `w-full` with `h-auto` is how the gallery card renders the same
            image; `max-h-64` and `object-contain` keep a tall portrait from
            pushing the form off the screen, and letterbox it rather than
            crop it if it hits that ceiling. */}
        <div className="rounded-2xl overflow-hidden bg-surface-container">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.imageUrl}
            alt={photo.caption || "Photo"}
            className="block w-full h-auto max-h-64 object-contain"
          />
        </div>

        {/* All four controls use .studio-field, the same filled treatment as
            the Contact form, the Account page and the Studio login. This
            modal previously carried two more field styles of its own — a
            bordered select and underlined inputs — and placeholder text at
            white/10, which was effectively invisible. */}
        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          {/* Category */}
          <div className="space-y-2">
            <label
              htmlFor="edit-category"
              className="block font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant px-1"
            >
              Category
            </label>
            <div className="studio-field px-4 py-3">
              <select
                id="edit-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-transparent border-0 p-0 text-on-surface font-body-md text-body-md focus:ring-0 focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-surface-container">
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Caption */}
          <div className="space-y-2">
            <label
              htmlFor="edit-caption"
              className="block font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant px-1"
            >
              Caption
            </label>
            <div className="studio-field px-4 py-3">
              <input
                id="edit-caption"
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="A brief description…"
                className="w-full bg-transparent border-0 p-0 text-on-surface font-body-md text-body-md focus:ring-0 focus:outline-none placeholder:text-on-surface-variant/40"
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label
              htmlFor="edit-location"
              className="block font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant px-1"
            >
              Location
            </label>
            <div className="studio-field px-4 py-3">
              <input
                id="edit-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Mumbai, India"
                className="w-full bg-transparent border-0 p-0 text-on-surface font-body-md text-body-md focus:ring-0 focus:outline-none placeholder:text-on-surface-variant/40"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label
              htmlFor="edit-tags"
              className="block font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant px-1"
            >
              Tags (comma-separated)
            </label>
            <div className="studio-field px-4 py-3">
              <input
                id="edit-tags"
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="landscape, golden hour, coast"
                className="w-full bg-transparent border-0 p-0 text-on-surface font-body-md text-body-md focus:ring-0 focus:outline-none placeholder:text-on-surface-variant/40"
              />
            </div>
          </div>

          {/* Featured toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="rounded border-white/20 bg-surface-container-high text-accent focus:ring-0 focus:ring-offset-0"
            />
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
              Featured Photo
            </span>
          </label>

          {/* Error */}
          {error && (
            <p className="text-error text-sm text-center">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="btn-glass mt-2 px-8 py-3 font-label-sm text-label-sm uppercase tracking-widest text-on-surface flex items-center justify-center gap-3"
          >
            {saving ? (
              <>
                <div className="admin-spinner !w-4 !h-4 !border-[1.5px]" />
                <span>Saving…</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">
                  save
                </span>
                Save Changes
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
