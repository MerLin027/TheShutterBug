import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import AdminUser from '../models/AdminUser.js';
import { protect } from '../middleware/auth.js';
import {
  loginLimiter,
  credentialsLimiter,
  accountLocked,
  recordFailedSignIn,
} from '../middleware/rateLimit.js';
import { EMAIL_REGEX } from '../models/Contact.js';

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
// `v` is the account's tokenVersion at issue time (see models/AdminUser.js).
const generateToken = (user) => {
  return jwt.sign({ id: user._id, v: user.tokenVersion ?? 0 }, process.env.JWT_SECRET, {
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

/** New-password rule: length is what matters (NIST SP 800-63B). */
export const PASSWORD_MIN = 12;
const PASSWORD_MAX = 200;

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
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  // passwordHash is never included in the response.
  res.json({
    _id: user._id,
    email: user.email,
    token: generateToken(user),
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
    if (newPassword.length > PASSWORD_MAX) {
      return res.status(400).json({ message: `The new password must be ${PASSWORD_MAX} characters or fewer` });
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
    await user.save();
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: 'That email is already in use' });
    }
    throw err;
  }

  console.log(`[auth] credentials changed (${[emailChanged && 'email', passwordChanged && 'password'].filter(Boolean).join(' + ')}); other sessions signed out`);

  res.json({ email: user.email, token: generateToken(user) });
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
