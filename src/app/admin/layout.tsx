import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Studio — The Shutter Bug",
  description: "Studio panel for managing the photography portfolio",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
