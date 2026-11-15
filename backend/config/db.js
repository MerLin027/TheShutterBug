import mongoose from 'mongoose';

/**
 * Connect to MongoDB, and keep trying (Phase D7).
 *
 * This used to `process.exit(1)` on the first failure. On Render that turned
 * a database blip into a crash loop: the service restarted, failed again,
 * and /api/health (which the keep-alive cron relies on) went down with it.
 * Now the process stays up, health keeps answering (and reports the DB
 * state), and the connection is retried with backoff: 5 s, 10 s, 20 s ...
 * capped at 5 minutes.
 *
 * Once connected, mongoose reconnects by itself after drops.
 */
const MAX_DELAY_MS = 5 * 60 * 1000;

export const connectDB = async (attempt = 0) => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10_000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    const delay = Math.min(5000 * 2 ** attempt, MAX_DELAY_MS);
    console.error(
      `Error connecting to MongoDB (attempt ${attempt + 1}): ${error.message}. Retrying in ${delay / 1000}s`
    );
    setTimeout(() => connectDB(attempt + 1), delay);
  }
};

const STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

/** 'connected' | 'connecting' | 'disconnected' | 'disconnecting' */
export function dbState() {
  return STATES[mongoose.connection.readyState] ?? 'unknown';
}
