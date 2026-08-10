import mongoose from 'mongoose';

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
}, { timestamps: true });

export default mongoose.model('Photo', photoSchema);
