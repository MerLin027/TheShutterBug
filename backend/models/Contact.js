import mongoose from 'mongoose';

/**
 * Exported so the route and the schema validate identically. The same regex
 * was written out twice — here and in routes/contact.js — which is two places
 * to change and one place to forget.
 */
export const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

/** Length caps; the contact form enforces the same in the browser. */
export const CONTACT_MAX = { name: 100, email: 254, message: 5000 };

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [CONTACT_MAX.name, `Name must be ${CONTACT_MAX.name} characters or fewer`],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    maxlength: [CONTACT_MAX.email, `Email must be ${CONTACT_MAX.email} characters or fewer`],
    match: [EMAIL_REGEX, 'Please enter a valid email address'],
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [CONTACT_MAX.message, `Message must be ${CONTACT_MAX.message} characters or fewer`],
  },
}, { timestamps: true });

export default mongoose.model('Contact', contactSchema);
