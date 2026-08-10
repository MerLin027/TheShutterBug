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

// Confirm the credentials actually work, once, at boot.
//
// A presence check in config/env.js catches *missing* vars. It cannot catch
// the failure that actually happened: the key and secret were both present and
// both malformed (they looked swapped), so every upload died with
// `Invalid api_key` — and because nothing exercised Cloudinary at startup, the
// photo database sat empty for days before anyone traced it. One ping turns
// that into a line in the startup log.
//
// Deliberately non-fatal and not awaited: the public site reads from MongoDB
// and must still come up if Cloudinary is unreachable.
if (process.env.CLOUDINARY_API_KEY) {
  cloudinary.api
    .ping()
    .then(() => console.log('Cloudinary credentials OK'))
    .catch((err) =>
      console.error(
        `Cloudinary credentials REJECTED — uploads will fail. ${err?.error?.message || err.message}`
      )
    );
}

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

// 25 MB clears a full-frame JPEG comfortably. Without a limit, a single
// request could stream unbounded data straight into Cloudinary storage.
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

// `resource_type: 'image'` makes Cloudinary reject a non-image, but only
// AFTER the whole body has been streamed to them. Rejecting on mimetype here
// fails on the first chunk instead, and gives a message worth reading.
function fileFilter(req, file, cb) {
  if (file.mimetype && file.mimetype.startsWith('image/')) {
    return cb(null, true);
  }
  const err = new Error(`Only image files are accepted — received ${file.mimetype || 'unknown type'}`);
  err.status = 400;
  cb(err);
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_UPLOAD_BYTES },
});
export { cloudinary };
