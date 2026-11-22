import { NextResponse, type NextRequest } from "next/server";

/**
 * The visitor's address, for the API's rate limits (audit F2, 2026-11-22).
 *
 * The browser now reaches the API through this site (/api/* is rewritten to
 * Render in next.config.ts) so the session can live in an httpOnly cookie.
 * Through that proxy every request reaches Render from Vercel's address,
 * which would lump all visitors into one rate-limit bucket. For the routes
 * that are limited per visitor, this adds the visitor's address and a
 * shared key (PROXY_KEY, set in both the Vercel and Render dashboards); the
 * API trusts the address only when the key matches
 * (backend/middleware/rateLimit.js), so calling Render directly can't fake it.
 *
 * Only these small JSON routes pass through here. Everything else, uploads
 * included, takes the plain rewrite, which has no extra body-size cap.
 */
const API_ORIGIN = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL ?? "https://theshutterbug.onrender.com").origin;
  } catch {
    return "https://theshutterbug.onrender.com";
  }
})();

export function proxy(request: NextRequest) {
  const target = new URL(request.nextUrl.pathname + request.nextUrl.search, API_ORIGIN);
  const headers = new Headers(request.headers);
  // Never pass on whatever a client sent under these names.
  headers.delete("x-sb-visitor-ip");
  headers.delete("x-sb-proxy-key");
  const key = process.env.PROXY_KEY;
  // Vercel sets x-real-ip / x-forwarded-for itself and overwrites a client's.
  const ip = request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (key && ip) {
    headers.set("x-sb-visitor-ip", ip);
    headers.set("x-sb-proxy-key", key);
  }
  return NextResponse.rewrite(target, { request: { headers } });
}

export const config = {
  matcher: ["/api/auth/login", "/api/auth/credentials", "/api/contact"],
};
