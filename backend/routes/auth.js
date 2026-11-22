import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import AdminUser from '../models/AdminUser.js';
import { protect } from '../middleware/auth.js';
import { loginLimiter, credentialsLimiter, accountLocked, recordFailedSignIn } from '../middleware/rateLimit.js';
import { securityEvent } from '../middleware/securityLog.js';
import { EMAIL_REGEX } from '../models/Contact.js';
import { startSession, setSessionCookie, clearSessionCookie, TOKEN_LIFETIME } from '../config/sessions.js';

const router = express.Router();

// Every answer here is about a session (it sets, reads or clears the cookie),
// so none may be cached (S2, as in middleware/auth.js).
router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, private');
  next();
});

// The session is a JWT in an httpOnly, Secure, SameSite=Strict cookie
// (audit F2, 2026-11-22; config/sessions.js). It used to be returned in the
// response body and kept in localStorage, where any script on the page could
// read it. No response carries the token now.
//
// HS256 is pinned on both sides (here and in middleware/auth.js) so a token
// can't name a different algorithm. `v` is the account's tokenVersion at
// issue time (models/AdminUser.js); `sid` names the session, which signing
// out deletes.
//
// Starts a session on `user`, SAVES the user, and sets the cookie; call it last.
async function issueSession(res, user, { only = false } = {}) {
  const sid = startSession(user, { only });
  await user.save();
  const token = jwt.sign({ id: user._id, v: user.tokenVersion ?? 0, sid }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: TOKEN_LIFETIME,
  });
  setSessionCookie(res, token);
}

// A real bcrypt hash of a random string, at the same cost as stored hashes
// (scripts/seedAdmin.js). Compared against when the email matches no
// account, so an unknown email takes as long as a wrong password and the
// response time doesn't reveal which emails exist (D3).
const SALT_ROUNDS = 12;
const DUMMY_HASH = bcrypt.hashSync(Math.random().toString(36), SALT_ROUNDS);

/** New-password rule: length is what matters (NIST SP 800-63B). */
export const PASSWORD_MIN = 12;
/** Longest input accepted at all (sign-in, current password). */
const PASSWORD_MAX = 200;
/** What bcrypt actually checks; a new password must fit inside it. */
const BCRYPT_MAX_BYTES = 72;

// @route   POST /api/auth/login
// @desc    Sign in: sets the session cookie
// @access  Public
router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;

  // Reject a malformed body before any DB or bcrypt call.
  //
  // Two things went wrong without this. bcrypt.compare(undefined, hash) throws,
  // so POSTing `{}` answered 500 for what is plainly a 400. And Mongoose strips
  // undefined from a query filter, so findOne({ email: undefined }) degraded to
  // findOne({}) and returned the first admin — the password still had to match,
  // so there was no bypass, but login should not answer for an account the
  // caller never named.
  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password ||
      email.length > 254 || password.length > PASSWORD_MAX) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  if (accountLocked()) {
    securityEvent(req, 'login.paused');
    return res.status(429).json({
      message: 'Too many failed sign-ins. Sign-in is paused; please try again within the hour.',
    });
  }

  const user = await AdminUser.findOne({ email });

  // bcrypt runs on every attempt: against the account's hash, or the dummy
  // one when there is no account, so both answers take the same time.
  const passwordOk = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);

  // One message for both branches, deliberately: distinguishing "no such
  // account" from "wrong password" tells an attacker which emails are real.
  if (!user || !passwordOk) {
    recordFailedSignIn();
    securityEvent(req, 'login.failed', { reason: user ? 'wrong password' : 'unknown email' });
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  await issueSession(res, user);
  securityEvent(req, 'login.succeeded');
  // passwordHash and the token are never included in the response.
  res.json({ email: user.email });
});

// @route   GET /api/auth/me
// @desc    Who is this session for? (200 with the email, or 401)
// @access  Private
//
// The Studio asks this on load to know whether it is signed in (the cookie
// can't be read by script). The revalidatePublicPages Server Action also
// forwards the cookie here and only purges the cache when it passes (D9).
router.get('/me', protect, (req, res) => {
  res.json({ email: req.user.email });
});

