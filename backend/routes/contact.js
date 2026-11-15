import express from 'express';
import Contact, { EMAIL_REGEX, CONTACT_MAX } from '../models/Contact.js';
import { contactLimiter } from '../middleware/rateLimit.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/contact
// @desc    Submit a new contact message
// @access  Public
router.post('/', contactLimiter, async (req, res) => {
  const { name, email, message, website } = req.body;

  // Honeypot (D4). The form has a `website` field that people never see or
  // fill; form-filling bots do. Answer exactly as a success would, so the bot
  // learns nothing, and store nothing.
  if (typeof website === 'string' && website.trim() !== '') {
    return res.status(201).json({ message: 'Message received' });
  }

  // Strings only. An object or array here used to reach Mongoose, which
  // either cast it oddly or threw a 500.
  if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string') {
    return res.status(400).json({ message: 'Name, email, and message are required' });
  }

  const fields = { name: name.trim(), email: email.trim(), message: message.trim() };

  // Checked here as well as in the schema so the caller gets one clear
  // message instead of a joined list of Mongoose validator output.
  if (!fields.name || !fields.email || !fields.message) {
    return res.status(400).json({ message: 'Name, email, and message are required' });
  }
  for (const [key, max] of Object.entries(CONTACT_MAX)) {
    if (fields[key].length > max) {
      return res.status(400).json({ message: `${key[0].toUpperCase()}${key.slice(1)} must be ${max} characters or fewer` });
    }
  }

  // Same regex object the schema validates with — see models/Contact.js.
  if (!EMAIL_REGEX.test(fields.email)) {
    return res.status(400).json({ message: 'Please enter a valid email address' });
  }

  await Contact.create(fields);

  // Only an acknowledgement goes back — echoing the stored document handed
  // its _id and timestamps to an anonymous caller for no reason.
  res.status(201).json({ message: 'Message received' });
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
