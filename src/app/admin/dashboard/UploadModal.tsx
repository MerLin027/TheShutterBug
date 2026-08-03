"use client";

import { useState, useRef, type FormEvent, type ChangeEvent } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://theshutterbug.onrender.com";

/** Matches backend Photo model enum — lowercase, same as DB. */
const CATEGORIES = ["nature", "objects", "monochrome", "urban"] as const;

/** Max file size: 10 MB (addition #4) */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

type Props = {
  onClose: () => void;
  onSuccess: () => void;
  token: string;
};

export default function UploadModal({ onClose, onSuccess, token }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [tags, setTags] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** Client-side file validation (addition #4). */
  function validateFile(f: File): string | null {
    if (!f.type.startsWith("image/")) {
      return "Please select an image file (JPEG, PNG, WebP, etc.)";
    }
    if (f.size > MAX_FILE_SIZE) {
      return `File too large (${(f.size / 1024 / 1024).toFixed(1)} MB). Maximum is 10 MB.`;
    }
    return null;
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    setError("");
    const f = e.target.files?.[0];
    if (!f) return;

    const validationError = validateFile(f);
    if (validationError) {
      setError(validationError);
      setFile(null);
      setPreview(null);
      // Reset the input so the same file can be re-selected after fixing
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setError("");
    const f = e.dataTransfer.files?.[0];
    if (!f) return;

    const validationError = validateFile(f);
    if (validationError) {
      setError(validationError);
      return;
    }

    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Please select an image file.");
      return;
    }

    setError("");
    setUploading(true);

    try {
      // Compute aspect ratio from image dimensions
      const aspectRatio = await getAspectRatio(file);

      const formData = new FormData();
      formData.append("image", file);
      formData.append("category", category);
      formData.append("caption", caption);
      formData.append("location", location);
      formData.append("tags", tags);
      formData.append("aspectRatio", aspectRatio.toString());

      const res = await fetch(`${API_URL}/api/photos`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: "Upload failed" }));
        setError(data.message || "Upload failed");
        setUploading(false);
        return;
      }

      onSuccess();
    } catch {
      setError("Network error — is the backend running?");
      setUploading(false);
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
            Upload New Photo
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          {/* Drop zone / file picker */}
          <div
            className="relative border-2 border-dashed border-white/15 rounded-lg p-6 text-center cursor-pointer hover:border-white/30 transition-colors"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Preview"
                className="max-h-48 mx-auto rounded-lg object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 py-4">
                <span className="material-symbols-outlined text-[40px] text-on-surface-variant">
                  cloud_upload
                </span>
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                  Drop image here or click to browse
                </p>
                <p className="text-xs text-outline">Max 10 MB • JPEG, PNG, WebP</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

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

          {/* Error */}
          {error && (
            <p className="text-error text-sm text-center">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={uploading || !file}
            className="mt-2 liquid-glass rounded-full py-4 px-6 font-label-sm text-label-sm text-on-surface hover:bg-white/10 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {uploading ? (
              <>
                <div className="admin-spinner !w-4 !h-4 !border-[1.5px]" />
                <span>Uploading…</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">
                  cloud_upload
                </span>
                Upload Photo
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

/** Read an image file and return width/height ratio. */
function getAspectRatio(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img.naturalWidth / img.naturalHeight);
    };
    img.onerror = () => reject(new Error("Could not read image dimensions"));
    img.src = URL.createObjectURL(file);
  });
}
