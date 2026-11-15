"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

/**
 * The Studio's dialog shell, used by Upload, Edit and the delete
 * confirmations.
 *
 * Phase C: a solid card panel on a dark backdrop. It was a translucent
 * `liquid-glass` panel, so the photographs behind it showed through the
 * upload drop zone and the form (REDESIGN.md §3.9, task C3).
 *
 * Behaviour kept from Stage 3, plus focus handling:
 *   - Escape closes, unless `dismissible` is false (an irreversible action
 *     is running — e.g. a delete in flight).
 *   - A click on the backdrop itself closes; one that bubbles out of the
 *     panel doesn't.
 *   - The page behind cannot scroll.
 *   - Focus moves into the dialog on open and returns to whatever had it
 *     on close, so keyboard users aren't dropped at the top of the page.
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
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();

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

  useEffect(() => {
    const previous = document.body.style.overflow;
    const opener = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    // First focusable control in the panel, else the panel itself.
    const first = panel.current?.querySelector<HTMLElement>(
      "input, select, textarea, button, [href], [tabindex]:not([tabindex='-1'])"
    );
    (first ?? panel.current)?.focus();
    return () => {
      document.body.style.overflow = previous;
      opener?.focus?.();
    };
  }, []);

  return (
    <div
      className="studio-backdrop fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && dismissible) onClose();
      }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={`studio-dialog panel flex max-h-[90dvh] w-full flex-col gap-6 overflow-y-auto p-6 sm:p-8 ${
          size === "sm" ? "max-w-sm" : "max-w-lg"
        } ${className}`.trim()}
      >
        {title && (
          <div className="flex items-center justify-between gap-4">
            <h2 id={titleId} className="studio-heading">
              {title}
            </h2>
            <button type="button" onClick={onClose} aria-label="Close" className="tool-btn -mr-2">
              <X size={20} aria-hidden="true" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
