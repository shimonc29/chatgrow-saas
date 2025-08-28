
const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
    // Basic registration info
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    businessId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Participant information
    participant: {
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
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },
        phone: {
            type: String,
            required: true,
            trim: true
        },
        dateOfBirth: Date,
        gender: {
            type: String,
            enum: ['male', 'female', 'other', 'prefer_not_to_say']
        },
        emergencyContact: {
            name: String,
            phone: String,
            relationship: String
        }
    },
    
    // Registration details
    registrationNumber: {
        type: String,
        unique: true,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'waitlisted', 'attended', 'no_show'],
        default: 'pending'
    },
    registrationDate: {
        type: Date,
        default: Date.now
    },
    confirmationDate: Date,
    cancellationDate: Date,
    cancellationReason: String,
    
    // Waiting list
    waitlistPosition: Number,
    waitlistDate: Date,
    
    // Payment information
    payment: {
        status: {
            type: String,
            enum: ['pending', 'paid', 'refunded', 'failed', 'waived'],
            default: 'pending'
        },
        amount: {
            type: Number,
            min: 0
        },
        method: {
            type: String,
            enum: ['cash', 'credit_card', 'bank_transfer', 'paypal', 'bit']
        },
        transactionId: String,
        paidAt: Date,
        refundedAt: Date,
        refundAmount: Number
    },
    
    // Custom field responses
    customFieldResponses: [{
        fieldName: String,
        value: mongoose.Schema.Types.Mixed
    }],
    
    // Attendance tracking
    attendance: {
        checkedIn: {
            type: Boolean,
            default: false
        },
        checkInTime: Date,
        checkInMethod: {
            type: String,
            enum: ['manual', 'qr_code', 'phone']
        },
        notes: String
    },
    
    // Communication tracking
    communications: [{
        type: {
            type: String,
            enum: ['confirmation', 'reminder', 'cancellation', 'custom'],
            required: true
        },
        method: {
            type: String,
            enum: ['whatsapp', 'email', 'sms'],
            required: true
        },
        sentAt: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['sent', 'delivered', 'read', 'failed'],
            default: 'sent'
        },
        messageId: String,
        content: String
    }],
    
    // Feedback and rating
    feedback: {
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        comment: String,
        submittedAt: Date,
        wouldRecommend: Boolean
    },
    
    // Source tracking
    source: {
        type: String,
        enum: ['website', 'whatsapp', 'phone', 'email', 'social_media', 'referral', 'walk_in'],
        default: 'website'
    },
    referralCode: String,
    
    // Metadata
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true,
    collection: 'registrations'
});

// Indexes
registrationSchema.index({ eventId: 1, status: 1 });
registrationSchema.index({ businessId: 1, status: 1 });
registrationSchema.index({ 'participant.email': 1 });
registrationSchema.index({ 'participant.phone': 1 });
registrationSchema.index({ registrationNumber: 1 });
registrationSchema.index({ registrationDate: -1 });

// Virtual fields
registrationSchema.virtual('participant.fullName').get(function() {
    return `${this.participant.firstName} ${this.participant.lastName}`;
});

registrationSchema.virtual('isConfirmed').get(function() {
    return this.status === 'confirmed';
});

registrationSchema.virtual('isPaid').get(function() {
    return this.payment.status === 'paid';
});

// Pre-save middleware to generate registration number
registrationSchema.pre('save', async function(next) {
    if (this.isNew && !this.registrationNumber) {
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.registrationNumber = `REG-${date}-${random}`;
    }
    next();
});

// Instance methods
registrationSchema.methods.confirm = async function() {
    this.status = 'confirmed';
    this.confirmationDate = new Date();
    return await this.save();
};

registrationSchema.methods.cancel = async function(reason = '') {
    this.status = 'cancelled';
    this.cancellationDate = new Date();
    this.cancellationReason = reason;
    return await this.save();
};

registrationSchema.methods.checkIn = async function(method = 'manual', notes = '') {
    this.attendance.checkedIn = true;
    this.attendance.checkInTime = new Date();
    this.attendance.checkInMethod = method;
    this.attendance.notes = notes;
    this.status = 'attended';
    return await this.save();
};

registrationSchema.methods.addCommunication = async function(type, method, content, messageId = null) {
    this.communications.push({
        type,
        method,
        content,
        messageId,
        sentAt: new Date()
    });
    return await this.save();
};

registrationSchema.methods.addFeedback = async function(rating, comment, wouldRecommend) {
    this.feedback = {
        rating,
        comment,
        wouldRecommend,
        submittedAt: new Date()
    };
    return await this.save();
};

registrationSchema.methods.markPaid = async function(amount, method, transactionId) {
    this.payment.status = 'paid';
    this.payment.amount = amount;
    this.payment.method = method;
    this.payment.transactionId = transactionId;
    this.payment.paidAt = new Date();
    return await this.save();
};

// Static methods
registrationSchema.statics.findByEvent = function(eventId, status = null) {
    const query = { eventId };
    if (status) query.status = status;
    return this.find(query).sort({ registrationDate: -1 });
};

registrationSchema.statics.findByBusiness = function(businessId, status = null) {
    const query = { businessId };
    if (status) query.status = status;
    return this.find(query).sort({ registrationDate: -1 });
};

registrationSchema.statics.getEventStats = function(eventId) {
    return this.aggregate([
        { $match: { eventId: mongoose.Types.ObjectId(eventId) } },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalRevenue: { $sum: '$payment.amount' }
            }
        }
    ]);
};

const Registration = mongoose.model('Registration', registrationSchema);
module.exports = Registration;
