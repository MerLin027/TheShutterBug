import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Studio — The Shutter Bug",
  description: "Studio panel for managing the photography portfolio",
  // The Studio is private: keep the sign-in page out of search results.
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
