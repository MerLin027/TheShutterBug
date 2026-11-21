import express from 'express';
import mongoose from 'mongoose';
import Photo, { CATEGORIES } from '../models/Photo.js';
import { protect } from '../middleware/auth.js';
import { upload, uploadImage, releaseAsset, PROTECTED_TYPE } from '../config/cloudinary.js';

const router = express.Router();

// A reorder covers what the Studio grid is currently showing. A cap keeps a
// malformed or hostile payload from turning into an unbounded bulkWrite.
const MAX_REORDER_ITEMS = 500;

/**
 * Tags from a string ("sea, dusk,") or an array, trimmed, without empties.
 * A trailing or doubled comma used to store an empty tag (2026-11-21 audit).
 */
function parseTags(tags) {
  const list = Array.isArray(tags) ? tags : String(tags).split(',');
  return list.map((t) => String(t).trim()).filter(Boolean);
}

// @route   GET /api/photos
// @desc    Get all photos, optionally filter by category
// @access  Public
router.get('/', async (req, res) => {
  const filter = {};

  // An absent or empty `category` means "no filter" — that was the original
  // behaviour and the gallery's "All" pill relies on it.
  const raw = req.query.category;
  if (raw !== undefined && String(raw).trim() !== '') {
    // String() first: under Express 5's `simple` query parser a repeated param
    // (?category=a&category=b) arrives as an ARRAY, and an array reaching a
    // String schema path threw a CastError that this route answered with a 500.
    const category = String(raw).trim().toLowerCase();

    if (!CATEGORIES.includes(category)) {
      return res.status(400).json({
        message: `Unknown category '${category}' — expected one of: ${CATEGORIES.join(', ')}`,
      });
    }

    filter.category = category;
  }

  // Sort by position ascending
  const photos = await Photo.find(filter).sort({ position: 1 });
  res.json(photos);
});

// IMPORTANT: /reorder MUST be registered before /:id so Express doesn't
// capture the literal string "reorder" as an :id parameter.
// @route   PUT /api/photos/reorder
// @desc    Bulk update photo positions
// @access  Private
router.put('/reorder', protect, async (req, res) => {
  const { items } = req.body;
  // items: Array<{ id: string, position: number }>

  // An empty array is rejected here rather than passed through: the MongoDB
  // driver throws on an empty bulkWrite batch, which surfaced as a 500 for
  // what is plainly a bad request.
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      message: 'Invalid payload — expected a non-empty { items: [{ id, position }] }',
    });
  }

  if (items.length > MAX_REORDER_ITEMS) {
    return res.status(400).json({
      message: `Too many items — maximum ${MAX_REORDER_ITEMS} per request`,
    });
  }

  // Validate every entry before touching the database, so a bad id can't
  // half-apply the reorder or surface as a CastError from inside bulkWrite.
  for (const item of items) {
    if (!item || !mongoose.isValidObjectId(item.id)) {
      return res.status(400).json({ message: 'Each item needs a valid photo id' });
    }
    if (!Number.isFinite(Number(item.position))) {
      return res.status(400).json({ message: `Invalid position for photo ${item.id}` });
    }
  }

  // Bulk write for performance — one round-trip to MongoDB
  const bulkOps = items.map((item) => ({
    updateOne: {
      filter: { _id: item.id },
      update: { $set: { position: Number(item.position) } },
    },
  }));

  await Photo.bulkWrite(bulkOps);

  res.json({ message: 'Positions updated successfully' });
});

// @route   GET /api/photos/:id
// @desc    Get single photo by ID
// @access  Public
router.get('/:id', async (req, res) => {
  // A malformed id throws a CastError, which Express 5 forwards to
  // middleware/errorHandler.js and it answers 400. Same for every :id route
  // below — that branch used to be written out by hand three times.
  const photo = await Photo.findById(req.params.id);

  if (!photo) {
    return res.status(404).json({ message: 'Photo not found' });
  }

  res.json(photo);
});

