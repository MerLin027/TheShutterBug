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
  
  try {
    const user = await AdminUser.findOne({ email });

    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      res.json({
        _id: user._id,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
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
