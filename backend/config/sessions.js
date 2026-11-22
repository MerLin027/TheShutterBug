import crypto from 'node:crypto';

/**
 * Studio sessions (2026-11-22; OWASP session management, audit F1 + F3).
 *
 * A token is a 7-day JWT (routes/auth.js), but it is only honoured while the
 * session it names exists on the account and has been used within the last
 * day (middleware/auth.js):
 *
 * - "Sign out" deletes the session, so the token is dead at once. It used
 *   to stay valid for up to 7 days after signing out.
 * - A session unused for SESSION_IDLE_MS ends by itself; using the Studio
 *   keeps it alive, up to the token's 7 days.
 * - "Sign out everywhere", a password/email change, or turning two-step
 *   sign-in on or off ends every other session.
 */

// ── The cookie (audit F2) ──────────────────────────────────────────────────
//
// The browser reaches the API through the site's own domain (next.config.ts
// rewrites /api/* to Render), so this cookie is first-party to the site.
// - __Host- prefix: the browser only accepts it with Secure, Path=/ and no
//   Domain, so no other host (or subdomain) can set or overwrite it.
// - HttpOnly: page scripts can't read it, so an injected script can't steal
//   the session (it sat in localStorage before).
// - SameSite=Strict: never sent on a request another site starts (CSRF);
//   server.js also refuses any state-changing request from another origin.
// Browsers accept Secure cookies on http://localhost, so local runs work.

export const SESSION_COOKIE = '__Host-sb_session';
/** The JWT's lifetime; the cookie lives as long. */
export const TOKEN_LIFETIME = '7d';

export function setSessionCookie(res, token) {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_MAX_MS,
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, { httpOnly: true, secure: true, sameSite: 'strict', path: '/' });
}

/** The session cookie's value, or null. No cookie-parser dependency needed. */
export function readSessionCookie(req) {
  const header = req.headers.cookie;
  if (typeof header !== 'string' || header.length > 8192) return null;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i === -1) continue;
    if (part.slice(0, i).trim() === SESSION_COOKIE) {
      const value = part.slice(i + 1).trim();
      return value && value.length <= 4096 ? value : null;
    }
  }
  return null;
}

/** A session unused this long is over. */
export const SESSION_IDLE_MS = 24 * 60 * 60 * 1000;
/** The token's own lifetime: no session outlives it. */
export const SESSION_MAX_MS = 7 * 24 * 60 * 60 * 1000;
/** lastSeen is written at most this often (one DB write per 5 min of use). */
export const SEEN_WRITE_INTERVAL_MS = 5 * 60 * 1000;
/** Browsers signed in at once; the oldest is dropped beyond this. */
export const MAX_SESSIONS = 10;

/**
 * Add a session to `user` (not saved: the caller saves) and return its id.
 * Ended sessions are pruned first. `only: true` drops every other session.
 */
export function startSession(user, { only = false } = {}) {
  const now = Date.now();
  const alive = only
    ? []
    : (user.sessions || []).filter(
        (s) => now - new Date(s.lastSeen).getTime() <= SESSION_IDLE_MS &&
          now - new Date(s.createdAt).getTime() <= SESSION_MAX_MS
      );
  const sid = crypto.randomBytes(16).toString('base64url');
  alive.push({ sid, createdAt: new Date(now), lastSeen: new Date(now) });
  user.sessions = alive.slice(-MAX_SESSIONS);
  return sid;
}
