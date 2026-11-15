/**
 * Fixed-window rate limiting, in memory (Phase D3).
 *
 * In memory is enough here: the API runs as ONE Render instance, so every
 * request for a key lands in the same Map. (Behind several instances this
 * would need a shared store.) A restart resets the counts, which errs on the
 * side of the visitor.
 *
 * Keyed on the client IP. That relies on `app.set('trust proxy', 1)` in
 * server.js: Render terminates TLS at one proxy hop, and without it every
 * request would appear to come from that proxy and share one bucket.
 */
export function rateLimit({ name, windowMs, max, message }) {
  const hits = new Map(); // key -> { count, resetAt }

  // Drop expired windows now and then, so the Map can't grow without bound.
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key);
  }, Math.min(windowMs, 10 * 60 * 1000));
  sweep.unref();

  return function limiter(req, res, next) {
    const now = Date.now();
    const key = req.ip || 'unknown';
    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;

    res.setHeader('RateLimit-Limit', String(max));
    res.setHeader('RateLimit-Remaining', String(Math.max(0, max - entry.count)));

    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      console.warn(`[rate-limit] ${name}: ${key} over ${max} per ${windowMs / 1000}s`);
      return res.status(429).json({ message });
    }
    next();
  };
}

/** Sign-in: 5 attempts per 15 minutes per address. */
export const loginLimiter = rateLimit({
  name: 'login',
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many sign-in attempts. Please wait 15 minutes and try again.',
});

/** Contact form: 5 messages per hour per address. */
export const contactLimiter = rateLimit({
  name: 'contact',
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many messages from this connection. Please try again in an hour.',
});
