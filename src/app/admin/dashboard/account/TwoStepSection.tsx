"use client";

import { useEffect, useState, type FormEvent } from "react";
import { renderSVG } from "uqr";
import { apiUrl } from "@/lib/api";
import Spinner from "@/components/Spinner";

/**
 * Studio → Account → Two-step sign-in (2026-11-22 audit, OWASP A07).
 *
 * On: password → scan the QR code (or type the key) into an authenticator
 * app → enter its first code → ten recovery codes, shown once. Off: password
 * plus a current code (or a recovery code). Both sign out every other
 * browser and hand this one a fresh session (backend/routes/auth.js).
 *
 * The QR code is drawn here, in the browser, from the otpauth address the
 * API returns (uqr, no network); the key never goes to any other service.
 */
type Status = { enabled: boolean; recoveryCodesLeft: number };
type Setup = { secret: string; otpauthUrl: string };

export default function TwoStepSection({
  token,
  email,
  signOut,
  updateSession,
}: {
  token: string;
  email: string;
  signOut: () => void;
  updateSession: (token: string, email: string) => void;
}) {
  const [status, setStatus] = useState<Status | null>(null);
  const [setup, setSetup] = useState<Setup | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(apiUrl("/api/auth/2fa"), { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" })
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 401) return signOut();
        if (res.ok) setStatus(await res.json());
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [token, signOut]);

  async function call(path: string, body: object) {
    const res = await fetch(apiUrl(path), {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.status === 401) {
      signOut();
      return null;
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.message || "Something went wrong. Please try again.");
      return null;
    }
    return data;
  }

  async function run(e: FormEvent, action: () => Promise<void>) {
    e.preventDefault();
    setError("");
    setDone("");
    setBusy(true);
    try {
      await action();
    } catch {
      setError("Couldn't reach the server. It may be waking up, so try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  const start = (e: FormEvent) =>
    run(e, async () => {
      const data = await call("/api/auth/2fa/setup", { currentPassword: password });
      if (!data) return;
      setSetup(data);
      setPassword("");
    });

  const confirm = (e: FormEvent) =>
    run(e, async () => {
      const data = await call("/api/auth/2fa/enable", { code: code.trim() });
      if (!data) return;
      updateSession(data.token, email);
      setRecoveryCodes(data.recoveryCodes);
      setStatus({ enabled: true, recoveryCodesLeft: data.recoveryCodes.length });
      setSetup(null);
      setCode("");
    });

  const turnOff = (e: FormEvent) =>
    run(e, async () => {
      const data = await call("/api/auth/2fa/disable", { currentPassword: password, code: code.trim() });
      if (!data) return;
      updateSession(data.token, email);
      setStatus({ enabled: false, recoveryCodesLeft: 0 });
      setPassword("");
      setCode("");
      setDone("Two-step sign-in is off. Any other signed-in browser has been signed out.");
    });

  function downloadCodes() {
    if (!recoveryCodes) return;
    const text =
      "The Shutter Bug: Studio recovery codes\n" +
      `Account: ${email}\nCreated: ${new Date().toISOString().slice(0, 10)}\n\n` +
      "Each code works once, in place of the 6-digit code.\n\n" +
      recoveryCodes.join("\n") +
      "\n";
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "shutter-bug-recovery-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  const qr = setup
    ? `data:image/svg+xml;utf8,${encodeURIComponent(renderSVG(setup.otpauthUrl, { border: 2 }))}`
    : null;

  return (
    <section className="mt-16 border-t border-line pt-12" aria-labelledby="two-step-heading">
      <h2 id="two-step-heading" className="studio-heading mb-2">
        Two-Step Sign-In
      </h2>
      <p className="lede mb-8 !text-[1.15rem]">
        After your password, the Studio also asks for a 6-digit code from an authenticator app on your phone,
        so a leaked password alone can&apos;t open it.
      </p>

      {status === null ? (
        <p className="text-label text-fg-3">Checking…</p>
      ) : recoveryCodes ? (
        <div className="flex flex-col gap-6">
          <p role="status" className="text-body-md text-fg">
            Two-step sign-in is on. Save these recovery codes somewhere safe, away from your phone. Each one
            works once if you lose the app. They won&apos;t be shown again.
          </p>
          <ul className="grid grid-cols-2 gap-x-8 gap-y-2 font-mono text-body-md text-fg sm:w-fit">
            {recoveryCodes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-4">
            <button type="button" className="btn btn-primary" onClick={downloadCodes}>
              Download as a text file
            </button>
            <button type="button" className="btn btn-quiet" onClick={() => setRecoveryCodes(null)}>
              I&apos;ve saved them
            </button>
          </div>
        </div>
      ) : status.enabled ? (
        <form onSubmit={turnOff} className="flex flex-col gap-8" noValidate>
          <p className="text-body-md text-fg">
            On. {status.recoveryCodesLeft} recovery code{status.recoveryCodesLeft === 1 ? "" : "s"} left.
            {status.recoveryCodesLeft <= 3 && " Turn it off and on again to get a fresh set."}
          </p>
          <div>
            <label htmlFor="two-step-off-password" className="field-label">
              Current password
            </label>
            <input
              id="two-step-off-password"
              type="password"
              autoComplete="current-password"
              className="field"
              maxLength={200}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
            />
          </div>
          <div>
            <label htmlFor="two-step-off-code" className="field-label">
              Code from your app, or a recovery code
            </label>
            <input
              id="two-step-off-code"
              type="text"
              autoComplete="one-time-code"
              className="field tracking-[0.2em]"
              maxLength={20}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={busy}
            />
          </div>
          {error && (
            <p role="alert" className="msg-in text-body-md text-error">
              {error}
            </p>
          )}
          <div>
            <button type="submit" className="btn btn-quiet" disabled={busy} aria-busy={busy}>
              {busy && <Spinner />}
              Turn off two-step sign-in
            </button>
          </div>
        </form>
      ) : setup && qr ? (
        <form onSubmit={confirm} className="flex flex-col gap-8" noValidate>
          <ol className="flex list-decimal flex-col gap-3 pl-5 text-body-md text-fg-2">
            <li>Open an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password, Authy…).</li>
            <li>Add an account and scan this code. Can&apos;t scan? Type the key below instead.</li>
            <li>Enter the 6-digit code the app shows.</li>
          </ol>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-8">
            {/* eslint-disable-next-line @next/next/no-img-element -- QR drawn locally as SVG */}
            <img src={qr} alt="QR code for your authenticator app" width={176} height={176} className="rounded-md" />
            <div>
              <p className="field-label">Key</p>
              <p className="break-all font-mono text-body-md text-fg">{setup.secret.replace(/(.{4})/g, "$1 ").trim()}</p>
            </div>
          </div>
          <div>
            <label htmlFor="two-step-code" className="field-label">
              6-digit code
            </label>
            <input
              id="two-step-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              className="field tracking-[0.3em]"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              disabled={busy}
              autoFocus
            />
          </div>
          {error && (
            <p role="alert" className="msg-in text-body-md text-error">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-4">
            <button type="submit" className="btn btn-primary" disabled={busy || code.length !== 6} aria-busy={busy}>
              {busy && <Spinner />}
              Turn on
            </button>
            <button
              type="button"
              className="btn btn-quiet"
              onClick={() => {
                setSetup(null);
                setCode("");
                setError("");
              }}
              disabled={busy}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={start} className="flex flex-col gap-8" noValidate>
          <p className="text-body-md text-fg">Off.</p>
          <div>
            <label htmlFor="two-step-password" className="field-label">
              Current password
            </label>
            <input
              id="two-step-password"
              type="password"
              autoComplete="current-password"
              className="field"
              maxLength={200}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
            />
          </div>
          {error && (
            <p role="alert" className="msg-in text-body-md text-error">
              {error}
            </p>
          )}
          <div>
            <button type="submit" className="btn btn-primary" disabled={busy || !password} aria-busy={busy}>
              {busy && <Spinner />}
              Set up two-step sign-in
            </button>
          </div>
        </form>
      )}

      {done && (
        <p role="status" className="msg-in mt-6 text-label text-fg-2">
          {done}
        </p>
      )}
    </section>
  );
}
