import express from 'express';
import SiteContent, { DEFAULTS } from '../models/SiteContent.js';
import { protect } from '../middleware/auth.js';
import { upload, cloudinary } from '../config/cloudinary.js';

const router = express.Router();

// Internal bookkeeping that never leaves the server: the Cloudinary
// public_id of the uploaded hero. (Not secret — it's derivable from the
// URL — but clients have no use for it, so it isn't part of the API.)
const PRIVATE_FIELDS = '-heroImageId';

/** Release a Cloudinary asset; failure is logged, never thrown. */
async function releaseAsset(publicId, why) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error(`[site-content] ORPHANED Cloudinary asset ${publicId} (${why}):`, err.message);
  }
}

// @route   GET /api/site-content
// @desc    Get the About page copy and the Home page settings
// @access  Public
router.get('/', async (req, res) => {
  const content = await SiteContent.findOne({}).select(PRIVATE_FIELDS);

  // No document yet (fresh database, admin has never hit Save). Return the
  // defaults rather than 404 so About renders its original copy instead of
  // an empty page.
  if (!content) {
    return res.status(200).json(DEFAULTS);
  }

  res.status(200).json(content);
});

// @route   PUT /api/site-content
// @desc    Update the About copy / Home settings (creates the singleton on first save)
// @access  Private (Admin only)
router.put('/', protect, async (req, res) => {
  // Pick fields explicitly — never spread req.body into an update, or a
  // caller could set _id, timestamps, heroImageId, or anything added later.
  // The hero image URL is deliberately NOT settable here: it only changes
  // through the upload route below, so it is always one of our own
  // Cloudinary assets (or the original default), never an arbitrary URL.
  const { quote, bio, aboutImageUrl, heroImageAlt, showWorkStatement, workStatement } = req.body;

  const update = {};
  const strings = { quote, bio, aboutImageUrl, heroImageAlt, workStatement };
  for (const [key, value] of Object.entries(strings)) {
    if (value === undefined) continue;
    if (typeof value !== 'string') {
      return res.status(400).json({ message: `${key} must be text` });
    }
    update[key] = value;
  }
  if (showWorkStatement !== undefined) {
    // A real boolean only — "false" (a string) is truthy and would show it.
    if (typeof showWorkStatement !== 'boolean') {
      return res.status(400).json({ message: 'showWorkStatement must be true or false' });
    }
    update.showWorkStatement = showWorkStatement;
  }

  if (Object.keys(update).length === 0) {
    return res.status(400).json({ message: 'Nothing to update' });
  }

  // returnDocument: 'after' rather than the older `new: true`, which
  // mongoose 9 warns is deprecated.
  // setDefaultsOnInsert matters here: a first save that only sends `quote`
  // must still create the document with the other fields populated from the
  // schema, or About would render empty sections.
  //
  // runValidators means a bad value throws a ValidationError; that is mapped
  // to a 400 (with the field messages) by middleware/errorHandler.js.
  const content = await SiteContent.findOneAndUpdate({}, update, {
    returnDocument: 'after',
    upsert: true,
    runValidators: true,
    setDefaultsOnInsert: true,
  }).select(PRIVATE_FIELDS);

  res.status(200).json(content);
});

// @route   POST /api/site-content/hero
// @desc    Replace the Home page hero photograph (multipart: image, alt)
// @access  Private (Admin only)
//
// `protect` before `upload` is load-bearing: reversed, an unauthenticated
// request would stream its body into Cloudinary storage before being
// rejected. The upload middleware enforces image-only and 25 MB.
router.post('/hero', protect, upload.single('image'), async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Please choose an image file' });
  }

  try {
    const alt = typeof req.body.alt === 'string' ? req.body.alt.trim() : '';
    if (!alt) {
      await releaseAsset(req.file.filename, 'hero upload rejected: no description');
      return res.status(400).json({ message: 'Please describe the photograph (alt text)' });
    }

    const previous = await SiteContent.findOne({}).select('heroImageId');

    // multer-storage-cloudinary: req.file.path = secure_url,
    // req.file.filename = public_id.
    const content = await SiteContent.findOneAndUpdate(
      {},
      { heroImageUrl: req.file.path, heroImageId: req.file.filename, heroImageAlt: alt },
      { returnDocument: 'after', upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).select(PRIVATE_FIELDS);

    // Only after the new one is saved: release the hero it replaced. Never
    // the default placeholder (no id), and never the asset just saved.
    if (previous?.heroImageId && previous.heroImageId !== req.file.filename) {
      await releaseAsset(previous.heroImageId, 'replaced hero');
    }

    res.status(200).json(content);
  } catch (error) {
    // Nothing references the new upload if the save failed. Release it, then
    // let errorHandler map the error (ValidationError → 400, etc.).
    await releaseAsset(req.file.filename, 'hero save failed');
    next(error);
  }
});

export default router;
