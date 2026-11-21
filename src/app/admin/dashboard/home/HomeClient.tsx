"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { ArrowRight, Download, ImageUp, RefreshCw } from "lucide-react";
import { apiUrl } from "@/lib/api";
import { DEFAULT_SITE_CONTENT, photoImage, pickImage, splitBio, type ApiPhoto } from "@/lib/data";
import { categoryLabel } from "@/lib/categories";
import { useAdminToken } from "@/lib/useAdminToken";
import StudioShell from "@/components/StudioShell";
import StudioTopBar from "@/components/StudioTopBar";
import Spinner from "@/components/Spinner";
import { StudioBoot } from "@/components/StudioSkeletons";
import { revalidatePublicPages } from "../../actions";

/** In step with backend/models/SiteContent.js and config/cloudinary.js. */
const STATEMENT_MAX = 1000;
const ALT_MAX = 300;
const MAX_FILE_MB = 25;

/** The preview URL for the hero as the API sends it: a signed display size
 *  for an uploaded hero (Phase D10), or the placeholder's own URL. */
function heroPreviewUrl(data: { heroImages?: Record<string, string> | null; heroImageUrl?: string }): string {
  if (data.heroImages) return pickImage(data.heroImages, 1600);
  return data.heroImageUrl || DEFAULT_SITE_CONTENT.heroImageUrl;
}

/**
 * Studio → Home page (2026-11-15): the hero photograph (replace, describe,
 * download the current one) and the "The work" section (show or hide, and
 * its text). Saves go to /api/site-content, then the public pages are
 * revalidated so Home changes at once.
 */
