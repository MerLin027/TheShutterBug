"use client";

import { useState, useRef, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { apiUrl } from "@/lib/api";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import Spinner from "@/components/Spinner";
import { ArrowRight, CircleAlert, CircleCheck } from "lucide-react";

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
 * is what earns it. The server validates again; this is UX only.
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
    // Deliberately loose. Anything stricter rejects valid addresses.
    errors.email = "That doesn't look like an email address.";
  }

  if (!payload.message.trim()) {
    errors.message = "Please write a message.";
  } else if (payload.message.trim().length < 10) {
    errors.message = "A little more detail would help: 10 characters or more.";
  }

  return errors;
}

/**
 * "What's it about?" (owner, 2026-11-21: the page was too empty, but no
 * photographs). Optional. The choice is put at the start of the message as
 * "[Licensing] …", so enquiries can be told apart at a glance in Studio →
 * Messages, with no change to the API or the database.
 */
const TOPICS = ["Commission", "Licensing", "Exhibition", "Print", "Just saying hello"] as const;
/** Room left for the "[Topic] " prefix under the API's 5000-character cap. */
const MESSAGE_MAX = 5000 - "[Just saying hello] ".length;

/** One labelled field: label above, error below, wired with aria. */
function Field({
  id,
  label,
  error,
  children,
}: {
  id: keyof FieldErrors;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="field-label-caps">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}

export default function ContactClient() {
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

    // FormData.get() returns FormDataEntryValue | null — normalise to string
    // rather than casting, so a missing `name` attribute can't become a
    // runtime TypeError the type system was talked out of reporting.
    const data = new FormData(e.currentTarget);
    const payload = {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      message: String(data.get("message") ?? ""),
    };
    // The topic radios sit in the left column, outside <form>; their
    // form="contact-form" attribute still makes them part of it.
    const topic = String(data.get("topic") ?? "");
    // Honeypot: people never see this field; a form-filling bot does. Sent
    // as-is, and the API quietly drops any message that fills it.
    const website = String(data.get("website") ?? "");

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
        formRef.current?.querySelector<HTMLElement>(`#${firstInvalid}`)?.focus();
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
        body: JSON.stringify({
          ...payload,
          message: (TOPICS as readonly string[]).includes(topic) ? `[${topic}] ${payload.message.trim()}` : payload.message,
          website,
        }),
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
  const invalid = (field: keyof FieldErrors) =>
    fieldErrors[field]
      ? { "aria-invalid": true as const, "aria-describedby": `${field}-error` }
      : {};

  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper text-fg antialiased">
      <SiteNav />

      <main
        id="main"
        className="flex-1 px-margin-mobile pb-24 pt-32 md:px-margin-desktop md:pb-24 md:pt-36"
      >
        {/* Asymmetric split: heading and intro left, form right. Was a
            centred stack with placeholder-only fields. */}
        <div className="site-container grid gap-10 md:grid-cols-12 md:gap-16">
          <div className="enter md:col-span-5">
            <p className="caps">Contact</p>
            <h1 className="display-title mt-5">Say Hello</h1>
            {/* First person, matching the About page. The line that promised
                a reply window was cut in dc3ac35b: nothing behind this form
                notifies anyone — it writes a row to MongoDB and waits. */}
            <p className="lede mt-6 max-w-[28rem]">
              Commissions, licensing, exhibitions, or just to say something
              about a photograph
            </p>

            <fieldset className="mt-10 md:mt-12">
              <legend className="caps">What&apos;s it about? <span className="normal-case tracking-normal text-fg-3">· optional</span></legend>
              <div className="topic-list mt-4">
                {TOPICS.map((t, i) => (
                  <label key={t} className="topic">
                    <input type="radio" name="topic" value={t} form="contact-form" className="sr-only" disabled={isLoading} />
                    <span className="topic-no" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                    <span className="topic-name">{t}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="enter md:col-span-7" style={{ "--i": 1 } as CSSProperties}>
            {status === "success" && (
              <div
                role="status"
                className="msg-in mb-8 flex items-start gap-3 rounded-control border border-line bg-card px-4 py-3"
              >
                <CircleCheck size={20} className="mt-0.5 text-accent" aria-hidden="true" />
                {/* Owner's decision (2026-11-14): no reply promise. Nothing
                    behind this form notifies anyone, so the old "I'll be in
                    touch within a couple of days" was a promise the system
                    could not keep. */}
                <p className="text-body-md text-fg">Message sent. Thank you.</p>
              </div>
            )}

            <form id="contact-form" ref={formRef} onSubmit={handleSubmit} className="space-y-10" noValidate>
              {/* Honeypot (Phase D4): off-screen, out of the tab order and
                  hidden from assistive tech, so only a bot fills it. */}
              <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
                <label htmlFor="website">Website</label>
                <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
              </div>
              <div className="grid gap-10 sm:grid-cols-2">
                <Field id="name" label="Name" error={fieldErrors.name}>
                  <input
                    className="field-line"
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    maxLength={100}
                    required
                    disabled={isLoading}
                    onChange={() => clearFieldError("name")}
                    {...invalid("name")}
                  />
                </Field>
                <Field id="email" label="Email" error={fieldErrors.email}>
                  <input
                    className="field-line"
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    maxLength={254}
                    required
                    disabled={isLoading}
                    onChange={() => clearFieldError("email")}
                    {...invalid("email")}
                  />
                </Field>
              </div>

              <Field id="message" label="Message" error={fieldErrors.message}>
                <textarea
                  className="field-line resize-none"
                  id="message"
                  name="message"
                  rows={4}
                  maxLength={MESSAGE_MAX}
                  required
                  disabled={isLoading}
                  onChange={() => clearFieldError("message")}
                  {...invalid("message")}
                ></textarea>
              </Field>

              {status === "error" && (
                <div role="alert" className="msg-in flex items-start gap-2 text-error">
                  <CircleAlert size={18} className="mt-0.5" aria-hidden="true" />
                  <p className="text-body-md">{errorMsg}</p>
                </div>
              )}

              <button className="btn btn-primary !rounded-full px-8" type="submit" disabled={isLoading} aria-busy={isLoading}>
                {isLoading ? "Sending…" : "Send message"}
                {/* Same-size slot for the arrow and the spinner, so the
                    button doesn't change width mid-submit. */}
                <span className="inline-flex size-[18px] items-center justify-center">
                  {isLoading ? (
                    <Spinner />
                  ) : (
                    <ArrowRight size={18} aria-hidden="true" />
                  )}
                </span>
              </button>
            </form>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
