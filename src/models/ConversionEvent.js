const mongoose = require('mongoose');

const conversionEventSchema = new mongoose.Schema({
  businessId: {
    type: String,
    required: true,
    index: true
  },
  
  sourceType: {
    type: String,
    enum: ['landing_page', 'event', 'appointment', 'referral', 'manual', 'other'],
    required: true,
    index: true
  },
  
  sourceKey: {
    type: String,
    required: true,
    index: true
  },
  
  landingPageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LandingPage',
    default: null,
    index: true
  },
  
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    default: null,
    index: true
  },
  
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    default: null,
    index: true
  },
  
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  ipAddress: {
    type: String,
    default: null
  },
  
  userAgent: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

conversionEventSchema.index({ businessId: 1, createdAt: -1 });
conversionEventSchema.index({ businessId: 1, sourceKey: 1, createdAt: -1 });
conversionEventSchema.index({ businessId: 1, sourceType: 1, createdAt: -1 });

const ConversionEvent = mongoose.model('ConversionEvent', conversionEventSchema);

module.exports = ConversionEvent;
