/**
 * Security headers on every API response (Phase D2).
 *
 * The API only ever answers JSON to fetch() calls, so the policy can be as
 * tight as it gets: nothing may load, nothing may frame it, and browsers must
 * not sniff a response into something executable. Written out by hand rather
 * than pulling in a dependency for six headers.
 */
export function securityHeaders(req, res, next) {
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
}
