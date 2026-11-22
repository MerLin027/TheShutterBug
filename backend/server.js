// env.js MUST be the first import so dotenv.config() runs before any other
// module-level code reads from process.env (e.g. cloudinary.config() in config/cloudinary.js).
import './config/env.js';

import express from 'express';
import { connectDB, dbState } from './config/db.js';
import { securityHeaders } from './middleware/securityHeaders.js';
import { securityEvent } from './middleware/securityLog.js';
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

// The site's own origins (audit F2, 2026-11-22).
//
// No CORS any more. The browser reaches this API only through the site's
// own domain (next.config.ts rewrites /api/* here), so every call it makes
// is same-origin and needs no CORS headers; without them, no other website
// can read a response from this API in a visitor's browser. The site's own
// pages fetch from their server, which CORS never applies to.
const SITE_ORIGINS = ['https://the-shutter-bug.vercel.app'];
if (process.env.NODE_ENV !== 'production') {
  SITE_ORIGINS.push('http://localhost:3000');
}

// Cross-site request forgery guard. The session cookie is SameSite=Strict
// already (config/sessions.js); as a second lock, any request that changes
// something must come from the site itself. Browsers send Origin and
// Sec-Fetch-Site on such requests and a page can't forge them. A request
// with neither (a script or curl) carries no visitor's cookie, so it gains
// nothing from this API that it couldn't do anyway.
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
app.use((req, res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();
  const origin = req.headers.origin;
  const fetchSite = req.headers['sec-fetch-site'];
  if (fetchSite === 'cross-site' || fetchSite === 'same-site' || (origin && !SITE_ORIGINS.includes(origin))) {
    securityEvent(req, 'cross_site.blocked', { method: req.method, path: req.path, origin: origin || null });
    return res.status(403).json({ message: 'This request must come from the site itself.' });
  }
  next();
});

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
// (2026-11-21: the owner says there is no cron job, so nothing pings this;
// the instance sleeps when idle. Don't add a keep-alive without approval.)
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
