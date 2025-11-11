const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: String,
    required: true,
    index: true
  },
  tags: [{
    type: String
  }],
  description: {
    type: String,
    default: ''
  },
  usageCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

mediaSchema.index({ uploadedBy: 1, createdAt: -1 });
mediaSchema.index({ tags: 1 });
mediaSchema.index({ mimeType: 1 });

module.exports = mongoose.model('Media', mediaSchema);
