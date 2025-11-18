const mongoose = require('mongoose');

/**
 * Strategic Report Model - דוחות אסטרטגיים שבועיים מבוססי AI
 * Multi-tenant: מבודד לפי businessId
 */
const strategicReportSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
    ref: 'ServiceProvider'
  },
  reportPeriod: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  generatedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'GENERATING', 'COMPLETED', 'FAILED'],
    default: 'PENDING',
    required: true
  },
  
  // AI Generated Content (Structured by Zod)
  pricingRecommendations: {
    currentPricingAnalysis: {
      averageTicketPrice: Number,
      revenuePerEvent: Number,
      profitMargin: Number
    },
    recommendations: [{
      eventCategory: String,
      currentPrice: Number,
      recommendedPrice: Number,
      expectedImpact: String,
      reasoning: String
    }]
  },
  
  demandForecast: {
    weeklyTrends: [{
      dayOfWeek: String,
      expectedAttendance: Number,
      confidence: String
    }],
    seasonalPatterns: String,
    upcomingOpportunities: [String]
  },
  
  keyRisks: [{
    category: String,
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
    },
    description: String,
    mitigation: String
  }],
  
  performanceMetrics: {
    totalRevenue: Number,
    totalEvents: Number,
    averageAttendance: Number,
    conversionRate: Number,
    customerRetention: Number
  },
  
  // Metadata
  aiMetadata: {
    model: String,
    tokensUsed: Number,
    processingTime: Number
  },
  
  errorLog: {
    message: String,
    timestamp: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
strategicReportSchema.index({ businessId: 1, generatedAt: -1 });
strategicReportSchema.index({ businessId: 1, 'reportPeriod.startDate': 1 });
strategicReportSchema.index({ status: 1, generatedAt: -1 });

// Static method: Get latest report for business
strategicReportSchema.statics.getLatestReport = function(businessId) {
  return this.findOne({ businessId, status: 'COMPLETED' })
    .sort({ generatedAt: -1 })
    .lean();
};

// Static method: Get reports by period
strategicReportSchema.statics.getReportsByPeriod = function(businessId, startDate, endDate) {
  return this.find({
    businessId,
    'reportPeriod.startDate': { $gte: startDate },
    'reportPeriod.endDate': { $lte: endDate }
  }).sort({ generatedAt: -1 }).lean();
};

module.exports = mongoose.model('StrategicReport', strategicReportSchema);
