import express from 'express';
import SiteContent, { DEFAULTS } from '../models/SiteContent.js';
import { protect } from '../middleware/auth.js';
import {
  upload,
  uploadImage,
  releaseAsset,
  privateDownloadUrl,
  PROTECTED_TYPE,
} from '../config/cloudinary.js';

const router = express.Router();

// What a client sees is decided by the model's toJSON (models/SiteContent.js):
// the hero's public_id, type and stored URL never leave the server.

/**
 * Fields that may not be saved empty. The public site treats an empty value
 * as "missing" and shows the built-in default instead (data.ts), so an empty
 * save looked like it worked while the page kept the demo copy: a cleared
 * portrait came back as the demo portrait, and an empty hero description
 * described the uploaded photo as the default rowing boat (2026-11-21 audit).
 * The work statement is the exception: empty there means "use the bio".
 */
const NOT_EMPTY = {
  quote: 'The quote',
  bio: 'The bio',
  aboutImageUrl: 'The portrait address',
  heroImageAlt: 'The photograph description',
};

/** https: only. The About portrait is a free-text URL field. */
function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

// @route   GET /api/site-content
// @desc    Get the About page copy and the Home page settings
// @access  Public
router.get('/', async (req, res) => {
  const content = await SiteContent.findOne({});

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
    if (NOT_EMPTY[key] && value.trim() === '') {
      return res.status(400).json({ message: `${NOT_EMPTY[key]} can't be empty` });
    }
    update[key] = value;
  }
  // The portrait URL is rendered as an <img src> on a public page: only an
  // https: URL may be stored (no javascript:, data:, or plain http:).
  if (update.aboutImageUrl !== undefined) {
    update.aboutImageUrl = update.aboutImageUrl.trim();
    if (!isHttpsUrl(update.aboutImageUrl)) {
      return res.status(400).json({ message: 'The portrait must be an https:// address' });
    }
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
  });

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

  // Checked before the upload: a missing description costs nothing.
  const alt = typeof req.body.alt === 'string' ? req.body.alt.trim() : '';
  if (!alt) {
    return res.status(400).json({ message: 'Please describe the photograph (alt text)' });
  }

  // Stored as a protected asset (D10); multer only held it in memory.
  const stored = await uploadImage(req.file);

  try {
    const previous = await SiteContent.findOne({}).select('heroImageId heroImageType');

    const content = await SiteContent.findOneAndUpdate(
      {},
      {
        heroImageUrl: stored.secure_url,
        heroImageId: stored.public_id,
        heroImageType: PROTECTED_TYPE,
        heroImageFormat: stored.format || '',
        heroImageAlt: alt,
      },
      { returnDocument: 'after', upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    // Only after the new one is saved: release the hero it replaced. Never
    // the default placeholder (no id), and never the asset just saved.
    if (previous?.heroImageId && previous.heroImageId !== stored.public_id) {
      await releaseAsset(previous.heroImageId, previous.heroImageType, 'replaced hero');
    }

    res.status(200).json(content);
  } catch (error) {
    // Nothing references the new upload if the save failed. Release it, then
    // let errorHandler map the error (ValidationError → 400, etc.).
    await releaseAsset(stored.public_id, PROTECTED_TYPE, 'hero save failed');
    next(error);
  }
});

// @route   GET /api/site-content/hero/download
// @desc    A link to download the current hero photograph (the stored file)
// @access  Private (Admin only)
//
// Studio → Home's "Download current". The public site only ever gets signed
// display sizes; this is the one way to the stored file, and it is behind
// `protect` and expires after five minutes. The default placeholder isn't a
// Cloudinary asset of ours, so its own URL is returned.
router.get('/hero/download', protect, async (req, res) => {
  const content = await SiteContent.findOne({}).select(
    'heroImageId heroImageType heroImageFormat heroImageUrl'
  );

  if (!content?.heroImageId) {
    return res.json({ url: content?.heroImageUrl || DEFAULTS.heroImageUrl, placeholder: true });
  }

  res.json({
    url: privateDownloadUrl(content.heroImageId, content.heroImageType, content.heroImageFormat),
    placeholder: false,
  });
});

export default router;
