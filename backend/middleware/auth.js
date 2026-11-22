import jwt from 'jsonwebtoken';
import AdminUser from '../models/AdminUser.js';
import { securityEvent } from './securityLog.js';

/** Never loaded into req.user: hashes and two-step secrets. */
const HIDDEN = '-passwordHash -totpSecret -totpPending -recoveryCodes';

export const protect = async (req, res, next) => {
  let token;

  // Note the trailing space: 'Bearer' alone also matched 'Bearerxyz', which
  // then failed safely a step later (split(' ')[1] is undefined and jwt.verify
  // throws a 401) but for the wrong reason.
  if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  // Only a bad token is a 401. The database lookup used to sit inside this
  // same try, so an Atlas outage answered 401 "token failed" and the Studio,
  // which treats 401 as "session over", deleted a perfectly good token and
  // signed the owner out (2026-11-21 audit). A DB failure now reaches
  // errorHandler as a 500 and the session survives it.
  let decoded;
  try {
    token = req.headers.authorization.split(' ')[1];
    decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch (err) {
    // Expired, malformed, wrong signature or algorithm.
    securityEvent(req, 'token.rejected', { reason: err?.name === 'TokenExpiredError' ? 'expired' : 'invalid' });
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }

  // A half-signed-in token (password right, code not yet given) is only
  // good for POST /api/auth/login/verify, never as a session.
  if (decoded.purpose) {
    securityEvent(req, 'token.rejected', { reason: 'not a session token' });
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }

  req.user = await AdminUser.findById(decoded.id).select(HIDDEN);

  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized, user not found' });
  }

  // Issued before the last email/password change: signed out.
  if ((decoded.v ?? 0) !== (req.user.tokenVersion ?? 0)) {
    securityEvent(req, 'token.rejected', { reason: 'signed out by a credentials change' });
    return res.status(401).json({ message: 'Not authorized, session ended' });
  }

  return next();
};
