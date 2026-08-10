// This MUST be the very first thing that runs before any other import
// resolves module-level code (e.g. cloudinary.config() reading env vars).
// In ESM, imports are hoisted, so we use a side-effect import of this
// file as the first import in server.js.
import dotenv from 'dotenv';
dotenv.config();

// ---------------------------------------------------------------------------
// Fail fast on missing configuration.
//
// MONGODB_URI already failed loudly (connectDB exits), but JWT_SECRET did not:
// unset, jwt.sign throws so login 500s, and jwt.verify throws so EVERY
// protected route answers 401. The symptom — "my token keeps failing" — points
// nowhere near the cause. Better to refuse to boot.
//
// Cloudinary is a warning, not an exit: reads (the whole public site) work
// without it. Only upload and delete need it.
// ---------------------------------------------------------------------------

const REQUIRED = ['MONGODB_URI', 'JWT_SECRET'];
const missing = REQUIRED.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(
    `Missing required environment variable(s): ${missing.join(', ')}. ` +
      'Set them in backend/.env locally, or in the Render dashboard in production ' +
      '— Render does not read any file in this repo. Refusing to start.'
  );
  process.exit(1);
}

const CLOUDINARY_KEYS = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];
const missingCloudinary = CLOUDINARY_KEYS.filter((key) => !process.env[key]);

if (missingCloudinary.length > 0) {
  console.warn(
    `Cloudinary is not configured (missing ${missingCloudinary.join(', ')}). ` +
      'Reads will work; photo upload and delete will fail.'
  );
}
