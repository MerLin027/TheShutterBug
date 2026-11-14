"use client";

import Link from "next/link";
import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { apiUrl } from "@/lib/api";
import { useAdminToken } from "@/lib/useAdminToken";
import Spinner from "@/components/Spinner";
import { StudioBoot } from "@/components/StudioSkeletons";

/**
 * Studio sign-in (Redesign Phase C, task C5).
 *
 * A plain card on the page. The blurred background photo this used to sit
 * on loaded from a Google URL that had expired — it rendered at 0×0 — and it
 * isn't replaced: a sign-in screen is one of the places a quiet page is the
 * right answer. Also gone: the glass card, the script "Studio Access" title
 * and the hover-scale on the card.
 *
 * Security notes (OWASP A07): the error shown is the server's own generic
 * "Invalid email or password" — it never says which field was wrong — and
 * the fields carry autocomplete hints so a password manager can fill a
 * long random password, which is the practical fix for the short one the
 * account currently has (REDESIGN.md task D8). Rate limiting is Phase D.
 */
export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // This page's redirect runs the other way — away from the form when a
  // session already exists — so the hook's own guard is off. Reading the
  // token in an effect is what keeps server and client renders identical.
  const { token, ready } = useAdminToken({ redirectWhenMissing: false });

  useEffect(() => {
    if (ready && token) {
      router.replace("/admin/dashboard");
    }
  }, [ready, token, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message || "Invalid email or password");
        setLoading(false);
        return;
      }

      localStorage.setItem("admin_token", data.token);
      localStorage.setItem("admin_email", data.email ?? "");
      router.replace("/admin/dashboard");
    } catch {
      setError("Couldn't reach the server. It may be waking up, so try again in a moment.");
      setLoading(false);
    }
  }

  // Hold the boot screen until the session read has happened, and while the
  // redirect runs if there was a token — no flash of the form for someone
  // already signed in.
  if (!ready || token) {
    return <StudioBoot />;
  }

  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-paper text-fg antialiased">
      <main id="main" className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="enter w-full max-w-sm">
          <p className="mb-6 text-center">
            <span className="block text-lead font-medium text-fg">The Shutter Bug</span>
            <span className="block text-label text-fg-3">Studio</span>
          </p>

          <div className="panel p-6">
            <h1 className="mb-6 text-heading font-medium text-fg">Sign in</h1>

            <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="admin-email" className="field-label">
                  Email
                </label>
                <input
                  id="admin-email"
                  className="field"
                  type="email"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="admin-password" className="field-label">
                  Password
                </label>
                <input
                  id="admin-password"
                  className="field"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <p role="alert" className="text-body-md text-error">
                  {error}
                </p>
              )}

              <button className="btn btn-primary mt-1 w-full" type="submit" disabled={loading}>
                {loading && <Spinner />}
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>
          </div>

          <div className="mt-4 text-center">
            <Link href="/" className="btn btn-text">
              <ArrowLeft size={16} aria-hidden="true" />
              Back to site
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
