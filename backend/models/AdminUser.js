import mongoose from 'mongoose';

const adminUserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  // Bumped whenever the email or password changes. Every token carries the
  // version it was issued at, and middleware/auth.js refuses a token whose
  // version is stale, so a credentials change signs out every other session
  // (a stolen token dies with the old password). Tokens from before this
  // field existed carry no version and count as 0.
  tokenVersion: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

export default mongoose.model('AdminUser', adminUserSchema);
