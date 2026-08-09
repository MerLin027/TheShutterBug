import express from 'express';
import SiteContent, { DEFAULTS } from '../models/SiteContent.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/site-content
// @desc    Get the About page copy
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    const content = await SiteContent.findOne({});

    // No document yet (fresh database, admin has never hit Save). Return the
    // defaults rather than 404 so About renders its original copy instead of
    // an empty page.
    if (!content) {
      return res.status(200).json(DEFAULTS);
    }

    res.status(200).json(content);
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/site-content
// @desc    Update the About page copy (creates the singleton on first save)
// @access  Private (Admin only)
router.put('/', protect, async (req, res, next) => {
  try {
    // Pick fields explicitly — never spread req.body into an update, or a
    // caller could set _id, timestamps, or anything else added later.
    const { quote, bio, aboutImageUrl } = req.body;

    const update = {};
    if (quote !== undefined) update.quote = quote;
    if (bio !== undefined) update.bio = bio;
    if (aboutImageUrl !== undefined) update.aboutImageUrl = aboutImageUrl;

    if (Object.keys(update).length === 0) {
      return res.status(400).json({
        message: 'Nothing to update — provide quote, bio, or aboutImageUrl',
      });
    }

    // returnDocument: 'after' rather than the older `new: true`, which
    // mongoose 9 warns is deprecated.
    // setDefaultsOnInsert matters here: a first save that only sends `quote`
    // must still create the document with bio and aboutImageUrl populated
    // from the schema, or About would render two empty sections.
    const content = await SiteContent.findOneAndUpdate({}, update, {
      returnDocument: 'after',
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    });

    res.status(200).json(content);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    next(error);
  }
});

export default router;
