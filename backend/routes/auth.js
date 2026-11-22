import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import AdminUser from '../models/AdminUser.js';
import { protect } from '../middleware/auth.js';
import {
  loginLimiter,
  codeLimiter,
  credentialsLimiter,
  accountLocked,
  recordFailedSignIn,
} from '../middleware/rateLimit.js';
import { securityEvent } from '../middleware/securityLog.js';
import { EMAIL_REGEX } from '../models/Contact.js';
import { startSession } from '../config/sessions.js';
import {
  generateSecret,
  verifyCode,
  otpauthUrl,
  sealSecret,
  openSecret,
  generateRecoveryCodes,
  hashRecoveryCode,
  looksLikeRecoveryCode,
} from '../config/totp.js';

const router = express.Router();

// Session length. Was 30 days (D5, 2026-11-15): the token sits in
// localStorage, so a stolen one was good for a month. A week keeps the
// owner from signing in daily while bounding that window. Moving the token
// to an httpOnly cookie would close it properly; that needs the API and the
// site on one domain (they're on onrender.com and vercel.app), so it is
// recorded in REDESIGN.md as a follow-up rather than done here.
const TOKEN_LIFETIME = '7d';

// Generate JWT. HS256 is pinned on both sides (here and in middleware/auth.js)
// so a token can't name a different algorithm.
// `v` is the account's tokenVersion at issue time (see models/AdminUser.js);
// `sid` names the session (config/sessions.js), which signing out deletes.
// Starts a session on `user` and SAVES it, so call it last.
const issueSession = async (user, { only = false } = {}) => {
  const sid = startSession(user, { only });
  await user.save();
  return jwt.sign({ id: user._id, v: user.tokenVersion ?? 0, sid }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: TOKEN_LIFETIME,
  });
};

// A real bcrypt hash of a random string, at the same cost as stored hashes
// (scripts/seedAdmin.js). Compared against when the email matches no
// account, so an unknown email takes as long as a wrong password and the
// response time doesn't reveal which emails exist (D3).
const SALT_ROUNDS = 12;
const DUMMY_HASH = bcrypt.hashSync(Math.random().toString(36), SALT_ROUNDS);

/**
 * The half-way token between the password step and the code step: it names
 * the account and proves the password was right, lives five minutes, and
 * middleware/auth.js refuses it as a session (it carries `purpose`).
 */
const CODE_STEP_LIFETIME = '5m';
const generateCodeStepToken = (user) =>
  jwt.sign({ id: user._id, v: user.tokenVersion ?? 0, purpose: 'second-step' }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: CODE_STEP_LIFETIME,
  });

/**
 * Check a second-step code: a 6-digit authenticator code, or one of the
 * recovery codes. On success the user document is updated (the code's time
 * step recorded so it can't be replayed, or the recovery code removed) and
 * the caller must save it. Returns 'code' | 'recovery' | null.
 */
function checkSecondFactor(user, code) {
  if (typeof code !== 'string') return null;
  const trimmed = code.trim().replace(/\s+/g, '');
  if (/^\d{6}$/.test(trimmed)) {
    const secret = openSecret(user.totpSecret);
    if (!secret) return null;
    const step = verifyCode(secret, trimmed, user.totpLastStep ?? -1);
    if (step === null) return null;
    user.totpLastStep = step;
    return 'code';
  }
  if (looksLikeRecoveryCode(trimmed)) {
    const i = user.recoveryCodes.indexOf(hashRecoveryCode(trimmed));
    if (i === -1) return null;
    user.recoveryCodes.splice(i, 1);
    return 'recovery';
  }
  return null;
}

/** New-password rule: length is what matters (NIST SP 800-63B). */
export const PASSWORD_MIN = 12;
/** Longest input accepted at all (sign-in, current password). */
const PASSWORD_MAX = 200;
/** What bcrypt actually checks; a new password must fit inside it. */
const BCRYPT_MAX_BYTES = 72;

// @route   POST /api/auth/login
// @desc    Auth user & get token
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
      email.length > 254 || password.length > 200) {
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

  // Two-step sign-in on: the password alone doesn't open the Studio. Hand
  // back a five-minute token for the code step instead of a session.
  if (user.totpEnabled) {
    securityEvent(req, 'login.code_required');
    return res.json({ codeRequired: true, codeToken: generateCodeStepToken(user) });
  }

  securityEvent(req, 'login.succeeded', { secondStep: false });
  const token = await issueSession(user);
  // passwordHash is never included in the response.
  res.json({
    _id: user._id,
    email: user.email,
    token,
  });
});

