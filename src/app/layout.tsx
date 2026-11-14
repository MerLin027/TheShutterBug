import type { Metadata } from "next";
import { IBM_Plex_Mono, Jost, Playwrite_VN } from "next/font/google";
import "./globals.css";
import PageTransition from "@/components/PageTransition";

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

/** Contact-sheet signature — frame numbers and meta only. */
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
  preload: false,
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
    // smooth scroll to the top underneath PageTransition's fade.
    <html
      lang="en"
      className={`dark ${jost.variable} ${playwrite.variable} ${plexMono.variable}`}
      data-scroll-behavior="smooth"
    >
      <body className="antialiased bg-primary-container">
        {/* Keyboard users otherwise have to tab through the whole navbar on
            every page before reaching content. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-full focus:bg-accent focus:px-5 focus:py-2.5 focus:font-label-sm focus:text-label-sm focus:uppercase focus:tracking-widest focus:text-on-accent"
        >
          Skip to content
        </a>

        {/* Film grain, applied once here rather than per page — it used to
            live on Contact alone, which made that page read as a different
            surface from the rest of the site. */}
        <div className="noise-overlay" aria-hidden="true" />

        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
