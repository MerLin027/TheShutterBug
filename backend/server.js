// env.js MUST be the first import so dotenv.config() runs before any other
// module-level code reads from process.env (e.g. cloudinary.config() in config/cloudinary.js).
import './config/env.js';

import express from 'express';
import cors from 'cors';
import { connectDB, dbState } from './config/db.js';
import { securityHeaders } from './middleware/securityHeaders.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.js';
import photoRoutes from './routes/photos.js';
import contactRoutes from './routes/contact.js';
import siteContentRoutes from './routes/siteContent.js';

// Connect to database
connectDB();

const app = express();

// Render terminates TLS at one proxy hop. Trusting exactly one hop makes
// req.ip the visitor's address (the rate limiter keys on it) without letting
// a client spoof it through extra X-Forwarded-For entries.
app.set('trust proxy', 1);

// Don't advertise the framework (D2).
app.disable('x-powered-by');
app.use(securityHeaders);

// Middleware
//
// CORS allowlist. The deployed frontend is always allowed; localhost is added
// only outside production so `npm run dev` can talk to this API directly.
// Without the dev entry every client-side Studio call (upload, edit, featured
// toggle, account save) is blocked by the browser and can only be tested
// against a deployed build.
//
// No `credentials` flag — auth travels as an Authorization: Bearer header,
// not a cookie.
const allowedOrigins = ['https://the-shutter-bug.vercel.app'];
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:3000');
}

app.use(cors({ origin: allowedOrigins }));
// 100 kB is far above the largest legitimate body (a 5000-character
// message, or the About copy) and keeps oversized payloads out.
app.use(express.json({ limit: '100kb' }));
// Express 5 leaves req.body undefined when no parser ran (no body, or a
// Content-Type other than JSON), and every route destructures it, so a
// text/plain POST answered 500 instead of the route's own 400 (2026-11-21
// audit, measured live). multer replaces this on its multipart routes.
app.use((req, res, next) => {
  if (req.body === undefined) req.body = {};
  next();
});

// Health check. Deliberately no DB query — it must answer 200 while Atlas is
// unreachable, or the keep-alive ping would report the service as down
// whenever the database blips. It does report the connection state (D7), so
// an outage is visible at a glance without failing the ping.
//
// Registered at BOTH paths on purpose. These were two separate handlers with
// two different response bodies; the cron-job.org keep-alive that stops Render
// idling points at one of them, and that configuration lives outside this
// repo, so neither path can be safely deleted. One handler, two mounts.
// (2026-11-21: the owner says there is no cron job; the cold start measured
// 32.7 s. .github/workflows/keep-alive.yml now pings /api/health.)
const health = (req, res) => res.status(200).json({ status: 'ok', db: dbState() });
app.get('/api/health', health);
app.get('/health', health);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/site-content', siteContentRoutes);

// Unmatched path → JSON 404, matching every other response on this API.
app.use(notFound);

// Must be last. See middleware/errorHandler.js for why routes no longer
// carry their own try/catch.
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