// @route   POST /api/photos
// @desc    Upload a new photo
// @access  Private
//
// `protect` before `upload` is load-bearing: reversed, an unauthenticated
// request would stream its body into Cloudinary storage before being rejected.
router.post('/', protect, upload.single('image'), async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Please upload an image file' });
  }

  // Check what the schema would reject BEFORE the upload. These used to fail
  // only at Photo.create, after the whole file (up to 25 MB) had gone to
  // Cloudinary, which then had to be deleted again, and an asset was
  // orphaned whenever that delete failed (2026-11-21 audit). The hero route
  // checks its alt text first for the same reason.
  if (!CATEGORIES.includes(req.body.category)) {
    return res.status(400).json({ message: `Choose a category: ${CATEGORIES.join(', ')}` });
  }
  if (req.body.aspectRatio !== undefined) {
    const ratio = parseFloat(req.body.aspectRatio);
    if (!Number.isFinite(ratio) || ratio <= 0) {
      return res.status(400).json({ message: 'Invalid aspect ratio' });
    }
  }

  // multer holds the file in memory; it reaches Cloudinary only here, after
  // auth, the image-type check and the checks above, and is stored as a
  // protected asset (D10).
  const stored = await uploadImage(req.file);

  // The try/catch has real work to do: if the Photo document can't be
  // written (an invalid category, a bad aspectRatio...), nothing references
  // the upload, so it is released before the error is handed on —
  // errorHandler still maps a ValidationError to 400.
  try {
    const { category, tags, caption, location, position, isFeatured, aspectRatio } = req.body;

    // UploadModal doesn't send a position. Without this every new photo got 0,
    // so GET /'s sort({ position: 1 }) tie-broke arbitrarily and gallery order
    // was undefined until the first manual drag. Append to the end instead.
    //
    // max + 1 rather than countDocuments() — deleting a photo leaves a gap in
    // the sequence, and a count would then collide with an existing position.
    let resolvedPosition;
    if (position !== undefined) {
      resolvedPosition = parseInt(position, 10);
    } else {
      const last = await Photo.findOne({}).sort({ position: -1 }).select('position');
      resolvedPosition = last ? last.position + 1 : 0;
    }

    const photo = await Photo.create({
      imageUrl: stored.secure_url,
      cloudinaryId: stored.public_id,
      deliveryType: PROTECTED_TYPE,
      category,
      tags: tags ? parseTags(tags) : [],
      caption: caption || '',
      location: location || '',
      position: resolvedPosition,
      isFeatured: isFeatured === 'true' || isFeatured === true,
      aspectRatio: aspectRatio !== undefined ? parseFloat(aspectRatio) : 1,
    });

    res.status(201).json(photo);
  } catch (error) {
    await releaseAsset(stored.public_id, PROTECTED_TYPE, 'photo save failed');
    next(error);
  }
});

// @route   PUT /api/photos/:id
// @desc    Update photo metadata (no image re-upload here)
// @access  Private
router.put('/:id', protect, async (req, res) => {
  const photo = await Photo.findById(req.params.id);

  if (!photo) {
    return res.status(404).json({ message: 'Photo not found' });
  }

  const { category, tags, caption, location, position, isFeatured, aspectRatio } = req.body;

  // Fields are picked explicitly — never assign req.body wholesale, or a
  // caller could set _id, timestamps, or anything added to the schema later.
  if (category !== undefined) photo.category = category;
  if (tags !== undefined) {
    photo.tags = parseTags(tags);
  }
  if (caption !== undefined) photo.caption = caption;
  if (location !== undefined) photo.location = location;
  if (position !== undefined) photo.position = parseInt(position, 10);
  if (isFeatured !== undefined) photo.isFeatured = isFeatured === 'true' || isFeatured === true;
  if (aspectRatio !== undefined) photo.aspectRatio = parseFloat(aspectRatio);

  const updatedPhoto = await photo.save();
  res.json(updatedPhoto);
});

// @route   DELETE /api/photos/:id
// @desc    Delete a photo from Cloudinary and MongoDB
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  const photo = await Photo.findById(req.params.id);

  if (!photo) {
    return res.status(404).json({ message: 'Photo not found' });
  }

  // Cloudinary first, but a Cloudinary failure must NOT abort the DB delete.
  //
  // This used to be a bare `await`, so an outage there 500'd the whole route
  // and left the row stuck in the gallery with no way to remove it from the
  // UI. Of the two failure modes, the orphaned asset is the better one: it is
  // recoverable from the Cloudinary console, and the public_id is logged
  // below. A permanently undeletable photo is recoverable from nowhere.
  //
  // Note destroy() returns { result: 'not found' } rather than throwing when
  // the asset is already gone, so a retried delete is safe.
  // releaseAsset never throws; it logs the public_id if destroy fails.
  await releaseAsset(photo.cloudinaryId, photo.deliveryType, 'photo deleted, DB row removed anyway');

  await photo.deleteOne();

  res.json({ message: 'Photo removed' });
});

export default router;
