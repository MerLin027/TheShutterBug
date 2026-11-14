"use client"; // Error boundaries must be Client Components.

import { useEffect, useTransition } from "react";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

/**
 * Route-level error page, the counterpart to not-found.tsx. Reached when a
 * page throws — most often /lightbox/[id] when the API cannot be reached (it
 * throws rather than claiming the photograph was deleted).
 *
 * The error's message is never rendered: errors forwarded from Server
 * Components are already redacted in production, and nothing about the
 * failure is useful to a visitor. `digest` is logged so a report can be
 * matched to the server log.
 */
export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    console.error("[route error]", error.digest ?? "(no digest)");
  }, [error]);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper text-fg antialiased">
      <SiteNav />

      <main
        id="main"
        className="flex flex-1 items-center px-margin-mobile pb-24 pt-28 md:px-margin-desktop md:pt-36"
      >
        <div role="alert" className="site-container">
          <p className="frame-meta">Couldn&apos;t load</p>
          <h1 className="mt-3 text-title-sm font-medium text-fg md:text-title">
            The darkroom door is stuck
          </h1>
          <p className="mt-4 max-w-[34rem] text-lead text-fg-2">
            The server didn&apos;t answer in time. It may be waking up, so try
            again in a moment.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => startTransition(() => unstable_retry())}
              disabled={pending}
              className="btn btn-primary"
            >
              {pending ? "Trying…" : "Try again"}
            </button>
            <Link href="/" className="btn btn-text">
              Back home
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
