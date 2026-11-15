"use client";

import Link from "next/link";
import { useState, useEffect, type CSSProperties, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { apiUrl } from "@/lib/api";
import { useAdminToken } from "@/lib/useAdminToken";
import Spinner from "@/components/Spinner";
import { StudioBoot } from "@/components/StudioSkeletons";

/** The one photograph beside the form — only what the page needs. */
export type SignInPhoto = { src: string; srcSet: string; alt: string; title: string };

/**
 * Studio sign-in (Redesign Phase C, task C5; editorial since the Studio
 * refinement, 2026-11-15).
 *
 * Desktop: one of the owner's featured photographs fills the left half —
 * nothing laid over it but its own caption on a scrim at the foot — and the
 * form sits on the paper to the right in the public site's voice: serif
 * title, small-caps labels, underline fields, a pill button. Phones get
 * the form alone. With no featured photo (or the API asleep) the page is
 * just the form, centred.
 *
 * Security notes (OWASP A07): the error shown is the server's own generic
 * "Invalid email or password" — it never says which field was wrong — and
 * the fields carry autocomplete hints so a password manager can fill a
 * long random password, which is the practical fix for the short one the
 * account currently has (REDESIGN.md task D8). Rate limiting is Phase D.
 */
export default function SignInClient({ photo }: { photo: SignInPhoto | null }) {
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
    <div
      className={`grid min-h-[100dvh] w-full bg-paper text-fg antialiased ${
        photo ? "lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]" : ""
      }`}
    >
      {photo && (
        <figure className="relative hidden overflow-hidden lg:block">
          {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary rendition; no next/image by decision */}
          <img
            src={photo.src}
            srcSet={photo.srcSet}
            sizes="55vw"
            alt={photo.alt}
            className="hero-img absolute inset-0"
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-paper/85 to-transparent"
          />
          <figcaption className="caps absolute bottom-8 left-10 !text-fg-2">{photo.title}</figcaption>
        </figure>
      )}

      <main id="main" className="flex items-center justify-center px-margin-mobile py-16 md:px-12">
        <div className="w-full max-w-sm">
          <Link href="/" className="enter block w-fit">
            <span className="wordmark block">The Shutter Bug</span>
          </Link>

          <p className="caps enter mt-16" style={{ "--i": 1 } as CSSProperties}>Studio</p>
          <h1 className="section-title enter mt-3" style={{ "--i": 2 } as CSSProperties}>
            Sign in
          </h1>
          <p className="lede enter mt-3 !text-[1.15rem]" style={{ "--i": 3 } as CSSProperties}>
            The gallery, the About page and your messages.
          </p>

          <form
            className="enter mt-12 flex flex-col gap-8"
            style={{ "--i": 4 } as CSSProperties}
            onSubmit={handleSubmit}
          >
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

            <button className="btn btn-primary mt-2 w-full" type="submit" disabled={loading}>
              {loading && <Spinner />}
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <Link href="/" className="text-link enter mt-10" style={{ "--i": 5 } as CSSProperties}>
            <ArrowLeft size={16} aria-hidden="true" />
            Back to the site
          </Link>
        </div>
      </main>
    </div>
  );
}
