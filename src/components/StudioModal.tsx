"use client";

import { useEffect, type ReactNode } from "react";

/**
 * The Studio's modal shell, extracted from the three hand-rolled copies in
 * UploadModal, EditModal and DashboardClient's delete confirmation. All three
 * carried the same backdrop, the same `admin-modal-enter liquid-glass` panel
 * and the same `e.target === e.currentTarget` dismissal test — and all three
 * were missing the same two things:
 *
 *   1. Escape. The lightbox has full keyboard control (LightboxKeys); the
 *      Studio's dialogs could only be dismissed by clicking the backdrop or
 *      hitting a close button. That was drift, not a decision.
 *   2. A body scroll lock. Scrolling the page behind an open dialog moves the
 *      content out from under it while the dialog stays pinned.
 *
 * `dismissible` covers the delete confirmation's existing rule: while the
 * delete is in flight, neither the backdrop nor Escape should close it.
 */
export default function StudioModal({
  title,
  onClose,
  dismissible = true,
  size = "lg",
  className = "",
  children,
}: {
  /** Renders the standard header row with a close button. Omit for dialogs
   *  that supply their own heading, like the delete confirmation. */
  title?: string;
  onClose: () => void;
  /** False while an irreversible action is running. */
  dismissible?: boolean;
  size?: "sm" | "lg";
  className?: string;
  children: ReactNode;
}) {
  // Escape closes — unless the dialog is mid-action.
  useEffect(() => {
    if (!dismissible) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dismissible, onClose]);

  // Scroll lock. Restores whatever was there before rather than assuming "",
  // so this stays correct if anything else ever sets it.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center admin-modal-backdrop"
      onClick={(e) => {
        // Only a click on the backdrop itself — not one that bubbled up out
        // of the panel — counts as a dismissal.
        if (e.target === e.currentTarget && dismissible) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`admin-modal-enter liquid-glass rounded-2xl w-full ${
          size === "sm" ? "max-w-sm" : "max-w-lg"
        } mx-4 p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto ${className}`.trim()}
      >
        {title && (
          <div className="flex items-center justify-between">
            <h2 className="font-headline-md text-headline-md text-on-surface">
              {title}
            </h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="btn-icon-glass text-on-surface"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
