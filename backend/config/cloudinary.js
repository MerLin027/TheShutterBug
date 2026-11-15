import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

// Cloudinary config — env vars are loaded by the time this module runs
// because server.js imports config/env.js first.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
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

// ---------------------------------------------------------------------------
// Image protection (Phase D10, owner directive 2026-11-15: nobody should be
// able to download the photographs).
//
// A browser cannot show an image without receiving its pixels, so the aim is
// that what it receives is never the original:
//
// - Uploads are stored as `type: 'authenticated'`. An authenticated asset has
//   no public URL at all: the original, and any size or transformation not
//   signed by this server, answers 401. Editing a delivered URL (stripping
//   `w_1200`, swapping in `w_6000`, removing `f_auto`) breaks its signature.
// - Public delivery is a fixed set of signed widths, capped at 2400px, with
//   `f_auto,q_auto` — so the largest file anyone can obtain is a compressed
//   display copy. Cloudinary strips EXIF/GPS from transformed deliveries.
// - The API never returns the raw secure_url or public_id (models/Photo.js).
//
// The owner's own "Download current" (Studio → Home) goes through a
// short-lived private download URL behind `protect`.
// ---------------------------------------------------------------------------

/** The only widths ever signed. Largest = the lightbox / hero on a big screen. */
export const DELIVERY_WIDTHS = [320, 480, 800, 1200, 1600, 2400];

/** Stored type for new uploads. Older assets are `upload` until migrated. */
export const PROTECTED_TYPE = 'authenticated';

/** One signed, size-capped delivery URL. */
export function signedImageUrl(publicId, type, width) {
  return cloudinary.url(publicId, {
    type: type || 'upload',
    sign_url: true,
    secure: true,
    transformation: [{ width, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
  });
}

/** `{ "320": url, ..., "2400": url }` for an asset. */
export function signedImageSet(publicId, type) {
  if (!publicId) return null;
  return Object.fromEntries(
    DELIVERY_WIDTHS.map((w) => [String(w), signedImageUrl(publicId, type, w)])
  );
}

/**
 * A download link for the owner: the stored file itself, as an attachment,
 * valid for five minutes. Only ever returned behind `protect`.
 */
export function privateDownloadUrl(publicId, type, format) {
  return cloudinary.utils.private_download_url(publicId, format || 'jpg', {
    type: type || 'upload',
    attachment: true,
    expires_at: Math.floor(Date.now() / 1000) + 300,
  });
}

// ---------------------------------------------------------------------------
// Uploads
// ---------------------------------------------------------------------------

// 25 MB clears a full-frame JPEG comfortably. Without a limit, a single
// request could stream unbounded data into memory and on to Cloudinary.
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

// Rejecting on mimetype fails on the first chunk, with a message worth
// reading, instead of after the whole body has reached Cloudinary.
function fileFilter(req, file, cb) {
  if (file.mimetype && file.mimetype.startsWith('image/')) {
    return cb(null, true);
  }
  const err = new Error(`Only image files are accepted — received ${file.mimetype || 'unknown type'}`);
  err.status = 400;
  cb(err);
}

// Memory storage, then an explicit Cloudinary upload in the route (via
// uploadImage below). This replaced multer-storage-cloudinary (unmaintained
// since 2020, and pinned to the Cloudinary v1 SDK, which has a known
// vulnerability). Holding one ≤25 MB file in memory is fine on Render.
export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
});

/**
 * Send multer's in-memory file to Cloudinary as a protected asset.
 * Resolves to { secure_url, public_id, type, format, width, height }.
 */
export function uploadImage(file) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'the-shutter-bug', resource_type: 'image', type: PROTECTED_TYPE },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(file.buffer);
  });
}

/** Release a Cloudinary asset; failure is logged, never thrown. */
export async function releaseAsset(publicId, type, why) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { type: type || 'upload', invalidate: true });
  } catch (err) {
    console.error(`[cloudinary] ORPHANED asset ${publicId} (${why}):`, err.message);
  }
}

export { cloudinary };
