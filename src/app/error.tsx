"use client"; // Error boundaries must be Client Components.

import { useEffect, useTransition, type CSSProperties } from "react";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

/**
 * Route-level error page, the counterpart to not-found.tsx. The error's
 * message is never rendered (Server Component errors are redacted in
 * production anyway, and nothing in it helps a visitor); the digest is
 * logged so a report can be matched to the server log.
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
      <main id="main" className="flex flex-1 items-center px-margin-mobile pb-28 pt-36 md:px-margin-desktop">
        <div role="alert" className="site-container">
          <p className="caps enter">Couldn&apos;t load</p>
          <h1 className="display-title enter mt-5 max-w-[14ch]" style={{ "--i": 1 } as CSSProperties}>
            The darkroom door is stuck
          </h1>
          <p className="lede enter mt-6 max-w-[32rem]" style={{ "--i": 2 } as CSSProperties}>
            The server didn&apos;t answer in time. It may be waking up, so try
            again in a moment.
          </p>
          <div className="enter mt-8 flex flex-wrap items-center gap-8" style={{ "--i": 3 } as CSSProperties}>
            <button
              type="button"
              onClick={() => startTransition(() => unstable_retry())}
              disabled={pending}
              className="text-link"
            >
              {pending ? "Trying…" : "Try again"}
            </button>
            <Link href="/" className="text-link !text-fg-2">
              Back home
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
