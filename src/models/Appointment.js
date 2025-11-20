const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    // Business and service info
    businessId: {
        type: String,
        required: true
    },
    serviceType: {
        type: String,
        required: true,
        enum: ['consultation', 'treatment', 'lesson', 'workshop', 'photo_session', 'repair', 'meeting', 'other'],
        default: 'consultation'
    },
    serviceName: {
        type: String,
        required: true,
        trim: true,
        maxlength: [100, 'שם השירות לא יכול לעבור 100 תווים']
    },

    // Customer information
    customer: {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer'
        },
        firstName: {
            type: String,
            required: true,
            trim: true
        },
        lastName: {
            type: String,
            required: true,
            trim: true
        },
        phone: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            trim: true,
            lowercase: true
        },
        notes: String
    },

    // Appointment scheduling
    appointmentDate: {
        type: Date,
        required: true
    },
    startTime: {
        type: String,
        required: true // Format: "14:30"
    },
    endTime: {
        type: String,
        required: true // Format: "15:30"
    },
    duration: {
        type: Number,
        required: true // minutes
    },

    // Status and management
    status: {
        type: String,
        enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show', 'rescheduled'],
        default: 'scheduled'
    },
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
    },

    // Pricing and payment
    price: {
        type: Number,
        min: 0,
        default: 0
    },
    currency: {
        type: String,
        default: 'ILS'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'partial', 'refunded', 'cancelled'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'credit_card', 'bank_transfer', 'paypal', 'bit', 'apple_pay']
    },

    // Location and method
    appointmentType: {
        type: String,
        enum: ['in_person', 'online', 'phone', 'home_visit'],
        default: 'in_person'
    },
    location: {
        address: String,
        city: String,
        meetingUrl: String, // for online appointments
        additionalInfo: String
    },

    // Reminders and notifications
    reminders: {
        enabled: {
            type: Boolean,
            default: true
        },
        sent: [{
            type: {
                type: String,
                enum: ['sms', 'whatsapp', 'email', 'push']
            },
            sentAt: Date,
            status: {
                type: String,
                enum: ['sent', 'delivered', 'failed']
            }
        }],
        reminderTimes: [{
            type: Number,
            default: [24 * 60, 60] // 24 hours and 1 hour before (in minutes)
        }]
    },

    // Business details
    businessDetails: {
        businessName: String,
        contactPhone: String,
        serviceDescription: String,
        cancellationPolicy: String
    },

    // History and changes
    history: [{
        action: {
            type: String,
            enum: ['created', 'updated', 'confirmed', 'cancelled', 'rescheduled', 'completed', 'payment_updated']
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        details: String,
        previousValues: mongoose.Schema.Types.Mixed
    }],

    // Additional metadata
    notes: String,
    internalNotes: String, // Only visible to business owner
    tags: [String],
    customFields: [{
        name: String,
        value: String,
        type: {
            type: String,
            enum: ['text', 'number', 'boolean', 'date']
        }
    }],

    // System tracking
    source: {
        type: String,
        enum: ['web', 'phone', 'whatsapp', 'admin', 'api'],
        default: 'admin'
    },
    ipAddress: String,
    userAgent: String,

    // Lead source tracking (for acquisition analytics)
    sourceKey: {
        type: String,
        trim: true,
        index: true
    },
    utmSource: {
        type: String,
        trim: true
    },
    utmMedium: {
        type: String,
        trim: true
    },
    utmCampaign: {
        type: String,
        trim: true
    },
    utmTerm: {
        type: String,
        trim: true
    },
    utmContent: {
        type: String,
        trim: true
    },
    referralCode: {
        type: String,
        trim: true,
        index: true
    }

}, {
    timestamps: true,
    collection: 'appointments'
});

// Indexes for performance
appointmentSchema.index({ businessId: 1, appointmentDate: 1 });
appointmentSchema.index({ businessId: 1, status: 1 });
appointmentSchema.index({ appointmentDate: 1, status: 1 });
appointmentSchema.index({ 'customer.phone': 1 });
appointmentSchema.index({ 'customer.email': 1 });
appointmentSchema.index({ status: 1, appointmentDate: 1 });
appointmentSchema.index({ paymentStatus: 1 });