// @route   POST /api/auth/login/verify
// @desc    Second sign-in step: the authenticator code (or a recovery code)
// @access  Public, with the five-minute token from a correct password
//
// Body: { codeToken, code }
router.post('/login/verify', codeLimiter, async (req, res) => {
  const { codeToken, code } = req.body;
  if (typeof codeToken !== 'string' || typeof code !== 'string' || codeToken.length > 2048 || code.length > 40) {
    return res.status(400).json({ message: 'Enter the code from your authenticator app' });
  }
  if (accountLocked()) {
    securityEvent(req, 'login.paused');
    return res.status(429).json({
      message: 'Too many failed sign-ins. Sign-in is paused; please try again within the hour.',
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(codeToken, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    return res.status(401).json({ message: 'That sign-in took too long. Please start again.', restart: true });
  }
  if (decoded.purpose !== 'second-step') {
    return res.status(401).json({ message: 'Please start again.', restart: true });
  }

  const user = await AdminUser.findById(decoded.id);
  if (!user || !user.totpEnabled || (decoded.v ?? 0) !== (user.tokenVersion ?? 0)) {
    return res.status(401).json({ message: 'Please start again.', restart: true });
  }

  const used = checkSecondFactor(user, code);
  if (!used) {
    recordFailedSignIn();
    securityEvent(req, 'login.code_failed');
    return res.status(401).json({ message: "That code didn't work. Check your app and try again." });
  }
  const token = await issueSession(user); // also saves the used code / step

  if (used === 'recovery') {
    securityEvent(req, '2fa.recovery_code_used', { left: user.recoveryCodes.length });
  }
  securityEvent(req, 'login.succeeded', { secondStep: used });
  res.json({
    _id: user._id,
    email: user.email,
    token,
    ...(used === 'recovery' ? { recoveryCodesLeft: user.recoveryCodes.length } : {}),
  });
});

// @route   GET /api/auth/me
// @desc    Who is this token for? (200 with the email, or 401)
// @access  Private
//
// Lets the site's server confirm a token before acting on it: the
// revalidatePublicPages Server Action is a public endpoint and only purges
// the cache for a caller whose token passes here (D9).
router.get('/me', protect, (req, res) => {
  res.json({ email: req.user.email });
});

// @route   PUT /api/auth/credentials
// @desc    Change the sign-in email and/or password
// @access  Private, and the current password is required
//
// Body: { currentPassword, email?, newPassword? }
//
// - The current password is asked for again even though the caller holds a
//   valid token: a token left in an unattended browser (or stolen from
//   localStorage) must not be enough to take the account over.
// - A wrong current password answers 403, not 401: the Studio treats 401 as
//   "session over" and signs the owner out, which a typo shouldn't do.
// - Any change bumps tokenVersion, which signs out every other session; the
//   caller gets a fresh token so this one carries on.
// - Rate-limited like login, so the current-password check can't be used to
//   guess the password from a stolen token.
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

  // A credentials change ends every other session; this one gets a fresh one.
  let token;
  try {
    token = await issueSession(user, { only: true });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: 'That email is already in use' });
    }
    throw err;
  }

  securityEvent(req, 'credentials.changed', {
    changed: [emailChanged && 'email', passwordChanged && 'password'].filter(Boolean).join(' + '),
  });

  res.json({ email: user.email, token });
});

// -- Two-step sign-in management (Studio -> Account) --------------------------
//
// Every change here needs the current password (and turning it off needs a
// code as well), is rate-limited like a credentials change, and bumps
// tokenVersion, which signs out every other browser.

/** Wrong current password -> 403 (not 401: a typo mustn't sign the owner out). */
async function userWithPassword(req, res) {
  const { currentPassword } = req.body;
  if (typeof currentPassword !== 'string' || !currentPassword || currentPassword.length > PASSWORD_MAX) {
    res.status(400).json({ message: 'Enter your current password' });
    return null;
  }
  const user = await AdminUser.findById(req.user._id);
  if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
    securityEvent(req, '2fa.failed', { reason: 'wrong current password' });
    res.status(403).json({ message: 'Your current password is incorrect' });
    return null;
  }
  return user;
}

