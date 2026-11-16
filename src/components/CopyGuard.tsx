"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Discourages copying from the public site (owner request, 2026-11-16:
 * "I can still right click and inspect").
 *
 * - Right-click is turned off, except in text fields (so people can still
 *   paste into the contact form).
 * - The usual shortcuts are swallowed: F12 and Ctrl/⌘+Shift+I / J / C (dev
 *   tools), Ctrl/⌘+U (view source), Ctrl/⌘+S (save page).
 *
 * This is a deterrent, not a lock. No page can stop someone opening dev tools
 * from the browser's own menu, typing `view-source:`, or fetching the HTML
 * from a terminal. What actually protects the photographs is server-side
 * (Phase D10): all anyone can get is a compressed, signed display copy.
 *
 * The Studio is left alone; the owner needs a working browser there.
 */
const EDITABLE = "input, textarea, select, [contenteditable='true']";

export default function CopyGuard() {
  const pathname = usePathname();
  const active = !pathname.startsWith("/admin");

  useEffect(() => {
    if (!active) return;

    const onContextMenu = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (target?.closest(EDITABLE)) return;
      e.preventDefault();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const mod = e.ctrlKey || e.metaKey;
      const devtools =
        e.key === "F12" ||
        (mod && e.shiftKey && (key === "i" || key === "j" || key === "c")) ||
        // macOS: ⌘+⌥+I / J / C
        (e.metaKey && e.altKey && (key === "i" || key === "j" || key === "c"));
      const source = mod && !e.shiftKey && key === "u";
      const save = mod && !e.shiftKey && key === "s";
      if (devtools || source || save) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener("contextmenu", onContextMenu);
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("keydown", onKeyDown, { capture: true });
    };
  }, [active]);

  return null;
}