// Virtual fields
appointmentSchema.virtual('customer.fullName').get(function() {
    return `${this.customer.firstName} ${this.customer.lastName}`;
});

appointmentSchema.virtual('isToday').get(function() {
    const today = new Date();
    const appointmentDate = new Date(this.appointmentDate);
    return appointmentDate.toDateString() === today.toDateString();
});

appointmentSchema.virtual('isUpcoming').get(function() {
    return this.appointmentDate > new Date() && this.status === 'confirmed';
});

appointmentSchema.virtual('isPastDue').get(function() {
    return this.appointmentDate < new Date() && this.status === 'scheduled';
});

appointmentSchema.virtual('totalRevenue').get(function() {
    return this.paymentStatus === 'paid' ? this.price : 0;
});

// Instance methods
appointmentSchema.methods.confirm = async function() {
    this.status = 'confirmed';
    this.addToHistory('confirmed', 'התור אושר');
    return await this.save();
};

appointmentSchema.methods.cancel = async function(reason = '') {
    this.status = 'cancelled';
    this.addToHistory('cancelled', reason || 'התור בוטל');
    return await this.save();
};

appointmentSchema.methods.complete = async function() {
    this.status = 'completed';
    this.addToHistory('completed', 'התור הושלם');
    return await this.save();
};

appointmentSchema.methods.reschedule = async function(newDate, newStartTime, newEndTime) {
    const oldDate = this.appointmentDate;
    const oldStart = this.startTime;

    this.appointmentDate = newDate;
    this.startTime = newStartTime;
    this.endTime = newEndTime;
    this.status = 'rescheduled';

    this.addToHistory('rescheduled', 
        `התור הועבר מ-${oldDate.toLocaleDateString()} ${oldStart} לתאריך ${newDate.toLocaleDateString()} ${newStartTime}`
    );

    return await this.save();
};

appointmentSchema.methods.updatePayment = async function(status, method = null) {
    const oldStatus = this.paymentStatus;
    this.paymentStatus = status;
    if (method) this.paymentMethod = method;

    this.addToHistory('payment_updated', 
        `סטטוס תשלום השתנה מ-${oldStatus} ל-${status}`
    );

    return await this.save();
};

appointmentSchema.methods.addToHistory = function(action, details = '') {
    this.history.push({
        action,
        details,
        timestamp: new Date()
    });
};

appointmentSchema.methods.sendReminder = async function(type = 'whatsapp') {
    // This will be implemented with the WhatsApp service
    this.reminders.sent.push({
        type,
        sentAt: new Date(),
        status: 'sent'
    });
    return await this.save();
};

// Static methods
appointmentSchema.statics.getTodayAppointments = function(businessId) {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    return this.find({
        businessId,
        appointmentDate: {
            $gte: startOfDay,
            $lte: endOfDay
        }
    }).sort({ startTime: 1 });
};

appointmentSchema.statics.getUpcomingAppointments = function(businessId, days = 7) {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    return this.find({
        businessId,
        appointmentDate: {
            $gte: now,
            $lte: futureDate
        },
        status: { $in: ['scheduled', 'confirmed'] }
    }).sort({ appointmentDate: 1, startTime: 1 });
};

appointmentSchema.statics.getBusinessStats = function(businessId, startDate, endDate) {
    return this.aggregate([
        {
            $match: {
                businessId: mongoose.Types.ObjectId(businessId),
                appointmentDate: {
                    $gte: startDate,
                    $lte: endDate
                }
            }
        },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalRevenue: { $sum: '$price' },
                avgPrice: { $avg: '$price' }
            }
        }
    ]);
};

appointmentSchema.statics.findAvailableSlots = async function(businessId, date, duration = 60) {
    // This method will find available time slots for a given date
    // Implementation depends on business hours configuration
    const existingAppointments = await this.find({
        businessId,
        appointmentDate: date,
        status: { $in: ['scheduled', 'confirmed'] }
    }).sort({ startTime: 1 });

    return existingAppointments; // Simplified for now
};

const Appointment = mongoose.model('Appointment', appointmentSchema);
module.exports = Appointment;