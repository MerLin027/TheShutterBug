"use client";

import { useState, type FormEvent } from "react";
import type { ApiPhoto } from "@/lib/data";
import { apiUrl } from "@/lib/api";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/categories";
import StudioModal from "@/components/StudioModal";
import Spinner from "@/components/Spinner";

type Props = {
  photo: ApiPhoto;
  onClose: () => void;
  onSuccess: () => void;
  /** Token expired mid-edit — clear the session and return to login. */
  onUnauthorized: () => void;
  token: string;
};

export default function EditModal({
  photo,
  onClose,
  onSuccess,
  onUnauthorized,
  token,
}: Props) {
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
      const res = await fetch(apiUrl(`/api/photos/${photo._id}`), {
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

      // An expired JWT used to surface here as "Update failed", leaving the
      // admin retyping a form that could never save. Same handling as the
      // dashboard's own fetches.
      if (res.status === 401) {
        onUnauthorized();
        return;
      }

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
    <StudioModal title="Edit photo" onClose={onClose}>
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
      {/* shrink-0 because this sits in a `flex flex-col max-h-[90vh]`
          column: without it the preview is the thing that gives when the
          form is taller than the viewport, and `overflow-hidden` then crops
          the bottom off the photo. Measured at 1440x900: the image wanted
          225.7px and the frame had been squeezed to 208.8px. The modal
          already scrolls (`overflow-y-auto`) — let it. */}
      <div className="shrink-0 rounded-2xl overflow-hidden bg-surface-container">
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
                  {CATEGORY_LABELS[c]}
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
              <Spinner />
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
    </StudioModal>
  );
}
