import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/** The Express API's origin, the only other place the site talks to. */
const API_ORIGIN = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL ?? "https://theshutterbug.onrender.com").origin;
  } catch {
    return "https://theshutterbug.onrender.com";
  }
})();

/**
 * Content-Security-Policy (Phase D1).
 *
 * - script-src keeps 'unsafe-inline'. Next inlines its hydration data as
 *   <script> tags; the strict alternative is a per-request nonce, which forces
 *   every page to render dynamically and gives up the static/ISR pages this
 *   site is built on. Everything else is locked down, and no third-party
 *   script is allowed to load at all. 'unsafe-eval' only in dev (HMR needs it).
 * - img-src allows any https: host. The About portrait is a free-text URL the
 *   owner can point anywhere (a settled decision), so a fixed host list would
 *   break it silently; images can't run code.
 * - connect-src: this site only (the API is proxied under /api).
 * - frame-ancestors 'none': the site can't be framed (clickjacking).
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  // 'self' only: the browser reaches the API through this site's /api proxy
  // (audit F2), never the API's own address.
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "media-src 'self'",
  "object-src 'none'",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  // Don't advertise the framework (D1).
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // The API through this site's own domain (audit F2, 2026-11-22): the
  // browser only ever talks to this origin, so the Studio session can be an
  // httpOnly, SameSite=Strict cookie (vercel.app and onrender.com can't share
  // one). Vercel proxies these to Render (120 s limit, which covers a cold
  // start). The few per-visitor rate-limited routes go through src/proxy.ts
  // first, which adds the signed visitor address.
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_ORIGIN}/api/:path*` }];
  },
  // No experimental viewTransition any more: it froze the page during route
  // changes, which swallowed clicks made mid-transition (measured: four quick
  // "Next" presses moved one photo). The gallery now opens photos in an
  // in-page viewer instead (REDESIGN.md, Phase R).
  //
  // No `images.remotePatterns`: nothing uses next/image (plain <img> with
  // signed Cloudinary renditions, by decision), so it configured nothing.
  // Removed in the 2026-11-21 audit.
};

export default nextConfig;
