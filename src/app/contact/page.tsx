"use client";

import { useState, useRef, FormEvent } from "react";
import { apiUrl } from "@/lib/api";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import Reveal from "@/components/Reveal";
import Spinner from "@/components/Spinner";

type FieldErrors = {
  name?: string;
  email?: string;
  message?: string;
};

/**
 * Client-side validation. The form carries `noValidate`, which switches the
 * browser's own checking off — until now nothing replaced it, so the
 * `required` attributes on the three inputs were decorative and an empty or
 * malformed submission went straight to the API. `noValidate` stays (native
 * validation bubbles are unstyleable and look nothing like this site); this
 * is what earns it.
 */
function validate(payload: {
  name: string;
  email: string;
  message: string;
}): FieldErrors {
  const errors: FieldErrors = {};

  if (!payload.name.trim()) {
    errors.name = "Please enter your name.";
  }

  if (!payload.email.trim()) {
    errors.email = "Please enter your email address.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(payload.email.trim())) {
    // Deliberately loose. Anything stricter rejects valid addresses; the
    // real check is whether the reply lands, which only the server can know.
    errors.email = "That doesn't look like an email address.";
  }

  if (!payload.message.trim()) {
    errors.message = "Please write a message.";
  } else if (payload.message.trim().length < 10) {
    errors.message = "A little more detail would help — 10 characters or more.";
  }

  return errors;
}

export default function Contact() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const formRef = useRef<HTMLFormElement>(null);

  /** Clear one field's error as soon as the visitor starts fixing it. */
  function clearFieldError(field: keyof FieldErrors) {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // FormData.get() returns FormDataEntryValue | null. Casting that to
    // `string` told tsc a lie — validate() calls .trim() on all three, so a
    // missing `name` attribute on any input would have been a runtime
    // TypeError that the type system had been talked out of reporting.
    const data = new FormData(e.currentTarget);
    const payload = {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      message: String(data.get("message") ?? ""),
    };

    const errors = validate(payload);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setStatus("idle");
      setErrorMsg("");
      // Move focus to the first field that failed, so keyboard and screen
      // reader users land on the problem instead of hunting for it.
      const firstInvalid = (["name", "email", "message"] as const).find(
        (field) => errors[field]
      );
      if (firstInvalid) {
        formRef.current
          ?.querySelector<HTMLElement>(`#${firstInvalid}`)
          ?.focus();
      }
      return;
    }

    setFieldErrors({});
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch(apiUrl("/api/contact"), {
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
        <Reveal className="text-center mb-12 space-y-4" blur>
          <span className="font-label-sm text-label-sm uppercase tracking-widest text-accent">
            Contact
          </span>
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">
            Say hello
          </h1>
          {/* First person. The About page says "I am a photographer… I shoot
              on a mix of digital and film"; this page used to say "We review
              all submissions", which read as a different, larger outfit. */}
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl mx-auto">
            Commissions, licensing, exhibitions — or just to say something
            about a photograph. I read everything and usually reply within a
            couple of days.
          </p>
        </Reveal>

        {/* Success Banner */}
        {status === "success" && (
          <div className="w-full mb-8 flex items-center gap-3 px-5 py-4 rounded-2xl bg-white/5 border border-white/15 text-on-surface animate-[fadeInUp_0.4s_ease-out]">
            <span
              className="material-symbols-outlined text-[20px] text-accent shrink-0"
              style={{ fontVariationSettings: "'FILL' 1, 'wght' 250" }}
            >
              check_circle
            </span>
            <p className="font-body-md text-body-md">
              Message sent. I&apos;ll be in touch within a couple of days.
            </p>
          </div>
        )}

        <Reveal className="w-full" delay={0.1}>
          <form ref={formRef} onSubmit={handleSubmit} className="w-full space-y-5" noValidate>
            <div>
              <div
                className={`studio-field px-5 py-4 ${fieldErrors.name ? "studio-field-error" : ""}`}
              >
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
                  aria-invalid={fieldErrors.name ? true : undefined}
                  aria-describedby={fieldErrors.name ? "name-error" : undefined}
                  onChange={() => clearFieldError("name")}
                />
              </div>
              {fieldErrors.name && (
                <p
                  id="name-error"
                  className="mt-2 px-1 font-label-sm text-label-sm text-error"
                >
                  {fieldErrors.name}
                </p>
              )}
            </div>

            <div>
              <div
                className={`studio-field px-5 py-4 ${fieldErrors.email ? "studio-field-error" : ""}`}
              >
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
                  aria-invalid={fieldErrors.email ? true : undefined}
                  aria-describedby={fieldErrors.email ? "email-error" : undefined}
                  onChange={() => clearFieldError("email")}
                />
              </div>
              {fieldErrors.email && (
                <p
                  id="email-error"
                  className="mt-2 px-1 font-label-sm text-label-sm text-error"
                >
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div>
              <div
                className={`studio-field px-5 py-4 ${fieldErrors.message ? "studio-field-error" : ""}`}
              >
                <label className="sr-only" htmlFor="message">
                  Message
                </label>
                <textarea
                  className="w-full bg-transparent border-0 font-body-md text-body-md text-on-surface focus:ring-0 focus:outline-none p-0 resize-none placeholder:text-on-surface-variant/50"
                  id="message"
                  name="message"
                  placeholder="Tell me about the project…"
                  rows={5}
                  required
                  disabled={isLoading}
                  aria-invalid={fieldErrors.message ? true : undefined}
                  aria-describedby={
                    fieldErrors.message ? "message-error" : undefined
                  }
                  onChange={() => clearFieldError("message")}
                ></textarea>
              </div>
              {fieldErrors.message && (
                <p
                  id="message-error"
                  className="mt-2 px-1 font-label-sm text-label-sm text-error"
                >
                  {fieldErrors.message}
                </p>
              )}
            </div>

            {/* Inline Error */}
            {status === "error" && (
              <div className="flex items-center gap-2 text-error animate-[fadeInUp_0.3s_ease-out]">
                <span
                  className="material-symbols-outlined text-[18px] shrink-0"
                  style={{ fontVariationSettings: "'FILL' 1, 'wght' 250" }}
                >
                  error
                </span>
                <p className="font-body-md text-body-md">{errorMsg}</p>
              </div>
            )}

            <div className="pt-6 flex justify-center">
              <button
                className="btn-glass group pl-8 pr-2 py-2 font-label-sm text-label-sm tracking-widest uppercase text-on-surface flex items-center gap-4"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? "Sending…" : "Send message"}
                {/* The spinner swaps into the nest rather than replacing the
                    whole label row, so the button doesn't resize mid-submit. */}
                <span className="btn-icon-nest">
                  {isLoading ? (
                    <Spinner />
                  ) : (
                    <span className="material-symbols-outlined text-[18px]">
                      arrow_forward
                    </span>
                  )}
                </span>
              </button>
            </div>
          </form>
        </Reveal>
      </main>

      <SiteFooter />
    </div>
  );
}
