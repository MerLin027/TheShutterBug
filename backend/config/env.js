// This MUST be the very first thing that runs before any other import
// resolves module-level code (e.g. cloudinary.config() reading env vars).
// In ESM, imports are hoisted, so we use a side-effect import of this
// file as the first import in server.js.
import dotenv from 'dotenv';
dotenv.config();
