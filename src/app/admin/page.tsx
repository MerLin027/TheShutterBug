"use client";

import Link from "next/link";
import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://theshutterbug.onrender.com";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Lazy initialiser — reads localStorage synchronously on first render only.
  // Returns true if a token exists (meaning we should show the spinner + redirect).
  const [checking] = useState(() => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("admin_token");
  });

  // Redirect if already authenticated — pure side-effect, no setState
  useEffect(() => {
    if (checking) {
      router.replace("/admin/dashboard");
    }
  }, [checking, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Invalid email or password");
        setLoading(false);
        return;
      }

      localStorage.setItem("admin_token", data.token);
      localStorage.setItem("admin_email", data.email ?? "");
      router.replace("/admin/dashboard");
    } catch {
      setError("Network error — is the backend running?");
      setLoading(false);
    }
  }

  // Show spinner while redirecting (addition #3 — no flash)
  if (checking) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="admin-spinner" />
      </div>
    );
  }

  /* -------------------------------------------------------------------
     Literal port of design-reference/admin-login.html
     ------------------------------------------------------------------- */
  return (
    <div className="bg-background text-on-surface h-screen w-screen overflow-hidden relative font-body-md antialiased">
      {/* Background Image with Heavy Blur */}
      <div className="absolute inset-0 w-full h-full z-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt="Background"
          className="w-full h-full object-cover blur-3xl scale-110"
          src="https://lh3.googleusercontent.com/aida/AP1WRLt_p_3taNJFKaIPQ9dLhmTlbuIjeo-4Mdjwxse2woumL9J8YXATt7K8hd6we0SjhDdAByWT6bH_c3Ksfvp5A7jRMee1bxkAfjI0uaOHxbnKXii9cEOZ_Oy354DfKYAfxNL9wGCTmdu05hFGXQntOjXgZoOoYz3dLj7t7ZlJ0y5AG0pdt9wB2Dju5ZaqpVasI-9BrLEkCzh-wXtx5RxXpcNdi6IDR3HflyyhHzAyCf6V70Ux-Y_EbuPgavk"
        />
        <div className="absolute inset-0 bg-moody-overlay mix-blend-multiply" />
      </div>

      {/* Main Content Container */}
      <main className="relative z-10 w-full h-full flex flex-col items-center justify-center p-margin-mobile md:p-margin-desktop">
        {/* Brand Header (Subtle) */}
        <div className="absolute top-8 left-0 w-full flex justify-center opacity-70">
          <h1 className="font-display-lg text-headline-md tracking-tighter text-on-surface">
            THE SHUTTER BUG
          </h1>
        </div>

        {/* Floating Login Card */}
        <div className="liquid-glass rounded-xl w-full max-w-sm p-8 flex flex-col gap-8 transform transition-transform hover:scale-[1.01] duration-500">
          <div className="text-center space-y-2">
            <h2 className="font-headline-md text-headline-md text-on-surface">
              Studio Access
            </h2>
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              SECURE PORTAL
            </p>
          </div>

          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            <div className="space-y-1 group">
              <label className="font-label-sm text-label-sm text-outline-variant px-1 group-focus-within:text-tertiary transition-colors">
                Email
              </label>
              <input
                className="w-full bg-transparent border-0 border-b border-white/10 focus:border-tertiary focus:ring-0 text-on-surface font-body-md px-1 py-2 transition-colors placeholder:text-white/10"
                placeholder="admin@obsidian.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1 group">
              <label className="font-label-sm text-label-sm text-outline-variant px-1 group-focus-within:text-tertiary transition-colors">
                Password
              </label>
              <input
                className="w-full bg-transparent border-0 border-b border-white/10 focus:border-tertiary focus:ring-0 text-on-surface font-body-md px-1 py-2 transition-colors placeholder:text-white/10"
                placeholder="••••••••"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Error message */}
            {error && (
              <p className="text-error text-sm text-center">{error}</p>
            )}

            <button
              className="mt-4 liquid-glass rounded-full py-4 px-6 font-label-sm text-label-sm text-on-surface hover:bg-white/10 transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-50"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <div className="admin-spinner !w-4 !h-4 !border-[1.5px]" />
              ) : (
                <>
                  Enter Archive
                  <span
                    className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform"
                    style={{ fontVariationSettings: "'FILL' 0" }}
                  >
                    arrow_forward
                  </span>
                </>
              )}
            </button>
          </form>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 font-label-sm text-label-sm text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">
              arrow_back
            </span>
            Back to Site
          </Link>
        </div>
      </main>
    </div>
  );
}
