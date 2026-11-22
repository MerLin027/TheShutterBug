import mongoose from 'mongoose';
import { signedImageSet } from '../config/cloudinary.js';

/**
 * The category vocabulary, in one place.
 *
 * Exported so routes can validate a query param against the same list the
 * schema enforces — GET /api/photos used to pass `req.query.category` straight
 * to Mongoose without ever consulting this. Mirrors CATEGORIES in
 * src/lib/categories.ts; the two must stay in sync (the frontend lowercases
 * its display labels down to exactly these values before sending them).
 */
export const CATEGORIES = ['nature', 'objects', 'monochrome', 'urban'];

/** Text limits, in step with the Studio's Upload and Edit forms. */
export const PHOTO_TEXT_MAX = { caption: 200, location: 200, tag: 50, tags: 30 };

const photoSchema = new mongoose.Schema({
  imageUrl: {
    type: String,
    required: true
  },
  cloudinaryId: {
    type: String,
    required: true
  },
  // Cloudinary delivery type of the stored asset. 'authenticated' = no public
  // URL; only signed sizes resolve (Phase D10). Rows from before D10 were
  // 'upload' until scripts/protectImages.js moved them.
  deliveryType: {
    type: String,
    enum: ['upload', 'authenticated'],
    default: 'upload'
  },
  category: {
    type: String,
    enum: CATEGORIES,
    required: true
  },
  tags: {
    type: [{ type: String, maxlength: PHOTO_TEXT_MAX.tag }],
    default: [],
    validate: {
      validator: (v) => v.length <= PHOTO_TEXT_MAX.tags,
      message: `At most ${PHOTO_TEXT_MAX.tags} tags`,
    },
  },
  caption: {
    type: String,
    default: '',
    maxlength: [PHOTO_TEXT_MAX.caption, `Title must be ${PHOTO_TEXT_MAX.caption} characters or fewer`],
  },
  location: {
    type: String,
    default: '',
    maxlength: [PHOTO_TEXT_MAX.location, `Location must be ${PHOTO_TEXT_MAX.location} characters or fewer`],
  },
  position: {
    type: Number,
    default: 0
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  aspectRatio: {
    type: Number,
    required: true
  }
}, {
  timestamps: true,
  // What leaves the server. The stored original's URL and public_id never do
  // (Phase D10): clients get `images`, a fixed set of signed, size-capped
  // delivery URLs, and nothing they can edit into the original.
  toJSON: {
    transform(doc, ret) {
      ret.images = signedImageSet(doc.cloudinaryId, doc.deliveryType);
      delete ret.imageUrl;
      delete ret.cloudinaryId;
      delete ret.deliveryType;
      delete ret.__v;
      return ret;
    }
  }
});

export default mongoose.model('Photo', photoSchema);
