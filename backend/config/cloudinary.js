import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Cloudinary config — env vars are loaded by the time this module runs
// because server.js imports config/env.js first.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Setup multer-cloudinary storage.
// Note: `allowed_formats` is a Cloudinary Media Library UI filter, not an
// upload API param — it's a no-op here. Use `resource_type: 'image'` to
// restrict to images only. Transformations can be added inside `params`
// as a `transformation` array when needed (e.g. max 2560px from the spec).
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'the-shutter-bug',
    resource_type: 'image',
    // transformation: [{ width: 2560, crop: 'limit' }],
  },
});

export const upload = multer({ storage });
export { cloudinary };
