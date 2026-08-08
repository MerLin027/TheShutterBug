import type { Metadata } from "next";
import "./globals.css";
import PageTransition from "@/components/PageTransition";

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
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        {/* Jost covers every non-title surface (body, labels, nav, buttons,
            form fields) at 400/500/600/700; Playwrite VN is loaded only for
            .font-title. Inter and Space Grotesk are gone — after the token
            swap in globals.css nothing referenced either of them. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600;700&family=Playwrite+VN:wght@400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-primary-container">
        {/* Keyboard users otherwise have to tab through the whole navbar on
            every page before reaching content. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-full focus:bg-accent focus:px-5 focus:py-2.5 focus:font-label-sm focus:text-label-sm focus:uppercase focus:tracking-widest focus:text-[#1c1b1b]"
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
