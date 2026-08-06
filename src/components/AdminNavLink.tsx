"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function AdminNavLink({ className, children }: { className?: string, children?: React.ReactNode }) {
  const [href, setHref] = useState("/admin");

  useEffect(() => {
    if (localStorage.getItem("admin_token")) {
      setHref("/admin/dashboard");
    }
  }, []);

  return (
    <Link href={href} className={className} title="Admin Access">
      {children || (
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>
          admin_panel_settings
        </span>
      )}
    </Link>
  );
}
