"use client"; // Error boundaries must be Client Components.

import { useEffect, useTransition } from "react";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

/**
 * Route-level error page, the counterpart to not-found.tsx. Next's default
 * here is an unstyled page that reads as the site having broken outright.
 *
 * Reached when a page throws — most often /lightbox/[id] when the API cannot
 * be reached (it throws rather than claiming the photo was deleted).
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
    <div className="bg-primary-container text-on-surface font-body-md antialiased min-h-[100dvh] flex flex-col">
      <SiteNav />

      <main
        id="main"
        className="site-container flex-grow flex flex-col items-center justify-center text-center px-margin-mobile md:px-margin-desktop pt-32 md:pt-40 pb-section-gap"
      >
        <div role="alert" className="space-y-6 max-w-md">
          <span className="block font-label-sm text-label-sm uppercase tracking-widest text-accent">
            Couldn&apos;t load
          </span>
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">
            The darkroom door is stuck
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            The server didn&apos;t answer in time. It may be waking up — try
            again in a moment.
          </p>
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => startTransition(() => unstable_retry())}
              disabled={pending}
              className="btn-glass pl-8 pr-8 py-3.5 font-label-sm text-label-sm tracking-widest uppercase text-on-surface disabled:opacity-60"
            >
              {pending ? "Trying…" : "Try again"}
            </button>
            <Link
              href="/"
              className="px-5 py-3.5 font-label-sm text-label-sm tracking-widest uppercase text-on-surface-variant hover:text-accent transition-colors"
            >
              Back home
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
