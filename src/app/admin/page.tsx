"use client";

import Link from "next/link";
import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { StudioBoot } from "@/components/StudioSkeletons";

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

  // Already signed in — hold the boot screen while the redirect runs, so
  // there's no flash of the login form (addition #3).
  if (checking) {
    return <StudioBoot />;
  }

  /* -------------------------------------------------------------------
     Literal port of design-reference/admin-login.html
     ------------------------------------------------------------------- */
  return (
    <div className="bg-primary-container text-on-surface h-[100dvh] w-full overflow-hidden relative font-body-md antialiased">
      {/* Background Image with Heavy Blur */}
      <div className="absolute inset-0 w-full h-full z-0">
        {/* Purely decorative — a blurred wash behind the card, carrying no
            information. alt="Background" made a screen reader announce it as
            a meaningful image; empty alt + aria-hidden drops it correctly. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover blur-3xl scale-110"
          src="https://lh3.googleusercontent.com/aida/AP1WRLt_p_3taNJFKaIPQ9dLhmTlbuIjeo-4Mdjwxse2woumL9J8YXATt7K8hd6we0SjhDdAByWT6bH_c3Ksfvp5A7jRMee1bxkAfjI0uaOHxbnKXii9cEOZ_Oy354DfKYAfxNL9wGCTmdu05hFGXQntOjXgZoOoYz3dLj7t7ZlJ0y5AG0pdt9wB2Dju5ZaqpVasI-9BrLEkCzh-wXtx5RxXpcNdi6IDR3HflyyhHzAyCf6V70Ux-Y_EbuPgavk"
        />
        <div className="absolute inset-0 bg-moody-overlay mix-blend-multiply" />
      </div>

      {/* Main Content Container */}
      <main
        id="main"
        className="relative z-10 w-full h-full flex flex-col items-center justify-center p-margin-mobile md:p-margin-desktop"
      >
        {/* The site title that used to float above the card is gone by
            request. "Studio Access" is therefore the page's top-level
            heading now and carries <h1> — same classes, so it renders
            identically; this only keeps the document from having no h1. */}

        {/* Floating Login Card */}
        <div className="liquid-glass rounded-2xl w-full max-w-sm p-8 flex flex-col gap-8 transform transition-transform hover:scale-[1.01] duration-300">
          <div className="text-center">
            <h1 className="font-title text-[1.5rem] leading-tight text-on-surface">
              Studio Access
            </h1>
          </div>

          {/* Placeholders removed per the brief. With no placeholder text the
              visible <label> is the only thing naming each field, so both are
              now properly associated by htmlFor/id — previously neither label
              pointed at its input. Fields use .studio-field, the same filled
              treatment as the Contact form and the Account page, instead of
              this page's own one-off underline style. */}
          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label
                htmlFor="admin-email"
                className="block font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant px-1"
              >
                Email
              </label>
              <div className="studio-field px-4 py-3">
                <input
                  id="admin-email"
                  className="w-full bg-transparent border-0 p-0 text-on-surface font-body-md text-body-md focus:ring-0 focus:outline-none"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label
                htmlFor="admin-password"
                className="block font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant px-1"
              >
                Password
              </label>
              <div className="studio-field px-4 py-3">
                <input
                  id="admin-password"
                  className="w-full bg-transparent border-0 p-0 text-on-surface font-body-md text-body-md focus:ring-0 focus:outline-none"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Error message */}
            {error && (
              <p className="text-error text-sm text-center">{error}</p>
            )}

            <button
              className="btn-glass group mt-2 pl-8 pr-2 py-2 font-label-sm text-label-sm tracking-widest uppercase text-on-surface flex items-center justify-center gap-4"
              type="submit"
              disabled={loading}
            >
              {loading ? "Signing in…" : "Enter Archive"}
              <span className="btn-icon-nest">
                {loading ? (
                  <div className="admin-spinner !w-4 !h-4 !border-[1.5px]" />
                ) : (
                  <span
                    className="material-symbols-outlined text-[18px]"
                    style={{ fontVariationSettings: "'FILL' 0, 'wght' 250" }}
                  >
                    arrow_forward
                  </span>
                )}
              </span>
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
