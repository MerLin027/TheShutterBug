import type { CSSProperties } from "react";

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
 * The pre-auth screen, between mount and the localStorage token check
 * resolving. Both the server and the client's first pass render this — see
 * useAdminToken for why that matters (hydration).
 */
export function StudioBoot() {
  return (
    <div
      role="status"
      className="flex h-[100dvh] w-full flex-col items-center justify-center gap-4 bg-paper"
    >
      <p className="wordmark">The Shutter Bug</p>
      <div className="admin-spinner mt-2 !size-6" aria-hidden="true" />
      <p className="caps">Checking your session</p>
    </div>
  );
}
