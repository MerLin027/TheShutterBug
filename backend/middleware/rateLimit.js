/**
 * Fixed-window rate limiting, in memory (Phase D3).
 *
 * In memory is enough here: the API runs as ONE Render instance, so every
 * request for a key lands in the same Map. (Behind several instances this
 * would need a shared store.) A restart resets the counts, which errs on the
 * side of the visitor.
 *
 * Keyed on the visitor's address (clientIp below).
 */

/**
 * The visitor's address. Render sits behind Cloudflare, which sets
 * CF-Connecting-IP to the address that connected to it and overwrites any
 * value a client sends, so it can't be forged. `req.ip` was the key before
 * (2026-11-21 audit): with `trust proxy 1` it resolved to whichever proxy
 * relayed the request, so one visitor's five requests read "remaining"
 * 4, 4, 3, 2, 3 — the limit was spread over proxies, not visitors. Falls back
 * to req.ip when the header is absent (local runs).
 */
export function clientIp(req) {
  const cf = req.headers['cf-connecting-ip'];
  if (typeof cf === 'string' && cf.length > 0 && cf.length <= 64) return cf.trim();
  return req.ip || 'unknown';
}

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
    const key = clientIp(req);
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

/**
 * Failed sign-ins across ALL addresses (there is one admin account). The
 * per-address limit can be spread across many addresses; this can't. After
 * ACCOUNT_FAILURES_MAX wrong passwords within an hour, sign-in pauses for
 * everyone until the hour since the first of them has passed. A correct
 * password does not clear it early: that would let a guesser learn when they
 * had hit it. Worst case for the owner is a wait of up to an hour.
 */
const ACCOUNT_WINDOW_MS = 60 * 60 * 1000;
const ACCOUNT_FAILURES_MAX = 20;
let accountFailures = []; // timestamps

export function accountLocked(now = Date.now()) {
  accountFailures = accountFailures.filter((t) => now - t < ACCOUNT_WINDOW_MS);
  return accountFailures.length >= ACCOUNT_FAILURES_MAX;
}

export function recordFailedSignIn(now = Date.now()) {
  accountFailures.push(now);
  if (accountFailures.length === ACCOUNT_FAILURES_MAX) {
    console.warn(`[rate-limit] ${ACCOUNT_FAILURES_MAX} failed sign-ins within an hour; sign-in paused`);
  }
}

/** Changing the sign-in email or password: 5 attempts per 15 minutes. */
export const credentialsLimiter = rateLimit({
  name: 'credentials',
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many attempts. Please wait 15 minutes and try again.',
});
