"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type FormEvent,
  type ChangeEvent,
} from "react";
import { apiUrl } from "@/lib/api";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/categories";
import StudioModal from "@/components/StudioModal";
import Spinner from "@/components/Spinner";

/** Max file size: 10 MB (addition #4) */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

type Props = {
  onClose: () => void;
  onSuccess: () => void;
  /** Token expired mid-upload — clear the session and return to login. */
  onUnauthorized: () => void;
  token: string;
};

export default function UploadModal({
  onClose,
  onSuccess,
  onUnauthorized,
  token,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [tags, setTags] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
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

  /**
   * Swap the preview, releasing the one it replaces.
   *
   * Every preview is an object URL the browser holds until it is explicitly
   * revoked. Nothing revoked them: picking three files in a row leaked two
   * blobs, and closing the modal leaked the third. The live URL is mirrored
   * in a ref as well as in state so the unmount cleanup can reach it without
   * setting state on an unmounting component.
   */
  const previewRef = useRef<string | null>(null);

  const setPreviewUrl = useCallback((next: string | null) => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = next;
    setPreview(next);
  }, []);

  useEffect(() => {
    return () => {
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current);
        previewRef.current = null;
      }
    };
  }, []);

  /**
   * One accept path for the file picker and the drop zone — they were the
   * same six lines twice, and only one of the two reset the input.
   */
  const acceptFile = useCallback(
    (f: File) => {
      setError("");

      const validationError = validateFile(f);
      if (validationError) {
        setError(validationError);
        setFile(null);
        setPreviewUrl(null);
        // Reset the input so the same file can be re-selected after fixing
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      setFile(f);
      setPreviewUrl(URL.createObjectURL(f));
    },
    [setPreviewUrl]
  );

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) acceptFile(f);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) acceptFile(f);
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

      const res = await fetch(apiUrl("/api/photos"), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      // An expired JWT used to surface here as "Upload failed", with no way
      // to tell it apart from a rejected file.
      if (res.status === 401) {
        onUnauthorized();
        return;
      }

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
    <StudioModal title="Upload new photo" onClose={onClose}>
      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        {/* Drop zone / file picker — Drive-style, visual only */}
        <div
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
            dragActive
              ? "studio-dropzone-active"
              : "border-white/15 hover:border-white/30"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Preview"
              className="max-h-48 mx-auto rounded-xl object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 py-6">
              <span className="material-symbols-outlined text-[44px] text-on-surface-variant">
                cloud_upload
              </span>
              <p className="font-label-sm text-label-sm text-on-surface uppercase tracking-widest">
                Drop an image here, or click to browse
              </p>
              <p className="font-body-md text-xs text-on-surface-variant/70">
                Images only · max 10MB
              </p>
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

        {/* Title — writes to the `caption` field, which the frontend
            already surfaces as each photo's display title */}
        <div className="studio-field px-4 py-3">
          <label className="sr-only" htmlFor="upload-title">
            Title
          </label>
          <input
            id="upload-title"
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Title"
            className="w-full bg-transparent border-0 text-on-surface font-body-md focus:ring-0 focus:outline-none p-0 placeholder:text-on-surface-variant/50"
          />
        </div>

        {/* Genre */}
        <div className="studio-field px-4 py-3">
          <label className="sr-only" htmlFor="upload-genre">
            Genre
          </label>
          <select
            id="upload-genre"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-transparent border-0 text-on-surface font-body-md focus:ring-0 focus:outline-none p-0 cursor-pointer"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="bg-surface-container-high">
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>

        {/* Location */}
        <div className="studio-field px-4 py-3">
          <label className="sr-only" htmlFor="upload-location">
            Location
          </label>
          <input
            id="upload-location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location"
            className="w-full bg-transparent border-0 text-on-surface font-body-md focus:ring-0 focus:outline-none p-0 placeholder:text-on-surface-variant/50"
          />
        </div>

        {/* Tags */}
        <div className="studio-field px-4 py-3">
          <label className="sr-only" htmlFor="upload-tags">
            Tags, comma separated
          </label>
          <input
            id="upload-tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Tags, comma separated"
            className="w-full bg-transparent border-0 text-on-surface font-body-md focus:ring-0 focus:outline-none p-0 placeholder:text-on-surface-variant/50"
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
          className="btn-glass mt-2 px-8 py-3 font-label-sm text-label-sm uppercase tracking-widest text-on-surface flex items-center justify-center gap-3"
        >
          {uploading ? (
            <>
              <Spinner />
              <span>Uploading…</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[16px]">
                cloud_upload
              </span>
              Add to Archive
            </>
          )}
        </button>
      </form>
    </StudioModal>
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
