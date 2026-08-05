import express from 'express';
import Contact from '../models/Contact.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/contact
// @desc    Submit a new contact message
// @access  Public
router.post('/', async (req, res, next) => {
  try {
    const { name, email, message } = req.body;

    // Basic validation (also handled by Mongoose schema)
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email, and message are required' });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    const newContact = await Contact.create({
      name,
      email,
      message
    });

    res.status(201).json(newContact);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    next(error);
  }
});

// @route   GET /api/contact
// @desc    Get all contact messages (newest first)
// @access  Private (Admin only)
router.get('/', protect, async (req, res, next) => {
  try {
    const messages = await Contact.find({}).sort({ createdAt: -1 });
    res.status(200).json(messages);
  } catch (error) {
    next(error);
  }
});

export default router;
