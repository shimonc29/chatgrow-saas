const mongoose = require('mongoose');

const growthOpportunitySchema = new mongoose.Schema({
  businessId: {
    type: String,
    required: true,
    index: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true
  },
  opportunityType: {
    type: String,
    enum: ['UPSELL', 'CROSS_SELL', 'PACKAGE_UPGRADE', 'PREMIUM_SERVICE', 'FREQUENCY_BOOST'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  potentialValue: {
    type: Number,
    required: true,
    min: 0
  },
  confidence: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    required: true,
    default: 'MEDIUM'
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    required: true,
    default: 'MEDIUM'
  },
  status: {
    type: String,
    enum: ['PENDING', 'IN_PROGRESS', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
    default: 'PENDING'
  },
  recommendations: [{
    action: String,
    reasoning: String,
    expectedImpact: String
  }],
  customerMetrics: {
    currentCLV: Number,
    projectedCLV: Number,
    avgTransactionValue: Number,
    purchaseFrequency: Number,
    lastPurchaseDate: Date,
    totalSpent: Number,
    engagement: String
  },
  historicalPatterns: {
    preferredServices: [String],
    peakPurchaseTimes: [String],
    priceRange: {
      min: Number,
      max: Number,
      avg: Number
    },
    seasonalTrends: [String]
  },
  actionTaken: {
    type: Boolean,
    default: false
  },
  actionDate: {
    type: Date
  },
  actualValue: {
    type: Number,
    min: 0
  },
  notes: {
    type: String
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

growthOpportunitySchema.index({ businessId: 1, status: 1 });
growthOpportunitySchema.index({ businessId: 1, opportunityType: 1 });
growthOpportunitySchema.index({ businessId: 1, priority: 1, confidence: 1 });
growthOpportunitySchema.index({ customerId: 1, status: 1 });
growthOpportunitySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

growthOpportunitySchema.methods.markAsAccepted = function(actualValue, notes) {
  this.status = 'ACCEPTED';
  this.actionTaken = true;
  this.actionDate = new Date();
  if (actualValue !== undefined) {
    this.actualValue = actualValue;
  }
  if (notes) {
    this.notes = notes;
  }
  return this.save();
};

growthOpportunitySchema.methods.markAsRejected = function(notes) {
  this.status = 'REJECTED';
  this.actionTaken = true;
  this.actionDate = new Date();
  if (notes) {
    this.notes = notes;
  }
  return this.save();
};

growthOpportunitySchema.statics.calculateConversionRate = async function(businessId) {
  const total = await this.countDocuments({ businessId });
  const accepted = await this.countDocuments({ businessId, status: 'ACCEPTED' });
  return total > 0 ? (accepted / total) * 100 : 0;
};

growthOpportunitySchema.statics.getTotalPotentialValue = async function(businessId) {
  const result = await this.aggregate([
    { $match: { businessId, status: 'PENDING' } },
    { $group: { _id: null, total: { $sum: '$potentialValue' } } }
  ]);
  return result.length > 0 ? result[0].total : 0;
};

growthOpportunitySchema.statics.getTotalRealizedValue = async function(businessId) {
  const result = await this.aggregate([
    { $match: { businessId, status: 'ACCEPTED' } },
    { $group: { _id: null, total: { $sum: '$actualValue' } } }
  ]);
  return result.length > 0 ? result[0].total : 0;
};

const GrowthOpportunity = mongoose.model('GrowthOpportunity', growthOpportunitySchema);

module.exports = GrowthOpportunity;
