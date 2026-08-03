/**
 * seedAdmin.js — One-time admin seeding script.
 *
 * Usage (from the backend/ directory):
 *   node scripts/seedAdmin.js
 *
 * Reads ADMIN_EMAIL and ADMIN_PASSWORD from the .env file (or the
 * environment), hashes the password with bcryptjs, and inserts one
 * AdminUser document into MongoDB.  Safe to re-run: exits early with
 * a message if an admin already exists, so you can't accidentally
 * create duplicates.
 */

import dotenv from 'dotenv';
dotenv.config(); // Load .env before any other import reads process.env

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import AdminUser from '../models/AdminUser.js';

const { MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

// ── Validate required env vars ───────────────────────────────────────────────
if (!MONGODB_URI) {
  console.error('❌  MONGODB_URI is not set. Aborting.');
  process.exit(1);
}
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('❌  ADMIN_EMAIL and ADMIN_PASSWORD must both be set. Aborting.');
  process.exit(1);
}

// ── Connect to MongoDB ───────────────────────────────────────────────────────
try {
  await mongoose.connect(MONGODB_URI);
  console.log('✅  Connected to MongoDB.');
} catch (err) {
  console.error('❌  MongoDB connection failed:', err.message);
  process.exit(1);
}

// ── Idempotency check ────────────────────────────────────────────────────────
const existing = await AdminUser.findOne({ email: ADMIN_EMAIL.toLowerCase().trim() });
if (existing) {
  console.log(`ℹ️   Admin already exists for ${ADMIN_EMAIL}. No changes made.`);
  await mongoose.disconnect();
  process.exit(0);
}

// ── Hash password and insert ─────────────────────────────────────────────────
const SALT_ROUNDS = 12;
const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);

await AdminUser.create({
  email: ADMIN_EMAIL.toLowerCase().trim(),
  passwordHash,
});

console.log(`✅  Admin user created for ${ADMIN_EMAIL}.`);
await mongoose.disconnect();
