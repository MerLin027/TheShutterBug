import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin – The Shutter Bug",
  description: "Admin panel for managing the photography portfolio",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