// @route   GET /api/auth/2fa
// @desc    Is two-step sign-in on, and how many recovery codes are left?
// @access  Private
router.get('/2fa', protect, async (req, res) => {
  const user = await AdminUser.findById(req.user._id).select('totpEnabled recoveryCodes');
  res.json({ enabled: !!user?.totpEnabled, recoveryCodesLeft: user?.recoveryCodes?.length ?? 0 });
});

// @route   POST /api/auth/2fa/setup
// @desc    Start turning it on: a new secret for the authenticator app
// @access  Private + current password. Body: { currentPassword }
router.post('/2fa/setup', credentialsLimiter, protect, async (req, res) => {
  const user = await userWithPassword(req, res);
  if (!user) return;
  if (user.totpEnabled) {
    return res.status(409).json({ message: 'Two-step sign-in is already on' });
  }
  const secret = generateSecret();
  user.totpPending = sealSecret(secret);
  await user.save();
  securityEvent(req, '2fa.setup_started');
  // The secret goes to the signed-in owner once, to put in their app.
  res.json({ secret, otpauthUrl: otpauthUrl(secret, user.email) });
});

// @route   POST /api/auth/2fa/enable
// @desc    Finish turning it on: the first code from the app proves it works
// @access  Private. Body: { code }
router.post('/2fa/enable', credentialsLimiter, protect, async (req, res) => {
  const user = await AdminUser.findById(req.user._id);
  if (!user?.totpPending) {
    return res.status(400).json({ message: 'Start again: set up the authenticator app first' });
  }
  const { code } = req.body;
  if (typeof code !== 'string' || !/^\d{6}$/.test(code.trim())) {
    return res.status(400).json({ message: 'Enter the 6-digit code from your app' });
  }
  const pending = openSecret(user.totpPending);
  const step = pending ? verifyCode(pending, code.trim(), -1) : null;
  if (step === null) {
    securityEvent(req, '2fa.failed', { reason: 'wrong code while turning on' });
    return res.status(400).json({ message: "That code didn't work. Check the app's clock and try the newest code." });
  }

  const recoveryCodes = generateRecoveryCodes();
  user.totpSecret = user.totpPending;
  user.totpPending = '';
  user.totpEnabled = true;
  user.totpLastStep = step;
  user.recoveryCodes = recoveryCodes.map(hashRecoveryCode);
  user.tokenVersion = (user.tokenVersion ?? 0) + 1;
  const token = await issueSession(user, { only: true });

  securityEvent(req, '2fa.enabled');
  // The recovery codes are shown once and never again (only hashes are kept).
  res.json({ enabled: true, recoveryCodes, token });
});

// @route   POST /api/auth/2fa/disable
// @desc    Turn it off
// @access  Private + current password + a code (or recovery code).
//          Body: { currentPassword, code }
router.post('/2fa/disable', credentialsLimiter, protect, async (req, res) => {
  const user = await userWithPassword(req, res);
  if (!user) return;
  if (!user.totpEnabled) {
    return res.status(409).json({ message: 'Two-step sign-in is already off' });
  }
  if (!checkSecondFactor(user, req.body.code)) {
    securityEvent(req, '2fa.failed', { reason: 'wrong code while turning off' });
    return res.status(400).json({ message: "That code didn't work. Use a current code from your app, or a recovery code." });
  }
  user.totpEnabled = false;
  user.totpSecret = '';
  user.totpPending = '';
  user.totpLastStep = -1;
  user.recoveryCodes = [];
  user.tokenVersion = (user.tokenVersion ?? 0) + 1;
  const token = await issueSession(user, { only: true });

  securityEvent(req, '2fa.disabled');
  res.json({ enabled: false, token });
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
// @desc    Sign out: delete this session on the server, so the token is dead
// @access  Private
router.post('/logout', protect, async (req, res) => {
  await AdminUser.updateOne({ _id: req.user._id }, { $pull: { sessions: { sid: req.sessionId } } });
  securityEvent(req, 'logout');
  res.json({ message: 'Signed out' });
});

// @route   POST /api/auth/logout-all
// @desc    Sign out everywhere: every session, this one included
// @access  Private
router.post('/logout-all', protect, async (req, res) => {
  await AdminUser.updateOne({ _id: req.user._id }, { $set: { sessions: [] }, $inc: { tokenVersion: 1 } });
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
