import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import AdminUser from '../models/AdminUser.js';

const router = express.Router();

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @route   POST /api/auth/login
// @desc    Auth user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Reject a malformed body before any DB or bcrypt call.
  //
  // Two things went wrong without this. bcrypt.compare(undefined, hash) throws,
  // so POSTing `{}` answered 500 for what is plainly a 400. And Mongoose strips
  // undefined from a query filter, so findOne({ email: undefined }) degraded to
  // findOne({}) and returned the first admin — the password still had to match,
  // so there was no bypass, but login should not answer for an account the
  // caller never named.
  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = await AdminUser.findOne({ email });

  // One message for both branches, deliberately: distinguishing "no such
  // account" from "wrong password" tells an attacker which emails are real.
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  // passwordHash is never included in the response.
  res.json({
    _id: user._id,
    email: user.email,
    token: generateToken(user._id),
  });
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
