import express from 'express';
import Photo from '../models/Photo.js';
import { protect } from '../middleware/auth.js';
import { upload, cloudinary } from '../config/cloudinary.js';

const router = express.Router();

// @route   GET /api/photos
// @desc    Get all photos, optionally filter by category
// @access  Public
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) {
      filter.category = req.query.category;
    }

    // Sort by position ascending
    const photos = await Photo.find(filter).sort({ position: 1 });
    res.json(photos);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// IMPORTANT: /reorder MUST be registered before /:id so Express doesn't
// capture the literal string "reorder" as an :id parameter.
// @route   PUT /api/photos/reorder
// @desc    Bulk update photo positions
// @access  Private
router.put('/reorder', protect, async (req, res) => {
  try {
    const { items } = req.body;
    // items: Array<{ id: string, position: number }>

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ message: 'Invalid payload — expected { items: [{ id, position }] }' });
    }

    // Bulk write for performance — one round-trip to MongoDB
    const bulkOps = items.map((item) => ({
      updateOne: {
        filter: { _id: item.id },
        update: { $set: { position: item.position } },
      },
    }));

    await Photo.bulkWrite(bulkOps);

    res.json({ message: 'Positions updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/photos/:id
// @desc    Get single photo by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);
    if (photo) {
      res.json(photo);
    } else {
      res.status(404).json({ message: 'Photo not found' });
    }
  } catch (error) {
    // CastError = invalid ObjectId format
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid photo ID' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/photos
// @desc    Upload a new photo
// @access  Private
router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image file' });
    }

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
      // multer-storage-cloudinary sets req.file.path = secure_url
      // and req.file.filename = public_id (confirmed from source)
      imageUrl: req.file.path,
      cloudinaryId: req.file.filename,
      category,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim())) : [],
      caption: caption || '',
      location: location || '',
      position: resolvedPosition,
      isFeatured: isFeatured === 'true' || isFeatured === true,
      aspectRatio: aspectRatio !== undefined ? parseFloat(aspectRatio) : 1,
    });

    res.status(201).json(photo);
  } catch (error) {
    console.error(error);
    // Mongoose validation errors (e.g. invalid category enum) → 400
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT /api/photos/:id
// @desc    Update photo metadata (no image re-upload here)
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);

    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    const { category, tags, caption, location, position, isFeatured, aspectRatio } = req.body;

    if (category !== undefined) photo.category = category;
    if (tags !== undefined) {
      photo.tags = Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim());
    }
    if (caption !== undefined) photo.caption = caption;
    if (location !== undefined) photo.location = location;
    if (position !== undefined) photo.position = parseInt(position, 10);
    if (isFeatured !== undefined) photo.isFeatured = isFeatured === 'true' || isFeatured === true;
    if (aspectRatio !== undefined) photo.aspectRatio = parseFloat(aspectRatio);

    const updatedPhoto = await photo.save();
    res.json(updatedPhoto);
  } catch (error) {
    console.error(error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid photo ID' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   DELETE /api/photos/:id
// @desc    Delete a photo from Cloudinary and MongoDB
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);

    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    // Delete from Cloudinary first — if this fails we still have the DB record
    await cloudinary.uploader.destroy(photo.cloudinaryId);

    // Delete from DB
    await photo.deleteOne();

    res.json({ message: 'Photo removed' });
  } catch (error) {
    console.error(error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid photo ID' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
});

export default router;