// @route   PUT /api/auth/credentials
// @desc    Change the sign-in email and/or password
// @access  Private, and the current password is required
//
// Body: { currentPassword, email?, newPassword? }
//
// - The current password is asked for again even though the caller has a
//   valid session: a browser left unattended must not be enough to take the
//   account over.
// - A wrong current password answers 403, not 401: the Studio treats 401 as
//   "session over" and signs the owner out, which a typo shouldn't do.
// - Any change bumps tokenVersion and keeps only a fresh session for this
//   browser, which signs out every other one.
// - Rate-limited like login, so the current-password check can't be used to
//   guess the password from a hijacked session.
router.put('/credentials', credentialsLimiter, protect, async (req, res) => {
  const { currentPassword, email, newPassword } = req.body;

  if (typeof currentPassword !== 'string' || !currentPassword || currentPassword.length > PASSWORD_MAX) {
    return res.status(400).json({ message: 'Enter your current password' });
  }
  if (email !== undefined && typeof email !== 'string') {
    return res.status(400).json({ message: 'Email must be text' });
  }
  if (newPassword !== undefined && typeof newPassword !== 'string') {
    return res.status(400).json({ message: 'The new password must be text' });
  }

  const user = await AdminUser.findById(req.user._id);
  if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
    securityEvent(req, 'credentials.failed', { reason: 'wrong current password' });
    return res.status(403).json({ message: 'Your current password is incorrect' });
  }

  const nextEmail = typeof email === 'string' ? email.trim().toLowerCase() : user.email;
  const emailChanged = nextEmail !== user.email;
  const passwordChanged = typeof newPassword === 'string' && newPassword !== '';

  if (!emailChanged && !passwordChanged) {
    return res.status(400).json({ message: 'Nothing to change' });
  }

  if (emailChanged && (nextEmail.length > 254 || !EMAIL_REGEX.test(nextEmail))) {
    return res.status(400).json({ message: 'Please enter a valid email address' });
  }

  if (passwordChanged) {
    if (newPassword.length < PASSWORD_MIN) {
      return res.status(400).json({ message: `The new password must be at least ${PASSWORD_MIN} characters` });
    }
    // bcrypt reads only the first 72 bytes and silently ignores the rest, so
    // a longer passphrase was really just its first 72 bytes (2026-11-21
    // audit). Bytes, not characters: an accented letter or emoji is 2–4.
    if (Buffer.byteLength(newPassword, 'utf8') > BCRYPT_MAX_BYTES) {
      return res.status(400).json({ message: `The new password must be ${BCRYPT_MAX_BYTES} characters or fewer` });
    }
    if (newPassword.toLowerCase().includes(nextEmail.split('@')[0]) && nextEmail.split('@')[0].length >= 4) {
      return res.status(400).json({ message: "The new password can't contain your email name" });
    }
    if (await bcrypt.compare(newPassword, user.passwordHash)) {
      return res.status(400).json({ message: 'The new password is the same as the current one' });
    }
    user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  }

  if (emailChanged) user.email = nextEmail;
  user.tokenVersion = (user.tokenVersion ?? 0) + 1;

  try {
    await issueSession(res, user, { only: true });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: 'That email is already in use' });
    }
    throw err;
  }

  securityEvent(req, 'credentials.changed', {
    changed: [emailChanged && 'email', passwordChanged && 'password'].filter(Boolean).join(' + '),
  });

  res.json({ email: user.email });
});

// -- Sessions ------------------------------------------------------------------

// @route   GET /api/auth/sessions
// @desc    How many browsers are signed in (for Studio -> Account)
// @access  Private
router.get('/sessions', protect, async (req, res) => {
  const user = await AdminUser.findById(req.user._id).select('sessions');
  res.json({ count: user?.sessions?.length ?? 0 });
});

// @route   POST /api/auth/logout
// @desc    Sign out: delete this session on the server and clear the cookie
// @access  Private
router.post('/logout', protect, async (req, res) => {
  await AdminUser.updateOne({ _id: req.user._id }, { $pull: { sessions: { sid: req.sessionId } } });
  clearSessionCookie(res);
  securityEvent(req, 'logout');
  res.json({ message: 'Signed out' });
});

// @route   POST /api/auth/logout-all
// @desc    Sign out everywhere: every session, this one included
// @access  Private
router.post('/logout-all', protect, async (req, res) => {
  await AdminUser.updateOne({ _id: req.user._id }, { $set: { sessions: [] }, $inc: { tokenVersion: 1 } });
  clearSessionCookie(res);
  securityEvent(req, 'logout.everywhere');
  res.json({ message: 'Signed out everywhere' });
});

// There is deliberately no POST /register route.
//
// It existed as an ungated public endpoint, which meant anyone could mint an
// admin account and a valid 30-day token against the live API. Nothing in the
// frontend ever called it. Admin accounts are created out-of-band instead:
//
//   cd backend && node scripts/seedAdmin.js
//
// That script is idempotent and reads ADMIN_EMAIL / ADMIN_PASSWORD from the
// environment. If a self-serve route is ever needed again it must sit behind
// `protect` (or a one-time setup token), not be open to the internet.

export default router;
