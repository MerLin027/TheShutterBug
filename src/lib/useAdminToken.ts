"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// ---------------------------------------------------------------------------
// useAdminToken — the Studio's session, read once and shared.
//
// WHY THIS EXISTS, AND WHY IT USES AN EFFECT RATHER THAN A LAZY INITIALISER
//
// All four Studio surfaces used to do this:
//
//     const [token] = useState(() =>
//       typeof window === "undefined" ? null : localStorage.getItem("admin_token")
//     );
//
// which looks like it avoids an extra render, and does — at the cost of a
// hydration mismatch on every signed-in visit. The lazy initialiser runs on
// the server too, where `window` is undefined, so the server renders
// <StudioBoot /> while the client's first pass renders the full dashboard.
// React then finds two different trees for the same markup and warns (and in
// development, throws a recoverable error and re-renders the whole subtree).
//
// localStorage simply does not exist at SSR time. There is no initialiser that
// can read it and match. The fix is to make BOTH passes render the same thing —
// the boot screen — and let an effect, which only ever runs on the client,
// supply the real answer immediately afterwards. The visible cost is one extra
// frame of "Checking your session", which is what that screen is for.
//
// `ready` is what distinguishes "we haven't looked yet" from "we looked and
// there's no token". Without it every page would redirect to /admin on its
// first render, before the check had run.
// ---------------------------------------------------------------------------

type AdminSession = {
  /** null until `ready`, then the stored JWT or null if there isn't one. */
  token: string | null;
  /** The signed-in address, "" when absent. Display only. */
  email: string;
  /** False until the localStorage read has happened on the client. */
  ready: boolean;
  /** Clear both keys and return to the login page. */
  signOut: () => void;
};

export function useAdminToken(
  { redirectWhenMissing = true }: { redirectWhenMissing?: boolean } = {}
): AdminSession {
  const router = useRouter();

  const [session, setSession] = useState<{
    token: string | null;
    email: string;
    ready: boolean;
  }>({ token: null, email: "", ready: false });

  useEffect(() => {
    // Client-only by construction — effects don't run during SSR, which is
    // the whole point. The lint rule guards against effects that set state
    // derivable during render; this one reads a browser API that cannot be.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSession({
      token: localStorage.getItem("admin_token"),
      email: localStorage.getItem("admin_email") ?? "",
      ready: true,
    });
  }, []);

  // Guard: once we've actually looked and there's no token, leave.
  // Opt-out exists for the login page, whose redirect runs the other way.
  useEffect(() => {
    if (redirectWhenMissing && session.ready && !session.token) {
      router.replace("/admin");
    }
  }, [redirectWhenMissing, session.ready, session.token, router]);

  const signOut = useCallback(() => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_email");
    setSession({ token: null, email: "", ready: true });
    router.replace("/admin");
  }, [router]);

  return { ...session, signOut };
}
