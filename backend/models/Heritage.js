const mongoose = require('mongoose');

const HeritageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['architecture', 'culture', 'research', 'geohunt'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  shortDesc: {
    type: String,
    maxlength: 200
  },
  state: {
    type: String,
    required: true
  },
  city: String,
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: String
  },
  images: [String],
  builtIn: String,
  dynasty: String,
  significance: String,
  visitingHours: String,
  entryFee: String,
  tags: [String],
  isASIProtected: { type: Boolean, default: false },
  isUNESCO: { type: Boolean, default: false },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

// Text search index
HeritageSchema.index({ name: 'text', description: 'text', state: 'text', tags: 'text' });

module.exports = mongoose.model('Heritage', HeritageSchema);
