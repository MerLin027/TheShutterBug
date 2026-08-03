import mongoose from 'mongoose';

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
    enum: ['nature', 'objects', 'monochrome', 'urban'],
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
