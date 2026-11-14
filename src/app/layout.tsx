import type { Metadata } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";

// Self-hosted at build time by next/font: no request to Google at runtime,
// no render-blocking third-party stylesheet, and nothing third-party for the
// CSP to allow. Each is exposed as a CSS variable that globals.css reads.

/** Text, labels, buttons. Variable font, wght 100–900. */
const jost = Jost({
  subsets: ["latin"],
  variable: "--font-jost",
  display: "swap",
});

/**
 * Display serif (Phase R, editorial direction chosen by the owner and
 * recommended by the ui-ux-pro-max skill for photography portfolios):
 * titles, the wordmark, captions. Variable wght 300–700, with italics.
 */
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
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
    // Next 16 only suppresses smooth scrolling during a route change when it
    // finds this attribute; without it every navigation animates a long
    // smooth scroll back to the top.
    <html
      lang="en"
      className={`dark ${jost.variable} ${cormorant.variable}`}
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
        {children}
      </body>
    </html>
  );
}
