import express from 'express';
import Contact, { EMAIL_REGEX } from '../models/Contact.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/contact
// @desc    Submit a new contact message
// @access  Public
router.post('/', async (req, res) => {
  const { name, email, message } = req.body;

  // Checked here as well as in the schema so the caller gets one clear
  // message instead of a joined list of Mongoose validator output. A
  // ValidationError that slips past this is still mapped to a 400 by
  // middleware/errorHandler.js.
  if (!name || !email || !message) {
    return res.status(400).json({ message: 'Name, email, and message are required' });
  }

  // Same regex object the schema validates with — see models/Contact.js.
  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ message: 'Please enter a valid email address' });
  }

  const newContact = await Contact.create({ name, email, message });

  res.status(201).json(newContact);
});

// @route   GET /api/contact
// @desc    Get all contact messages (newest first)
// @access  Private (Admin only)
router.get('/', protect, async (req, res) => {
  const messages = await Contact.find({}).sort({ createdAt: -1 });
  res.status(200).json(messages);
});

// @route   DELETE /api/contact/:id
// @desc    Delete a contact message
// @access  Private (Admin only)
//
// Added in Stage 4. There was no way to remove a message from anywhere in the
// app: the inbox only ever grew, and a single test submission would have sat
// in it permanently — which is why the contact round-trip went unverified
// through Stage 3.
//
// Shaped deliberately like DELETE /api/photos/:id minus the Cloudinary step:
// same `protect`, same find-then-404, same response body. A malformed id
// throws a CastError that errorHandler answers with a 400.
router.delete('/:id', protect, async (req, res) => {
  const message = await Contact.findById(req.params.id);

  if (!message) {
    return res.status(404).json({ message: 'Message not found' });
  }

  await message.deleteOne();

  res.json({ message: 'Message removed' });
});

export default router;
