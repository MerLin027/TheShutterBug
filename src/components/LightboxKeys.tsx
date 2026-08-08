"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Keyboard control for the lightbox. Renders nothing — it exists only so the
 * lightbox page itself can stay a Server Component (it fetches the photo and
 * its neighbours) while still responding to Escape and the arrow keys.
 *
 * The page already had prev/next/close as links; a full-screen image viewer
 * that can only be driven by clicking the three small pills at the bottom is
 * the one place on the site where keyboard support isn't a nicety. Escape in
 * particular is what every viewer on the web does, so its absence reads as
 * the page being stuck.
 *
 * Modifier chords are left alone — Ctrl/Cmd+Arrow is the OS's, not ours.
 */
export default function LightboxKeys({
  prevHref,
  nextHref,
  closeHref,
}: {
  prevHref?: string;
  nextHref?: string;
  closeHref: string;
}) {
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      let target: string | undefined;
      if (e.key === "Escape") target = closeHref;
      else if (e.key === "ArrowLeft") target = prevHref;
      else if (e.key === "ArrowRight") target = nextHref;

      // No target means either an unrelated key or an edge of the set
      // (first photo, last photo) — in both cases do nothing and let the
      // event through rather than swallowing it.
      if (!target) return;

      e.preventDefault();
      router.push(target);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router, prevHref, nextHref, closeHref]);

  return null;
}
