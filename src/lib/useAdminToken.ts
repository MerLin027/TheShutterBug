"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// ---------------------------------------------------------------------------
// useAdminToken — the Studio's session, asked once and shared.
//
// THE SESSION IS AN httpOnly COOKIE (audit F2, 2026-11-22)
//
// It used to be a JWT in localStorage, which any script on the page could
// read and send elsewhere. Now the API sets it as an httpOnly, Secure,
// SameSite=Strict cookie on this site's own domain (/api/* is proxied to the
// API, next.config.ts), and the browser attaches it to every /api request by
// itself. No script, ours included, can read it. So "am I signed in?" is a
// question for the server: GET /api/auth/me answers 200 with the email, or
// 401. That answer is fetched once per page load and shared by every hook
// instance on the page (the shell and the page both use this hook).
//
// WHY AN EFFECT, NOT A LAZY INITIALISER: the server can't know the answer
// either, so BOTH render passes produce the boot screen (<StudioBoot />) and
// the client's effect supplies the answer. `ready` distinguishes "not asked
// yet" from "asked, and signed out"; without it every page would redirect to
// /admin on its first render.
// ---------------------------------------------------------------------------

type Session = { signedIn: boolean; email: string };

type AdminSession = Session & {
  /** False until the server has answered. */
  ready: boolean;
  /**
   * Local only: forget the session and go to the sign-in page. For when the
   * server has already refused it (a 401), so there is nothing to end.
   */
  signOut: () => void;
  /**
   * The Sign out button: end the session ON THE SERVER (which also clears the
   * cookie), then go to the sign-in page.
   */
  endSession: () => Promise<void>;
  /** After signing in or changing the email: record the new state. */
  updateSession: (email: string) => void;
};

/** One answer per page load, shared by every hook instance. */
let sessionPromise: Promise<Session> | null = null;

const SIGNED_OUT: Session = { signedIn: false, email: "" };

async function askServer(): Promise<Session> {
  // The API may be waking from sleep (~30 s on Render's free tier); the
  // proxy allows 120 s. A 5xx (database blip) is retried a few times rather
  // than treated as "signed out", which would bounce the owner to sign-in.
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store", credentials: "same-origin" });
      if (res.ok) {
        const data: { email?: string } = await res.json().catch(() => ({}));
        return { signedIn: true, email: data.email ?? "" };
      }
      if (res.status === 401) return SIGNED_OUT;
    } catch {
      /* network: retry */
    }
    await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
  }
  return SIGNED_OUT;
}

function loadSession(): Promise<Session> {
  sessionPromise ??= askServer();
  return sessionPromise;
}

export function useAdminToken(
  { redirectWhenMissing = true }: { redirectWhenMissing?: boolean } = {}
): AdminSession {
  const router = useRouter();
  const [session, setSession] = useState<Session & { ready: boolean }>({ ...SIGNED_OUT, ready: false });

  useEffect(() => {
    let cancelled = false;
    loadSession().then((s) => {
      if (!cancelled) setSession({ ...s, ready: true });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Guard: once the server has answered "signed out", leave.
  // Opt-out exists for the sign-in page, whose redirect runs the other way.
  useEffect(() => {
    if (redirectWhenMissing && session.ready && !session.signedIn) {
      router.replace("/admin");
    }
  }, [redirectWhenMissing, session.ready, session.signedIn, router]);

  const signOut = useCallback(() => {
    sessionPromise = Promise.resolve(SIGNED_OUT);
    setSession({ ...SIGNED_OUT, ready: true });
    router.replace("/admin");
  }, [router]);

  const endSession = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        signal: AbortSignal.timeout(15000),
      });
    } catch {
      /* unreachable: the session still ends by itself after a day unused */
    }
    signOut();
  }, [signOut]);

  const updateSession = useCallback((email: string) => {
    const next = { signedIn: true, email };
    sessionPromise = Promise.resolve(next);
    setSession({ ...next, ready: true });
  }, []);

  return { ...session, signOut, endSession, updateSession };
}
