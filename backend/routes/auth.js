import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import AdminUser from '../models/AdminUser.js';
import { protect } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/rateLimit.js';

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
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: TOKEN_LIFETIME,
  });
};

// A real bcrypt hash of a random string, at the same cost as stored hashes
// (scripts/seedAdmin.js). Compared against when the email matches no
// account, so an unknown email takes as long as a wrong password and the
// response time doesn't reveal which emails exist (D3).
const DUMMY_HASH = bcrypt.hashSync(Math.random().toString(36), 12);

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

  const user = await AdminUser.findOne({ email });

  // bcrypt runs on every attempt: against the account's hash, or the dummy
  // one when there is no account, so both answers take the same time.
  const passwordOk = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);

  // One message for both branches, deliberately: distinguishing "no such
  // account" from "wrong password" tells an attacker which emails are real.
  if (!user || !passwordOk) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  // passwordHash is never included in the response.
  res.json({
    _id: user._id,
    email: user.email,
    token: generateToken(user._id),
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
