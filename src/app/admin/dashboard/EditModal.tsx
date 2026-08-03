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
      <div className="admin-modal-enter liquid-glass rounded-xl w-full max-w-lg mx-4 p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-headline-md text-headline-md text-on-surface">
            Edit Photo
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Preview */}
        <div className="rounded-lg overflow-hidden bg-surface-container max-h-40 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.imageUrl}
            alt={photo.caption || "Photo"}
            className="max-h-40 w-auto object-contain"
          />
        </div>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          {/* Category */}
          <div className="space-y-1">
            <label className="font-label-sm text-label-sm text-outline-variant px-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-surface-container-high border border-white/10 rounded-lg px-3 py-2 text-on-surface font-body-md focus:border-tertiary focus:ring-0 transition-colors"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Caption */}
          <div className="space-y-1">
            <label className="font-label-sm text-label-sm text-outline-variant px-1">
              Caption
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="A brief description…"
              className="w-full bg-transparent border-0 border-b border-white/10 focus:border-tertiary focus:ring-0 text-on-surface font-body-md px-1 py-2 transition-colors placeholder:text-white/10"
            />
          </div>

          {/* Location */}
          <div className="space-y-1">
            <label className="font-label-sm text-label-sm text-outline-variant px-1">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Mumbai, India"
              className="w-full bg-transparent border-0 border-b border-white/10 focus:border-tertiary focus:ring-0 text-on-surface font-body-md px-1 py-2 transition-colors placeholder:text-white/10"
            />
          </div>

          {/* Tags */}
          <div className="space-y-1">
            <label className="font-label-sm text-label-sm text-outline-variant px-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="landscape, golden hour, coast"
              className="w-full bg-transparent border-0 border-b border-white/10 focus:border-tertiary focus:ring-0 text-on-surface font-body-md px-1 py-2 transition-colors placeholder:text-white/10"
            />
          </div>

          {/* Featured toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="rounded border-white/20 bg-surface-container-high text-tertiary focus:ring-0 focus:ring-offset-0"
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
            className="mt-2 liquid-glass rounded-full py-4 px-6 font-label-sm text-label-sm text-on-surface hover:bg-white/10 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
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
