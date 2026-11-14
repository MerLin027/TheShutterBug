import type { Metadata } from "next";
import { IBM_Plex_Mono, Jost, Playwrite_VN } from "next/font/google";
import "./globals.css";

// Self-hosted at build time by next/font: no request to Google at runtime,
// no render-blocking third-party stylesheet, and nothing third-party for the
// CSP to allow. Each is exposed as a CSS variable that globals.css reads.

/** Every interface surface. Variable font, wght 100–900. */
const jost = Jost({
  subsets: ["latin"],
  variable: "--font-jost",
  display: "swap",
});

/**
 * Script wordmark (.font-title). Google lists no subsets for this family,
 * so next/font never preloads it (its types don't even accept `preload`).
 * Kept for rollback (REDESIGN.md §3.3).
 */
const playwrite = Playwrite_VN({
  variable: "--font-playwrite",
  display: "swap",
});

/** Contact-sheet signature: frame numbers and meta only. Preloaded since
 *  Phase B because every photo card shows a frame line. */
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Shutter Bug",
  description:
    "Photographs of light, absence, and the edges of the day — seascapes, empty streets, and quiet objects.",
  openGraph: {
    title: "The Shutter Bug",
    description:
      "Photographs of light, absence, and the edges of the day — seascapes, empty streets, and quiet objects.",
    type: "website",
    siteName: "The Shutter Bug",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // data-scroll-behavior is required alongside `scroll-behavior: smooth`:
    // Next 16 only suppresses smooth scrolling during a route transition when
    // it finds this attribute. Without it every navigation animates a long
    // smooth scroll to the top underneath the route transition.
    <html
      lang="en"
      className={`dark ${jost.variable} ${playwrite.variable} ${plexMono.variable}`}
      data-scroll-behavior="smooth"
    >
      <body className="bg-paper antialiased">
        {/* Keyboard users otherwise have to tab through the whole navbar on
            every page before reaching content. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-control focus:bg-fg focus:px-4 focus:py-2.5 focus:text-label focus:font-medium focus:text-paper"
        >
          Skip to content
        </a>

        {/* Phase B: no film-grain overlay (unslop: no grain/noise as
            decoration) and no Framer Motion page fade — route changes run as
            native view transitions (next.config.ts, globals.css). */}
        {children}
      </body>
    </html>
  );
}
