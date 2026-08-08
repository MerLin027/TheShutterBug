"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import StudioShell from "@/components/StudioShell";
import StudioTopBar from "@/components/StudioTopBar";
import { StudioBoot } from "@/components/StudioSkeletons";

const SEED_QUOTE = "Chasing light, quietly.";
const SEED_BIO = `I am a photographer working mostly at the edges of the day — the hour before the sun clears the horizon, and the long blue minutes after it drops behind it.

My work is about absence as much as presence: an empty platform, a road with nobody on it, one boat holding the centre of an enormous stretch of water. When people appear in a frame, they are weather, not subject.

I shoot on a mix of digital and film, print small, and travel light. The Shutter Bug is where the work collects.`;
const SEED_IMAGE = "/photos/portrait.jpg";

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
  const [imagePath, setImagePath] = useState(SEED_IMAGE);

  // Auth redirect — pure side-effect, no setState.
  useEffect(() => {
    if (!token) {
      router.replace("/admin");
    }
  }, [token, router]);

  if (!token) {
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
              className="w-full bg-transparent border-0 text-on-surface font-body-md focus:ring-0 focus:outline-none p-0"
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
              rows={6}
              className="w-full bg-transparent border-0 text-on-surface font-body-md focus:ring-0 focus:outline-none p-0 resize-none"
            />
          </div>

          <div className="studio-field px-4 py-3">
            <label className="sr-only" htmlFor="account-image">
              About page image path
            </label>
            <input
              id="account-image"
              type="text"
              value={imagePath}
              onChange={(e) => setImagePath(e.target.value)}
              className="w-full bg-transparent border-0 text-on-surface font-body-md focus:ring-0 focus:outline-none p-0"
            />
          </div>

          <button
            type="button"
            disabled
            title="Not yet connected — lands in Stage 2 once a site-content endpoint exists on the backend"
            className="btn-glass mt-2 w-fit px-8 py-3.5 font-label-sm text-label-sm uppercase tracking-widest text-on-surface flex items-center gap-3"
          >
            Save Changes
          </button>
          <p className="font-label-sm text-label-sm text-on-surface-variant/60 -mt-2">
            Not yet connected — there&apos;s no backend endpoint to save this
            to yet. This lands in Stage 2.
          </p>
        </div>
      </div>
    </StudioShell>
  );
}
