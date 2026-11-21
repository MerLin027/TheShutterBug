"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Page-change fade (owner, 2026-11-21). A template remounts on every
 * navigation, unlike the layout, so each new page can fade in.
 *
 * Never on the first load: the server can't know whether this is a
 * navigation, and a fade there would only delay the first paint (and
 * the home hero has its own entrance). A module flag is set after the
 * first mount; every later mount is a client-side navigation and gets
 * .page-enter (globals.css). The flag is only read on the client, so the
 * server and the first client render agree.
 *
 * The wrapper is display: contents, so it adds no box to the layout.
 */
let navigated = false;

export default function Template({ children }: { children: ReactNode }) {
  const [animate] = useState(() => typeof window !== "undefined" && navigated);

  useEffect(() => {
    navigated = true;
  }, []);

  return (
    <div className={animate ? "page-enter" : undefined} style={{ display: "contents" }}>
      {children}
    </div>
  );
}
