// env.js MUST be the first import so dotenv.config() runs before any other
// module-level code reads from process.env (e.g. cloudinary.config() in config/cloudinary.js).
import './config/env.js';

import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.js';
import photoRoutes from './routes/photos.js';
import contactRoutes from './routes/contact.js';
import siteContentRoutes from './routes/siteContent.js';

// Connect to database
connectDB();

const app = express();

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
app.use(express.json());

// Health check. Deliberately no DB call — it must answer while Atlas is
// unreachable, or the keep-alive ping would report the service as down
// whenever the database blips.
//
// Registered at BOTH paths on purpose. These were two separate handlers with
// two different response bodies; the cron-job.org keep-alive that stops Render
// idling points at one of them, and that configuration lives outside this
// repo, so neither path can be safely deleted. One handler, two mounts.
const health = (req, res) => res.status(200).json({ status: 'ok' });
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
