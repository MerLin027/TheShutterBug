import jwt from 'jsonwebtoken';
import AdminUser from '../models/AdminUser.js';
import { securityEvent } from './securityLog.js';
import {
  SESSION_IDLE_MS,
  SEEN_WRITE_INTERVAL_MS,
  readSessionCookie,
  clearSessionCookie,
} from '../config/sessions.js';

/** Never loaded into req.user. */
const HIDDEN = '-passwordHash';

/**
 * The token's session must still exist and have been used within the last
 * day. Signing out deletes it, so a session stops working at once. Use
 * keeps it alive: lastSeen is refreshed, at most every few minutes to spare
 * the DB.
 */
async function sessionAlive(user, sid) {
  if (typeof sid !== 'string') return 'no session id (issued before sessions existed)';
  const session = user.sessions?.find((s) => s.sid === sid);
  if (!session) return 'signed out';
  const idle = Date.now() - new Date(session.lastSeen).getTime();
  if (idle > SESSION_IDLE_MS) return 'idle for over a day';
  if (idle > SEEN_WRITE_INTERVAL_MS) {
    await AdminUser.updateOne({ _id: user._id, 'sessions.sid': sid }, { $set: { 'sessions.$.lastSeen': new Date() } });
  }
  return null;
}

/**
 * The session comes ONLY from the httpOnly cookie (audit F2, 2026-11-22).
 * An Authorization: Bearer header is no longer accepted: a token that a
 * script could hold is exactly what this change removed.
 */
export const protect = async (req, res, next) => {
  // Nothing behind sign-in may be kept by any cache, browser or shared
  // (2026-11-22 system audit, S2): with no header of its own, a response
  // went out as Vercel's default "Cache-Control: public", which lets a
  // shared cache store, say, the messages list. Set first, so the 401s carry
  // it too.
  res.set('Cache-Control', 'no-store, private');

  const token = readSessionCookie(req);
  if (!token) {
    return res.status(401).json({ message: 'Not signed in' });
  }

  // A refused session also clears the cookie, so the browser stops sending
  // a dead one.
  const refuse = (reason) => {
    securityEvent(req, 'session.rejected', { reason });
    clearSessionCookie(res);
    return res.status(401).json({ message: 'Your session has ended. Please sign in again.' });
  };

  // Only a bad token is a 401. The database lookup used to sit inside this
  // same try, so an Atlas outage answered 401 and the Studio, which treats
  // 401 as "session over", signed the owner out (2026-11-21 audit). A DB
  // failure now reaches errorHandler as a 500 and the session survives it.
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch (err) {
    // Expired, malformed, wrong signature or algorithm.
    return refuse(err?.name === 'TokenExpiredError' ? 'expired' : 'invalid');
  }

  req.user = await AdminUser.findById(decoded.id).select(HIDDEN);
  if (!req.user) return refuse('user not found');

  // Issued before the last email/password change or "sign out everywhere".
  if ((decoded.v ?? 0) !== (req.user.tokenVersion ?? 0)) return refuse('signed out by an account change');

  const ended = await sessionAlive(req.user, decoded.sid);
  if (ended) return refuse(ended);

  req.sessionId = decoded.sid;
  return next();
};
