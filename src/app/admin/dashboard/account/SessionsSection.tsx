"use client";

import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";
import Spinner from "@/components/Spinner";

/**
 * Studio → Account → Signed-in browsers (2026-11-22, audit F1 + F3).
 * How many browsers hold a live session, and a button that ends all of them
 * on the server, this one included (backend/config/sessions.js).
 */
export default function SessionsSection({ token, signOut }: { token: string; signOut: () => void }) {
  const [count, setCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(apiUrl("/api/auth/sessions"), { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" })
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 401) return signOut();
        if (res.ok) setCount((await res.json()).count ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [token, signOut]);

  async function signOutEverywhere() {
    setError("");
    setBusy(true);
    try {
      const res = await fetch(apiUrl("/api/auth/logout-all"), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok || res.status === 401) {
        signOut();
        return;
      }
      setError("Couldn't sign out everywhere. Please try again.");
    } catch {
      setError("Couldn't reach the server. It may be waking up, so try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-16 border-t border-line pt-12" aria-labelledby="sessions-heading">
      <h2 id="sessions-heading" className="studio-heading mb-2">
        Signed-In Browsers
      </h2>
      <p className="lede mb-8 !text-[1.15rem]">
        A browser stays signed in while you use it, and is signed out after a day without use (a week at most).
      </p>
      <p className="mb-6 text-body-md text-fg">
        {count === null
          ? "Checking…"
          : count === 1
            ? "Only this browser is signed in."
            : `${count} browsers are signed in, this one included.`}
      </p>
      {error && (
        <p role="alert" className="msg-in mb-6 text-body-md text-error">
          {error}
        </p>
      )}
      <button type="button" className="btn btn-quiet" onClick={signOutEverywhere} disabled={busy} aria-busy={busy}>
        {busy && <Spinner />}
        Sign out everywhere
      </button>
      <p className="mt-3 text-label text-fg-3">Ends every session, this one too. Use it if a device is lost or you signed in somewhere public.</p>
    </section>
  );
}
