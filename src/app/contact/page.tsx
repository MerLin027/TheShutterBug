"use client";

import { useState, useRef, FormEvent } from "react";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import Reveal from "@/components/Reveal";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://theshutterbug.onrender.com";

export default function Contact() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const data = new FormData(e.currentTarget);
    const payload = {
      name: data.get("name") as string,
      email: data.get("email") as string,
      message: data.get("message") as string,
    };

    try {
      const res = await fetch(`${API_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setStatus("success");
        formRef.current?.reset();
      } else {
        const body = await res.json().catch(() => ({}));
        setErrorMsg(body.message ?? "Something went wrong. Please try again.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Network error. Please check your connection and try again.");
      setStatus("error");
    }
  }

  const isLoading = status === "loading";

  return (
    <div className="bg-primary-container text-on-surface min-h-[100dvh] flex flex-col relative overflow-x-hidden selection:bg-tertiary selection:text-on-tertiary">
      <SiteNav />

      {/* Main Content */}
      <main id="main" className="flex-grow flex flex-col items-center justify-center px-margin-mobile md:px-margin-desktop pt-32 md:pt-40 pb-section-gap relative z-10 w-full max-w-2xl mx-auto">
        <Reveal className="text-center mb-14 space-y-4">
          <span className="font-label-sm text-label-sm uppercase tracking-widest text-accent">
            Contact
          </span>
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">
            Say hello
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl mx-auto">
            Inquiries regarding commissions, licensing, or gallery exhibitions.
            We review all submissions within two business days.
          </p>
        </Reveal>

        {/* Success Banner */}
        {status === "success" && (
          <div className="w-full mb-8 flex items-center gap-3 px-5 py-4 rounded-2xl bg-white/5 border border-white/15 text-on-surface animate-[fadeInUp_0.4s_ease-out]">
            <span
              className="material-symbols-outlined text-[20px] text-accent shrink-0"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
            <p className="font-body-md text-body-md">
              Your message has been sent. We&apos;ll be in touch within two
              business days.
            </p>
          </div>
        )}

        <Reveal className="w-full" delay={0.1}>
          <form ref={formRef} onSubmit={handleSubmit} className="w-full space-y-5" noValidate>
            <div className="studio-field px-5 py-4">
              <label className="sr-only" htmlFor="name">
                Name
              </label>
              <input
                className="w-full bg-transparent border-0 font-body-md text-body-md text-on-surface focus:ring-0 focus:outline-none p-0 placeholder:text-on-surface-variant/50"
                id="name"
                name="name"
                placeholder="Your name"
                type="text"
                required
                disabled={isLoading}
              />
            </div>
            <div className="studio-field px-5 py-4">
              <label className="sr-only" htmlFor="email">
                Email
              </label>
              <input
                className="w-full bg-transparent border-0 font-body-md text-body-md text-on-surface focus:ring-0 focus:outline-none p-0 placeholder:text-on-surface-variant/50"
                id="email"
                name="email"
                placeholder="Your email"
                type="email"
                required
                disabled={isLoading}
              />
            </div>
            <div className="studio-field px-5 py-4">
              <label className="sr-only" htmlFor="message">
                Message
              </label>
              <textarea
                className="w-full bg-transparent border-0 font-body-md text-body-md text-on-surface focus:ring-0 focus:outline-none p-0 resize-none placeholder:text-on-surface-variant/50"
                id="message"
                name="message"
                placeholder="Tell us about your project…"
                rows={5}
                required
                disabled={isLoading}
              ></textarea>
            </div>

            {/* Inline Error */}
            {status === "error" && (
              <div className="flex items-center gap-2 text-error animate-[fadeInUp_0.3s_ease-out]">
                <span
                  className="material-symbols-outlined text-[18px] shrink-0"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  error
                </span>
                <p className="font-body-md text-body-md">{errorMsg}</p>
              </div>
            )}

            <div className="pt-6 flex justify-center">
              <button
                className="btn-glass px-8 py-3.5 font-label-sm text-label-sm tracking-widest uppercase text-on-surface group flex items-center gap-3"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="admin-spinner !w-4 !h-4 !border-[1.5px]" />
                    Sending…
                  </>
                ) : (
                  <>
                    Send Message
                    <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform duration-300">
                      arrow_forward
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Reveal>
      </main>

      <SiteFooter />
    </div>
  );
}
