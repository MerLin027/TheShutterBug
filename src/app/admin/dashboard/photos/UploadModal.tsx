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
import { CloudUpload } from "lucide-react";
import { fitForUpload, MAX_SOURCE_BYTES } from "@/lib/fitUpload";

/*
 * Size: a file over the image host's 10 MB cap is no longer refused. It is
 * fitted under it at the highest quality that fits (src/lib/fitUpload.ts,
 * owner 2026-11-22); one under the cap is sent untouched.
 */

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
  const [preparing, setPreparing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** Client-side file validation (addition #4). */
  function validateFile(f: File): string | null {
    if (!f.type.startsWith("image/")) {
      return "Please select an image file (JPEG, PNG, WebP, etc.)";
    }
    if (f.size > MAX_SOURCE_BYTES) {
      return `File too large (${(f.size / 1024 / 1024).toFixed(0)} MB). Maximum is ${MAX_SOURCE_BYTES / 1024 / 1024} MB.`;
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

    // Measure the shape first, in its own try. A file the browser can't
    // decode (an iPhone HEIC in Chrome, some TIFFs) failed here and fell
    // into the network catch below, which said "Couldn't reach the server"
    // (2026-11-21 audit).
    let aspectRatio: number;
    try {
      const { width, height } = await getDimensions(file);
      aspectRatio = width / height;
    } catch {
      setError("This browser can't read that image. Export it as JPEG, PNG or WebP and try again.");
      setUploading(false);
      return;
    }

    // Over the host's cap: fit it, at the highest quality that fits.
    let toSend: File = file;
    try {
      setPreparing(true);
      toSend = (await fitForUpload(file)).file;
    } catch {
      setError("This image is too large to prepare in this browser. Export it as a JPEG under 10 MB and try again.");
      setUploading(false);
      return;
    } finally {
      setPreparing(false);
    }

    try {
      const formData = new FormData();
      formData.append("image", toSend);
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
      setError("Couldn't reach the server. Please try again.");
      setUploading(false);
    }
  }

  return (
    <StudioModal title="Upload Photo" onClose={onClose}>
      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        {/* Drop zone. The real file input sits inside it, visually hidden but
            focusable, so keyboard users can Tab to it and press Enter/Space —
            the old drop zone was a clickable <div> that no keyboard could
            reach. The focus ring is drawn on the zone (:focus-within). */}
        <label
          className={`dropzone ${dragActive ? "dropzone-active" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
            <img src={preview} alt="Selected photograph" className="mx-auto max-h-48 rounded-photo object-contain" />
          ) : (
            <span className="flex flex-col items-center gap-3 py-4">
              <CloudUpload size={28} className="text-fg-3" aria-hidden="true" />
              <span className="text-label font-medium text-fg">Drop an image here, or choose a file</span>
              <span className="frame-meta">Images only · files over 10 MB are fitted at top quality</span>
            </span>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="sr-only"
            aria-label="Choose an image file"
          />
        </label>

        {/* Title writes the `caption` field, which the site shows as the
            photo's title. */}
        <div>
          <label htmlFor="upload-title" className="field-label">
            Title <span className="font-normal text-fg-3">· optional</span>
          </label>
          <input
            id="upload-title"
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={200}
            className="field"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="upload-category" className="field-label">
              Category
            </label>
            <select
              id="upload-category"
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
            <label htmlFor="upload-location" className="field-label">
              Location <span className="font-normal text-fg-3">· optional</span>
            </label>
            <input
              id="upload-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={200}
              className="field"
            />
          </div>
        </div>

        <div>
          <label htmlFor="upload-tags" className="field-label">
            Tags <span className="font-normal text-fg-3">· comma separated, optional</span>
          </label>
          <input
            id="upload-tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            maxLength={500}
            className="field"
          />
        </div>

        {error && (
          <p role="alert" className="msg-in text-body-md text-error">
            {error}
          </p>
        )}

        <button type="submit" disabled={uploading || !file} aria-busy={uploading} className="btn btn-primary w-full">
          {uploading ? (
            <>
              <Spinner />
              {preparing ? "Preparing image…" : "Uploading…"}
            </>
          ) : (
            <>
              <CloudUpload size={18} aria-hidden="true" />
              Upload photo
            </>
          )}
        </button>
      </form>
    </StudioModal>
  );
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

/** Read an image file's pixel size. */
function getDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      // Release the copy on failure too; only onload did.
      URL.revokeObjectURL(img.src);
      reject(new Error("Could not read image dimensions"));
    };
    img.src = URL.createObjectURL(file);
  });
}
