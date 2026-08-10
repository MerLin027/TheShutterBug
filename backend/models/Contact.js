import mongoose from 'mongoose';

/**
 * Exported so the route and the schema validate identically. The same regex
 * was written out twice — here and in routes/contact.js — which is two places
 * to change and one place to forget.
 */
export const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    match: [EMAIL_REGEX, 'Please enter a valid email address'],
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
  },
}, { timestamps: true });

export default mongoose.model('Contact', contactSchema);
