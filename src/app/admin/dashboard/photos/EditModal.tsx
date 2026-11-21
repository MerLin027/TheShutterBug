"use client";

import { useState, type FormEvent } from "react";
import { photoImage, type ApiPhoto } from "@/lib/data";
import { apiUrl } from "@/lib/api";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/categories";
import StudioModal from "@/components/StudioModal";
import Spinner from "@/components/Spinner";
import { Save } from "lucide-react";

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
      setError("Couldn't reach the server. Please try again.");
      setSaving(false);
    }
  }

  return (
    <StudioModal title="Edit Photo" onClose={onClose}>
      {/* Preview fills the width and the frame follows the photo; max-h keeps
          a tall portrait from pushing the form off screen (letterboxed, not
          cropped). shrink-0 so it isn't what gives in the scrolling column. */}
      {/* The box is reserved from the stored aspect ratio, so the form
          doesn't jump when the photo arrives. Capped at 16rem tall; a
          portrait letterboxes inside it rather than being cropped. */}
      <div
        className="frame-media max-h-64 w-full shrink-0"
        style={{ aspectRatio: photo.aspectRatio > 0 ? photo.aspectRatio : 1.5 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary rendition */}
        <img
          src={photoImage(photo, 1200)}
          alt={photo.caption || "Photograph being edited"}
          className="!object-contain"
        />
      </div>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="edit-caption" className="field-label">
            Title <span className="font-normal text-fg-3">· optional</span>
          </label>
          <input
            id="edit-caption"
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={200}
            className="field"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="edit-category" className="field-label">
              Category
            </label>
            <select
              id="edit-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="field cursor-pointer"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="edit-location" className="field-label">
              Location <span className="font-normal text-fg-3">· optional</span>
            </label>
            <input
              id="edit-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={200}
              className="field"
            />
          </div>
        </div>

        <div>
          <label htmlFor="edit-tags" className="field-label">
            Tags <span className="font-normal text-fg-3">· comma separated, optional</span>
          </label>
          <input
            id="edit-tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            maxLength={500}
            className="field"
          />
        </div>

        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
            className="checkbox"
          />
          <span className="text-label text-fg">Feature in Curated Work</span>
        </label>

        {error && (
          <p role="alert" className="msg-in text-body-md text-error">
            {error}
          </p>
        )}

        <button type="submit" disabled={saving} aria-busy={saving} className="btn btn-primary w-full">
          {saving ? (
            <>
              <Spinner />
              Saving…
            </>
          ) : (
            <>
              <Save size={18} aria-hidden="true" />
              Save changes
            </>
          )}
        </button>
      </form>
    </StudioModal>
  );
}
