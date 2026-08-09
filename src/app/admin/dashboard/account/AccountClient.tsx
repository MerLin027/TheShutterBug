"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import StudioShell from "@/components/StudioShell";
import StudioTopBar from "@/components/StudioTopBar";
import { StudioBoot } from "@/components/StudioSkeletons";
import { revalidatePublicPages } from "../../actions";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://theshutterbug.onrender.com";

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

export default function AccountClient() {
  const router = useRouter();

  const [token] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("admin_token");
  });
  // Lazy initializer reads localStorage synchronously on first render.
  const [email] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("admin_email") || "";
  });

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

  // Auth redirect — pure side-effect, no setState.
  useEffect(() => {
    if (!token) {
      router.replace("/admin");
    }
  }, [token, router]);

  // Load the current About copy. GET is public, but there's no point firing it
  // before we know the admin is staying on the page.
  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/site-content`, {
          cache: "no-store",
        });
        if (cancelled) return;

        if (!res.ok) {
          setError("Couldn't load the current About copy — showing defaults.");
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
          setError("Network error loading About copy — showing defaults.");
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
      const res = await fetch(`${API_URL}/api/site-content`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quote, bio, aboutImageUrl: imageUrl }),
      });

      if (res.status === 401) {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_email");
        router.replace("/admin");
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
      // immediately rather than after the 60 s ISR window.
      await revalidatePublicPages();

      setSaving(false);
      setSaved(true);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Network error — is the backend running?");
      setSaving(false);
    }
  }

  if (!token || loading) {
    return <StudioBoot />;
  }

  return (
    <StudioShell>
      <StudioTopBar title="Account" />

      {/* Content Area */}
      <div className="px-margin-mobile md:px-margin-desktop py-10 min-h-full max-w-2xl">
        <p className="font-body-md text-body-md text-on-surface-variant mb-10">
          Signed in as <span className="text-on-surface font-medium">{email}</span>
        </p>

        <h2 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-4">
          About page
        </h2>

        <div className="flex flex-col gap-4">
          <div className="studio-field px-4 py-3">
            <label className="sr-only" htmlFor="account-quote">
              Quote
            </label>
            <input
              id="account-quote"
              type="text"
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              disabled={saving}
              className="w-full bg-transparent border-0 text-on-surface font-body-md focus:ring-0 focus:outline-none p-0 disabled:opacity-60"
            />
          </div>

          <div className="studio-field px-4 py-3">
            <label className="sr-only" htmlFor="account-bio">
              Bio
            </label>
            <textarea
              id="account-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              disabled={saving}
              rows={6}
              className="w-full bg-transparent border-0 text-on-surface font-body-md focus:ring-0 focus:outline-none p-0 resize-none disabled:opacity-60"
            />
          </div>
          <p className="font-label-sm text-label-sm text-on-surface-variant/60 -mt-2">
            Separate paragraphs with a blank line.
          </p>

          <div className="studio-field px-4 py-3">
            <label className="sr-only" htmlFor="account-image">
              About page image URL
            </label>
            <input
              id="account-image"
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              disabled={saving}
              placeholder="https://…"
              className="w-full bg-transparent border-0 text-on-surface font-body-md focus:ring-0 focus:outline-none p-0 disabled:opacity-60"
            />
          </div>

          {error && <p className="text-error text-sm">{error}</p>}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-glass mt-2 w-fit px-8 py-3.5 font-label-sm text-label-sm uppercase tracking-widest text-on-surface flex items-center gap-3"
          >
            {saving ? (
              <>
                <div className="admin-spinner !w-4 !h-4 !border-[1.5px]" />
                <span>Saving…</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>

          {saved && (
            <p
              role="status"
              className="font-label-sm text-label-sm text-on-surface-variant -mt-2"
            >
              Saved — the About page is updated.
            </p>
          )}
        </div>
      </div>
    </StudioShell>
  );
}
