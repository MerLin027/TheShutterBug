"use client";

import { useState, type FormEvent } from "react";
import { apiUrl } from "@/lib/api";
import { useAdminToken } from "@/lib/useAdminToken";
import StudioShell from "@/components/StudioShell";
import StudioTopBar from "@/components/StudioTopBar";
import Spinner from "@/components/Spinner";
import { StudioBoot } from "@/components/StudioSkeletons";
import SessionsSection from "./SessionsSection";

/** In step with PASSWORD_MIN in backend/routes/auth.js. */
const PASSWORD_MIN = 12;

/**
 * Studio → Account (owner request, 2026-11-15): change the sign-in email
 * and/or password. Backed by PUT /api/auth/credentials, which asks for the
 * current password again, signs out every other session, and hands this one
 * a fresh session.
 */
export default function AccountClient() {
  // `email` is the server's answer (the session hook asks GET /api/auth/me),
  // so a new email is always compared against the real one.
  const { signedIn, email, ready, signOut, updateSession } = useAdminToken();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  // The email box starts as the signed-in address; null = untouched.
  const emailValue = newEmail ?? email;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setDone("");

    const emailChanged = emailValue.trim().toLowerCase() !== email.trim().toLowerCase();
    const passwordChanged = newPassword !== "";

    if (!currentPassword) {
      setError("Enter your current password to make a change.");
      return;
    }
    if (!emailChanged && !passwordChanged) {
      setError("Change the email or enter a new password first.");
      return;
    }
    if (passwordChanged && newPassword.length < PASSWORD_MIN) {
      setError(`The new password must be at least ${PASSWORD_MIN} characters.`);
      return;
    }
    if (passwordChanged && newPassword !== confirmPassword) {
      setError("The two new passwords don't match.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(apiUrl("/api/auth/credentials"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          ...(emailChanged ? { email: emailValue.trim() } : {}),
          ...(passwordChanged ? { newPassword } : {}),
        }),
      });
      if (res.status === 401) {
        signOut();
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.email) {
        setError(data.message || "Couldn't save. Please try again.");
        return;
      }
      // The API has already replaced this browser's session cookie.
      updateSession(data.email);
      setCurrentPassword("");
      setNewEmail(null);
      setNewPassword("");
      setConfirmPassword("");
      setDone(
        [emailChanged && "Email", passwordChanged && "password"]
          .filter(Boolean)
          .join(" and ")
          .replace(/^./, (c) => c.toUpperCase()) +
          " updated. Any other signed-in browser has been signed out."
      );
    } catch {
      setError("Couldn't reach the server. It may be waking up, so try again in a moment.");
    } finally {
      setSaving(false);
    }
  }

  if (!ready || !signedIn) {
    return <StudioBoot />;
  }

  return (
    <StudioShell>
      <StudioTopBar title="Account" />

      <div className="mx-auto max-w-2xl px-4 pb-16 pt-8 md:px-8 md:pt-12">
        <h2 className="studio-heading mb-2">Sign-In Details</h2>
        <p className="lede mb-10 !text-[1.15rem]">
          The email and password you use to open the Studio. Saving signs out
          every other browser.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8" noValidate>
          <div>
            <label htmlFor="account-email" className="field-label">
              Email
            </label>
            <input
              id="account-email"
              name="email"
              type="email"
              autoComplete="username"
              value={emailValue}
              onChange={(e) => setNewEmail(e.target.value)}
              disabled={saving}
              maxLength={254}
              className="field"
            />
          </div>

          <div>
            <label htmlFor="account-new-password" className="field-label">
              New password <span className="font-normal text-fg-3">· leave empty to keep it</span>
            </label>
            <input
              id="account-new-password"
              name="new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={saving}
              maxLength={72}
              aria-describedby="account-password-hint"
              className="field"
            />
            <p id="account-password-hint" className="mt-2 text-label text-fg-3">
              {PASSWORD_MIN} to 72 characters. A few unrelated words make a strong one.
            </p>
          </div>

          {newPassword !== "" && (
            <div>
              <label htmlFor="account-confirm-password" className="field-label">
                New password, again
              </label>
              <input
                id="account-confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={saving}
                maxLength={72}
                className="field"
              />
            </div>
          )}

          <div className="border-t border-line pt-8">
            <label htmlFor="account-current-password" className="field-label">
              Current password
            </label>
            <input
              id="account-current-password"
              name="current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={saving}
              maxLength={200}
              aria-describedby="account-current-hint"
              className="field"
            />
            <p id="account-current-hint" className="mt-2 text-label text-fg-3">
              Needed for any change, so nobody at an unlocked screen can take the account.
            </p>
          </div>

          {error && (
            <p role="alert" className="msg-in text-body-md text-error">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <button type="submit" disabled={saving} aria-busy={saving} className="btn btn-primary">
              {saving ? (
                <>
                  <Spinner />
                  Saving…
                </>
              ) : (
                "Save changes"
              )}
            </button>
            {done && (
              <p role="status" className="msg-in text-label text-fg-2">
                {done}
              </p>
            )}
          </div>
        </form>

        <SessionsSection signOut={signOut} />
      </div>
    </StudioShell>
  );
}