export default function HomeClient() {
  const { token, ready, signOut } = useAdminToken();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Saved state from the server.
  const [heroUrl, setHeroUrl] = useState(DEFAULT_SITE_CONTENT.heroImageUrl);
  // Editable fields.
  const [heroAlt, setHeroAlt] = useState(DEFAULT_SITE_CONTENT.heroImageAlt);
  const [showStatement, setShowStatement] = useState(true);
  const [statement, setStatement] = useState("");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Replacing the photograph: pick → preview + describe → upload.
  const fileInput = useRef<HTMLInputElement>(null);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [newPreview, setNewPreview] = useState<string | null>(null);
  const [newAlt, setNewAlt] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [downloading, setDownloading] = useState(false);

  // Selected work (read-only here; starred in Photographs). null = failed.
  const [featured, setFeatured] = useState<ApiPhoto[] | null>([]);

  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (savedTimer.current) clearTimeout(savedTimer.current);
  }, []);

  // The local preview is an object URL; release it when it changes or the
  // page goes away.
  useEffect(() => {
    if (!newPreview) return;
    return () => URL.revokeObjectURL(newPreview);
  }, [newPreview]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const [res, photosRes] = await Promise.all([
          fetch(apiUrl("/api/site-content"), { cache: "no-store" }),
          fetch(apiUrl("/api/photos"), { cache: "no-store" }).catch(() => null),
        ]);
        if (cancelled) return;
        if (photosRes?.ok) {
          const all: ApiPhoto[] = await photosRes.json();
          if (!cancelled) setFeatured(all.filter((p) => p.isFeatured));
        } else {
          setFeatured(null);
        }
        if (!res.ok) {
          setLoadError("Couldn't load the current settings, so the defaults are shown.");
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        setHeroUrl(heroPreviewUrl(data));
        if (data.heroImageAlt) setHeroAlt(data.heroImageAlt);
        if (typeof data.showWorkStatement === "boolean") setShowStatement(data.showWorkStatement);
        // Empty = Home is using the bio's second paragraph; show that text,
        // so what's in the box is what visitors read.
        const bio = splitBio(data.bio || DEFAULT_SITE_CONTENT.bio);
        setStatement((data.workStatement || "").trim() || bio[1] || bio[0] || "");
      } catch {
        if (!cancelled) setLoadError("Couldn't reach the server, so the defaults are shown.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function refreshPublic() {
    // The change already landed; a failed revalidate only delays it ≤60 s.
    try {
      await revalidatePublicPages(token);
    } catch {
      console.error("[home] revalidate failed after a successful change");
    }
  }

  async function handleSave() {
    setSaveError("");
    setSaved(false);
    if (showStatement && !statement.trim()) {
      setSaveError("Write the text for “The work”, or switch the section off.");
      return;
    }
    if (!heroAlt.trim()) {
      setSaveError("Describe the background photograph — screen readers read this aloud.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(apiUrl("/api/site-content"), {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          heroImageAlt: heroAlt.trim(),
          showWorkStatement: showStatement,
          workStatement: statement.trim(),
        }),
      });
      if (res.status === 401) {
        signOut();
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSaveError(data.message || "Save failed. Please try again.");
        return;
      }
      await refreshPublic();
      setSaved(true);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaved(false), 3000);
    } catch {
      setSaveError("Couldn't reach the server. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function onPick(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = ""; // picking the same file again still fires
    if (!f) return;
    setUploadError("");
    if (!f.type.startsWith("image/")) {
      setUploadError("Please choose an image file (JPEG, PNG, WebP…).");
      return;
    }
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      setUploadError(`That image is over ${MAX_FILE_MB} MB.`);
      return;
    }
    setNewFile(f);
    setNewPreview(URL.createObjectURL(f));
    setNewAlt("");
  }

  function cancelReplace() {
    setNewFile(null);
    setNewPreview(null);
    setNewAlt("");
    setUploadError("");
  }

  async function handleUpload() {
    if (!newFile) return;
    if (!newAlt.trim()) {
      setUploadError("Describe the new photograph first — screen readers read this aloud.");
      return;
    }
    setUploading(true);
    setUploadError("");
    try {
      const form = new FormData();
      form.append("image", newFile);
      form.append("alt", newAlt.trim());
      const res = await fetch(apiUrl("/api/site-content/hero"), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (res.status === 401) {
        signOut();
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUploadError(data.message || "Upload failed. Please try again.");
        return;
      }
      setHeroUrl(heroPreviewUrl(data));
      setHeroAlt(data.heroImageAlt);
      cancelReplace();
      await refreshPublic();
    } catch {
      setUploadError("Couldn't reach the server. It may be waking up, so try again in a moment.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      // The public site only ever gets signed display sizes (Phase D10). The
      // stored file comes from an owner-only route as a five-minute link.
      const res = await fetch(apiUrl("/api/site-content/hero/download"), {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (res.status === 401) {
        signOut();
        return;
      }
      const data: { url?: string; placeholder?: boolean } = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(String(res.status));

      if (!data.placeholder) {
        window.location.assign(data.url);
        return;
      }

      // The original placeholder lives on another host: fetch it and save the
      // bytes; if that host refuses (CORS), open it in a tab to save by hand.
      try {
        const img = await fetch(data.url);
        if (!img.ok) throw new Error(String(img.status));
        const blob = await img.blob();
        const href = URL.createObjectURL(blob);
        const ext = blob.type.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
        const a = document.createElement("a");
        a.href = href;
        a.download = `home-background.${ext}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(href), 1000);
      } catch {
        window.open(data.url, "_blank", "noopener,noreferrer");
      }
    } catch {
      setUploadError("Couldn't get the download link. The server may be waking up, so try again in a moment.");
    } finally {
      setDownloading(false);
    }
  }

  if (!ready || !token || loading) {
    return <StudioBoot />;
  }

  return (
    <StudioShell>
      <StudioTopBar title="Home" />

      <div className="mx-auto max-w-3xl px-4 pb-16 pt-8 md:px-8 md:pt-12">
        {loadError && (
          <p role="alert" className="msg-in mb-8 text-body-md text-error">
            {loadError}
          </p>
        )}

        {/* ── Background photograph ─────────────────────────────────── */}
        <section aria-labelledby="hero-heading">
          <h2 id="hero-heading" className="studio-heading mb-2">Background Photograph</h2>
          <p className="lede mb-8 !text-[1.15rem]">The full-screen image behind the title on the home page.</p>

          <figure className="frame-media relative aspect-[16/9] w-full">
            {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary / placeholder host; no next/image by decision */}
            <img
              src={newPreview ?? heroUrl}
              alt={newPreview ? "Preview of the new photograph" : heroAlt}
              className="h-full w-full object-cover"
            />
            {newPreview && (
              <figcaption className="caps absolute left-3 top-3 rounded-full bg-paper/85 px-3 py-1 !text-fg">
                Preview — not saved yet
              </figcaption>
            )}
          </figure>

          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={onPick}
          />

          {newFile ? (
            <div className="mt-6 flex flex-col gap-6">
              <div>
                <label htmlFor="new-hero-alt" className="field-label">
                  Describe the new photograph
                </label>
                <input
                  id="new-hero-alt"
                  className="field"
                  value={newAlt}
                  onChange={(e) => setNewAlt(e.target.value)}
                  maxLength={ALT_MAX}
                  placeholder="e.g. Fog over a pine ridge at first light"
                  disabled={uploading}
                />
              </div>
              {uploadError && (
                <p role="alert" className="msg-in text-body-md text-error">
                  {uploadError}
                </p>
              )}
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={handleUpload} disabled={uploading} aria-busy={uploading} className="btn btn-primary">
                  {uploading ? <Spinner /> : <ImageUp size={18} aria-hidden="true" />}
                  {uploading ? "Uploading…" : "Use this photograph"}
                </button>
                <button type="button" onClick={cancelReplace} disabled={uploading} className="btn btn-quiet">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-6 flex flex-wrap gap-3">
                <button type="button" onClick={() => fileInput.current?.click()} className="btn btn-quiet">
                  <RefreshCw size={16} aria-hidden="true" />
                  Replace photograph
                </button>
                <button type="button" onClick={handleDownload} disabled={downloading} aria-busy={downloading} className="btn btn-text">
                  {downloading ? <Spinner /> : <Download size={16} aria-hidden="true" />}
                  Download current
                </button>
              </div>
              {uploadError && (
                <p role="alert" className="msg-in mt-4 text-body-md text-error">
                  {uploadError}
                </p>
              )}
              <p className="mt-3 text-label text-fg-3">
                Images up to {MAX_FILE_MB} MB. Landscape works best; the edges are cropped on phones.
              </p>

              <div className="mt-8">
                <label htmlFor="hero-alt" className="field-label">
                  Description <span>· read aloud by screen readers</span>
                </label>
                <input
                  id="hero-alt"
                  className="field"
                  value={heroAlt}
                  onChange={(e) => setHeroAlt(e.target.value)}
                  maxLength={ALT_MAX}
                  disabled={saving}
                />
              </div>
            </>
          )}
        </section>

        {/* ── The work ───────────────────────────────────────────────── */}
        <section aria-labelledby="work-heading" className="mt-16 border-t border-line pt-12">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h2 id="work-heading" className="studio-heading mb-2">The Work</h2>
              <p className="lede !text-[1.15rem]">The statement set large between the title and Curated Work.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={showStatement}
              aria-label="Show “The work” on the home page"
              onClick={() => setShowStatement((v) => !v)}
              disabled={saving}
              className="switch mt-2 shrink-0"
            >
              <span aria-hidden="true" />
            </button>
          </div>
          <p className="caps mt-4">{showStatement ? "Shown on the home page" : "Hidden from the home page"}</p>

          <div className={`mt-8 transition-opacity ${showStatement ? "" : "opacity-50"}`}>
            <label htmlFor="work-statement" className="field-label">
              Text
            </label>
            <textarea
              id="work-statement"
              className="field resize-y"
              rows={5}
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              maxLength={STATEMENT_MAX}
              aria-describedby="work-statement-count"
              disabled={saving}
            />
            <p id="work-statement-count" className="mt-2 text-label text-fg-3">
              {statement.length} / {STATEMENT_MAX}
            </p>
          </div>
        </section>

        <div className="mt-12 flex flex-wrap items-center gap-4 border-t border-line pt-8">
          <button type="button" onClick={handleSave} disabled={saving || uploading} aria-busy={saving} className="btn btn-primary">
            {saving ? (
              <>
                <Spinner />
                Saving…
              </>
            ) : (
              "Save changes"
            )}
          </button>
          {saved && (
            <p role="status" className="msg-in text-label text-fg-2">
              Saved. The home page is updated.
            </p>
          )}
          {saveError && (
            <p role="alert" className="msg-in text-body-md text-error">
              {saveError}
            </p>
          )}
        </div>
        {/* ── Selected work (managed in Photographs) ───────────────────── */}
        <section aria-labelledby="selected-heading" className="mt-16 border-t border-line pt-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="selected-heading" className="studio-heading mb-2">Curated Work</h2>
              <p className="lede !text-[1.15rem]">The starred photographs, in gallery order, below the statement.</p>
            </div>
            <Link href="/admin/dashboard/photos?filter=featured" className="text-link shrink-0 self-start sm:self-auto">
              Choose in Photographs
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          {featured === null ? (
            <p className="mt-6 text-body-md text-error">Couldn&apos;t load the photographs just now.</p>
          ) : featured.length === 0 ? (
            <p className="mt-6 text-body-md text-fg-2">
              Nothing is starred, so the section is hidden on the home page.
            </p>
          ) : (
            <ul className="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {featured.map((p) => (
                <li key={p._id}>
                  <div className="frame-media aspect-[4/3]">
                    {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary rendition */}
                    <img src={photoImage(p, 480)} alt={p.caption || `${categoryLabel(p.category)} photograph`} loading="lazy" />
                  </div>
                  <p className="frame-meta mt-2 truncate">{p.caption || categoryLabel(p.category)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </StudioShell>
  );
}
