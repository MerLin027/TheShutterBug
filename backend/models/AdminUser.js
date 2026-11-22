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
  },
  // Signed-in sessions (2026-11-22; OWASP session management). Every token
  // names one by `sid`; middleware/auth.js refuses a token whose session is
  // gone (signed out) or idle for over a day. Kept short: at most
  // MAX_SESSIONS in config/sessions.js, pruned on each sign-in.
  sessions: {
    type: [{
      _id: false,
      sid: { type: String, required: true },
      createdAt: { type: Date, required: true },
      lastSeen: { type: Date, required: true },
    }],
    default: [],
  }
}, { timestamps: true });

export default mongoose.model('AdminUser', adminUserSchema);
