const mongoose = require('mongoose');

const acquisitionSourceStatsSchema = new mongoose.Schema({
  businessId: {
    type: Number,
    required: true,
    index: true,
    ref: 'Subscriber'
  },
  
  sourceKey: {
    type: String,
    required: true,
    index: true
  },
  
  sourceType: {
    type: String,
    enum: ['landing_page', 'event', 'appointment', 'manual', 'referral', 'other'],
    required: true,
    index: true
  },
  
  period: {
    type: String,
    enum: ['day', 'week', 'month'],
    required: true,
    default: 'day'
  },
  
  periodStart: {
    type: Date,
    required: true,
    index: true
  },
  
  periodEnd: {
    type: Date,
    required: true
  },
  
  metrics: {
    views: {
      type: Number,
      default: 0
    },
    leads: {
      type: Number,
      default: 0
    },
    appointments: {
      type: Number,
      default: 0
    },
    registrations: {
      type: Number,
      default: 0
    },
    payments: {
      type: Number,
      default: 0
    },
    revenue: {
      type: Number,
      default: 0
    }
  },
  
  conversionRates: {
    viewsToLeads: {
      type: Number,
      default: 0
    },
    leadsToBookings: {
      type: Number,
      default: 0
    },
    bookingsToPayments: {
      type: Number,
      default: 0
    },
    overallConversion: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

acquisitionSourceStatsSchema.index({ businessId: 1, periodStart: -1 });
acquisitionSourceStatsSchema.index({ businessId: 1, sourceType: 1, periodStart: -1 });
acquisitionSourceStatsSchema.index({ businessId: 1, sourceKey: 1, periodStart: -1 });

acquisitionSourceStatsSchema.methods.calculateConversionRates = function() {
  const m = this.metrics;
  
  this.conversionRates.viewsToLeads = m.views > 0 ? (m.leads / m.views) * 100 : 0;
  this.conversionRates.leadsToBookings = m.leads > 0 ? ((m.appointments + m.registrations) / m.leads) * 100 : 0;
  this.conversionRates.bookingsToPayments = (m.appointments + m.registrations) > 0 
    ? (m.payments / (m.appointments + m.registrations)) * 100 
    : 0;
  this.conversionRates.overallConversion = m.views > 0 ? (m.payments / m.views) * 100 : 0;
};

const AcquisitionSourceStats = mongoose.model('AcquisitionSourceStats', acquisitionSourceStatsSchema);

module.exports = AcquisitionSourceStats;
