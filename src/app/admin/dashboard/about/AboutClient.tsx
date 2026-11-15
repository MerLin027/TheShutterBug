"use client";

import { useState, useEffect, useRef } from "react";
import { apiUrl } from "@/lib/api";
import { useAdminToken } from "@/lib/useAdminToken";
import StudioShell from "@/components/StudioShell";
import StudioTopBar from "@/components/StudioTopBar";
import Spinner from "@/components/Spinner";
import { StudioBoot } from "@/components/StudioSkeletons";
import { revalidatePublicPages } from "../../actions";

// Pre-load placeholders only — the real values arrive from GET /api/site-content
// on mount. These mirror DEFAULTS in backend/models/SiteContent.js so the
// fields never flash copy that differs from what About is rendering.
const SEED_QUOTE = "Chasing light, quietly.";
const SEED_BIO = `I am a photographer working mostly at the edges of the day — the hour before the sun clears the horizon, and the long blue minutes after it drops behind it.

My work is about absence as much as presence: an empty platform, a road with nobody on it, one boat holding the centre of an enormous stretch of water. When people appear in a frame, they are weather, not subject.

I shoot on a mix of digital and film, print small, and travel light. The Shutter Bug is where the work collects.`;
// Full URL, not a path into public/ — that directory is empty.
const SEED_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCFd3kHx3f7TeKHtxF_JbbMOx1gcgGN2yJwun0sRZTvkpH0C5Os9LO4SOCnp3UlHBkmbBdbD9r7C6ScpOSyILvBtEOoSi0flavIB50fRf7kmqOL86vKVCMADob9KFsiurnit21aw1Oq79dX5bfimo8ulSvwskvjA7fhD8eVHmylQFGnnJfLDtoxMj4pehyK71qvCKTeclW6BetKTFL02lrphZAeuRvfWazNDSz6sSrgd0PZuCEQBN_D";

/**
 * Studio → About: the copy and portrait on the public /about page.
 * (Was "Account" until the Studio reorganisation, 2026-11-15; the old
 * /admin/dashboard/account address redirects here.)
 */
export default function AboutClient() {
  // Effect-based session read, not a lazy initialiser — see useAdminToken.
  const { token, ready, signOut } = useAdminToken();

  const [quote, setQuote] = useState(SEED_QUOTE);
  const [bio, setBio] = useState(SEED_BIO);
  const [imageUrl, setImageUrl] = useState(SEED_IMAGE);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Clear the "Saved" confirmation after a beat. Held in a ref so a rapid
  // second save cancels the first timer instead of stacking them.
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    };
  }, []);

  // Load the current About copy. GET is public, but there's no point firing it
  // before we know the admin is staying on the page.
  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(apiUrl("/api/site-content"), {
          cache: "no-store",
        });
        if (cancelled) return;

        if (!res.ok) {
          setError("Couldn't load the current About copy, so the defaults are shown.");
          return;
        }

        const data = await res.json();
        if (cancelled) return;

        // Fall back per-field: a document written before a field existed
        // would otherwise blank the input.
        if (data.quote) setQuote(data.quote);
        if (data.bio) setBio(data.bio);
        if (data.aboutImageUrl) setImageUrl(data.aboutImageUrl);
      } catch {
        if (!cancelled) {
          setError("Couldn't reach the server, so the defaults are shown.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleSave() {
    setError("");
    setSaved(false);
    setSaving(true);

    try {
      const res = await fetch(apiUrl("/api/site-content"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quote, bio, aboutImageUrl: imageUrl }),
      });

      if (res.status === 401) {
        signOut();
        return;
      }

      if (!res.ok) {
        const data = await res
          .json()
          .catch(() => ({ message: "Save failed" }));
        setError(data.message || "Save failed");
        setSaving(false);
        return;
      }

      // Purge the cached /about (and / and /work) so the change is visible
      // immediately rather than after the 60 s ISR window. Caught separately:
      // the save already succeeded, so a failure here must not be reported as
      // "save failed" — worst case the page updates 60 s later on its own.
      try {
        await revalidatePublicPages(token);
      } catch {
        console.error("[about] revalidate failed after a successful save");
      }

      setSaving(false);
      setSaved(true);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Couldn't reach the server. Please try again.");
      setSaving(false);
    }
  }

  if (!ready || !token || loading) {
    return <StudioBoot />;
  }

  return (
    <StudioShell>
      <StudioTopBar title="About" />

      <div className="mx-auto max-w-2xl px-4 pb-16 pt-8 md:px-8 md:pt-12">
        <h2 className="studio-heading mb-2">The About Page</h2>
        <p className="lede mb-10 !text-[1.15rem]">
          What visitors read on /about. Saving updates the page immediately.
        </p>

        {/* Labels above every field (task C4). They were sr-only, so the
            page showed three unlabelled boxes. */}
        <div className="flex flex-col gap-8">
          <div>
            <label htmlFor="account-quote" className="field-label">
              Heading
            </label>
            <input
              id="account-quote"
              type="text"
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              disabled={saving}
              maxLength={200}
              className="field"
            />
          </div>

          <div>
            <label htmlFor="account-bio" className="field-label">
              Bio
            </label>
            <textarea
              id="account-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              disabled={saving}
              rows={8}
              maxLength={5000}
              aria-describedby="account-bio-hint"
              className="field resize-y"
            />
            <p id="account-bio-hint" className="mt-2 text-label text-fg-3">
              Separate paragraphs with a blank line.
            </p>
          </div>

          <div>
            <label htmlFor="account-image" className="field-label">
              Portrait image URL
            </label>
            {/* type=url is a browser-side hint only; the server is what has
                to refuse a non-https value (REDESIGN.md task D4). */}
            <input
              id="account-image"
              type="url"
              inputMode="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              disabled={saving}
              placeholder="https://"
              className="field"
            />
          </div>

          {error && (
            <p role="alert" className="text-body-md text-error">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <button type="button" onClick={handleSave} disabled={saving} aria-busy={saving} className="btn btn-primary">
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
              <p role="status" className="text-label text-fg-2">
                Saved. The About page is updated.
              </p>
            )}
          </div>
        </div>
      </div>
    </StudioShell>
  );
}
