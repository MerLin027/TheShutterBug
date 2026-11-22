"use client";

import { useEffect, useState, type CSSProperties } from "react";

/**
 * Loading and boot placeholders for the Studio, shaped like what's coming:
 * a spinner says "something is happening", a skeleton says "a grid of
 * photographs is arriving here".
 */

/** Fixed ratios (not random) so the skeleton doesn't reshuffle per render. */
const RATIOS = [1.5, 0.75, 1.5, 1.33, 1, 1.5, 0.67, 1.5];

/** Photo grid placeholder in the same justified rows as the real grid. */
export function PhotoGridSkeleton() {
  return (
    <ul className="justified" aria-hidden="true">
      {RATIOS.map((r, i) => (
        <li key={i} className="frame" style={{ "--r": r } as CSSProperties}>
          <div className="skeleton rounded-photo" style={{ aspectRatio: r }} />
          <div className="skeleton mt-3 h-3 w-24 rounded-full" />
        </li>
      ))}
    </ul>
  );
}

/** Message list placeholder — matches the row rhythm of MessagesClient. */
export function MessageListSkeleton() {
  return (
    <div className="flex flex-col border-t border-line" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-4 border-b border-line py-5">
          <div className="flex flex-1 flex-col gap-2">
            <div className="skeleton h-3 w-1/3 rounded-full" />
            <div className="skeleton h-3 w-2/3 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * The Studio's full-screen wait: before the localStorage token check resolves
 * (both the server and the client's first pass render this — see
 * useAdminToken for why that matters for hydration), and while a page's first
 * data loads.
 *
 * Render's free instance sleeps when idle and takes ~30 s to wake (measured
 * 2026-11-21). This screen used to say "Checking your session" for all of
 * that, which read as broken (owner, 2026-11-22: "switching to /admin takes
 * a lot of time"). After a few seconds it now says what is happening.
 * The timer starts in an effect, so the first render matches the server.
 */
const WAKING_AFTER_MS = 3000;

export function StudioBoot({ label = "Checking your session" }: { label?: string }) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setSlow(true), WAKING_AFTER_MS);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div
      role="status"
      className="flex h-[100dvh] w-full flex-col items-center justify-center gap-4 bg-paper px-6 text-center"
    >
      <p className="wordmark">The Shutter Bug</p>
      <div className="admin-spinner mt-2 !size-6" aria-hidden="true" />
      <p className="caps">{label}</p>
      {slow && (
        <p className="msg-in max-w-xs text-label text-fg-3">
          The server is waking up after a quiet spell. This can take up to half a minute.
        </p>
      )}
    </div>
  );
}
