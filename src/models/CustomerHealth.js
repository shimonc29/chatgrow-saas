const mongoose = require('mongoose');

const customerHealthSchema = new mongoose.Schema({
  businessId: {
    type: String,
    required: true,
    index: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String
  },
  rfmScores: {
    recency: {
      score: { type: Number, min: 1, max: 5, required: true },
      daysSinceLastInteraction: { type: Number, required: true }
    },
    frequency: {
      score: { type: Number, min: 1, max: 5, required: true },
      totalInteractions: { type: Number, required: true }
    },
    monetary: {
      score: { type: Number, min: 1, max: 5, required: true },
      totalRevenue: { type: Number, required: true }
    }
  },
  healthScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  segment: {
    type: String,
    enum: [
      'Champions',
      'Loyal Customers',
      'Potential Loyalists',
      'Recent Customers',
      'Promising',
      'Need Attention',
      'About To Sleep',
      'At Risk',
      'Cannot Lose Them',
      'Hibernating',
      'Lost'
    ],
    required: true
  },
  churnRisk: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  metrics: {
    lastInteractionDate: { type: Date },
    totalTransactions: { type: Number, default: 0 },
    totalEventRegistrations: { type: Number, default: 0 },
    totalAppointments: { type: Number, default: 0 },
    averageOrderValue: { type: Number, default: 0 },
    lifetimeValue: { type: Number, default: 0 }
  },
  engagementTrend: {
    type: String,
    enum: ['increasing', 'stable', 'declining', 'inactive'],
    default: 'stable'
  },
  recommendations: [{
    type: {
      type: String,
      enum: ['win_back', 'upsell', 'thank_you', 'feedback', 'nurture']
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high']
    },
    message: String,
    createdAt: { type: Date, default: Date.now }
  }],
  lastCalculatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

customerHealthSchema.index({ businessId: 1, customerId: 1 }, { unique: true });
customerHealthSchema.index({ businessId: 1, segment: 1 });
customerHealthSchema.index({ businessId: 1, churnRisk: 1 });
customerHealthSchema.index({ businessId: 1, healthScore: -1 });
customerHealthSchema.index({ lastCalculatedAt: 1 });

customerHealthSchema.methods.calculateHealthScore = function() {
  const { recency, frequency, monetary } = this.rfmScores;
  
  const weights = {
    recency: 0.4,
    frequency: 0.3,
    monetary: 0.3
  };
  
  const normalizedScore = (
    (recency.score * weights.recency) +
    (frequency.score * weights.frequency) +
    (monetary.score * weights.monetary)
  ) / 5;
  
  this.healthScore = Math.round(normalizedScore * 100);
  return this.healthScore;
};

customerHealthSchema.methods.determineSegment = function() {
  const { recency, frequency, monetary } = this.rfmScores;
  const R = recency.score;
  const F = frequency.score;
  const M = monetary.score;
  
  if (R >= 4 && F >= 4 && M >= 4) {
    this.segment = 'Champions';
    this.churnRisk = 'low';
  } else if (R >= 3 && F >= 4 && M >= 3) {
    this.segment = 'Loyal Customers';
    this.churnRisk = 'low';
  } else if (R >= 4 && F <= 2 && M <= 2) {
    this.segment = 'Recent Customers';
    this.churnRisk = 'medium';
  } else if (R >= 3 && F >= 2 && M >= 2) {
    this.segment = 'Potential Loyalists';
    this.churnRisk = 'medium';
  } else if (R >= 4 && F <= 1) {
    this.segment = 'Promising';
    this.churnRisk = 'medium';
  } else if (R >= 2 && R <= 3 && F >= 2 && M >= 2) {
    this.segment = 'Need Attention';
    this.churnRisk = 'medium';
  } else if (R <= 2 && F >= 2 && M >= 2) {
    this.segment = 'About To Sleep';
    this.churnRisk = 'high';
  } else if (R <= 2 && F <= 2 && M >= 3) {
    this.segment = 'Cannot Lose Them';
    this.churnRisk = 'critical';
  } else if (R <= 3 && F >= 4 && M >= 4) {
    this.segment = 'At Risk';
    this.churnRisk = 'high';
  } else if (R <= 2 && F <= 2 && M <= 2) {
    this.segment = 'Hibernating';
    this.churnRisk = 'critical';
  } else {
    this.segment = 'Lost';
    this.churnRisk = 'critical';
  }
  
  return this.segment;
};

customerHealthSchema.methods.determineEngagementTrend = function() {
  const daysSince = this.rfmScores.recency.daysSinceLastInteraction;
  const totalInteractions = this.rfmScores.frequency.totalInteractions;
  
  if (daysSince <= 7 && totalInteractions >= 5) {
    this.engagementTrend = 'increasing';
  } else if (daysSince <= 30 && totalInteractions >= 2) {
    this.engagementTrend = 'stable';
  } else if (daysSince > 30 && daysSince <= 90) {
    this.engagementTrend = 'declining';
  } else {
    this.engagementTrend = 'inactive';
  }
  
  return this.engagementTrend;
};

module.exports = mongoose.model('CustomerHealth', customerHealthSchema);
