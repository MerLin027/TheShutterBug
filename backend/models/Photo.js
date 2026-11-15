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
    type: [String],
    default: []
  },
  caption: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
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
