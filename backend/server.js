// env.js MUST be the first import so dotenv.config() runs before any other
// module-level code reads from process.env (e.g. cloudinary.config() in config/cloudinary.js).
import './config/env.js';

import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';

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

app.get('/api/health', (req, res) => res.status(200).send('ok'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/site-content', siteContentRoutes);

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Generic error handler — catches errors thrown/forwarded from async route handlers.
// Express 5 auto-forwards async throws; this surfaces them as a clean JSON 500.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
