// env.js MUST be the first import so dotenv.config() runs before any other
// module-level code reads from process.env (e.g. cloudinary.config() in config/cloudinary.js).
import './config/env.js';

import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';

import authRoutes from './routes/auth.js';
import photoRoutes from './routes/photos.js';

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/photos', photoRoutes);

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
