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
  // Two-step sign-in (2026-11-22, config/totp.js). The secret is stored
  // sealed (AES-256-GCM); `totpPending` holds a new secret between setup and
  // the first correct code. `totpLastStep` stops a code being used twice.
  // Recovery codes are SHA-256 hashes, each removed when used. None of this
  // is ever sent to a client.
  totpEnabled: { type: Boolean, default: false },
  totpSecret: { type: String, default: '' },
  totpPending: { type: String, default: '' },
  totpLastStep: { type: Number, default: -1 },
  recoveryCodes: { type: [String], default: [] }
}, { timestamps: true });

export default mongoose.model('AdminUser', adminUserSchema);
