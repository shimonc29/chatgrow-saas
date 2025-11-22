const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  }
});

const dayAvailabilitySchema = new mongoose.Schema({
  dayOfWeek: {
    type: Number,
    required: true,
    min: 0,
    max: 6
  },
  isAvailable: {
    type: Boolean,
    default: false
  },
  timeSlots: [timeSlotSchema]
});

const timeRangeSchema = new mongoose.Schema({
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  }
});

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  duration: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'ILS'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  allowedDaysOfWeek: {
    type: [Number],
    default: undefined,
    validate: {
      validator: function(v) {
        if (!v) return true;
        return v.every(day => day >= 0 && day <= 6);
      },
      message: 'allowedDaysOfWeek must contain values between 0-6 (Sunday-Saturday)'
    }
  },
  allowedTimeRanges: {
    type: [timeRangeSchema],
    default: undefined
  },
  color: {
    type: String,
    default: null,
    validate: {
      validator: function(v) {
        if (!v) return true;
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
      },
      message: 'color must be a valid hex color code (e.g., #FF5733)'
    }
  }
});

const availabilitySchema = new mongoose.Schema({
  providerId: {
    type: String,
    required: true,
    index: true
  },
  weeklySchedule: [dayAvailabilitySchema],
  services: [serviceSchema],
  bufferTime: {
    type: Number,
    default: 0
  },
  maxAdvanceBookingDays: {
    type: Number,
    default: 30
  },
  minAdvanceBookingHours: {
    type: Number,
    default: 2
  },
  blockedDates: [{
    date: Date,
    reason: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

availabilitySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Availability = mongoose.model('Availability', availabilitySchema);

module.exports = Availability;
