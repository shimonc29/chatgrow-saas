const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    // Business association
    businessId: {
        type: String,
        required: true
    },

    // Personal information
    firstName: {
        type: String,
        required: true,
        trim: true,
        maxlength: [50, 'שם פרטי לא יכול לעבור 50 תווים']
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        maxlength: [50, 'שם משפחה לא יכול לעבור 50 תווים']
    },
    phone: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        validate: {
            validator: function(email) {
                if (!email) return true; // Optional field
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(email);
            },
            message: 'כתובת אימייל לא חוקית'
        }
    },
    dateOfBirth: Date,
    gender: {
        type: String,
        enum: ['male', 'female', 'other', 'prefer_not_to_say']
    },

    // Contact preferences
    preferredContactMethod: {
        type: String,
        enum: ['phone', 'whatsapp', 'email', 'sms'],
        default: 'whatsapp'
    },
    communicationPreferences: {
        reminders: {
            type: Boolean,
            default: true
        },
        promotions: {
            type: Boolean,
            default: false
        },
        newsletters: {
            type: Boolean,
            default: false
        }
    },

    // Address information
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: {
            type: String,
            default: 'Israel'
        }
    },

    // Customer status and classification
    status: {
        type: String,
        enum: ['active', 'inactive', 'blocked', 'vip'],
        default: 'active'
    },
    customerType: {
        type: String,
        enum: ['regular', 'vip', 'corporate', 'student'],
        default: 'regular'
    },
    source: {
        type: String,
        enum: ['walk_in', 'referral', 'online', 'social_media', 'advertisement', 'other'],
        default: 'walk_in'
    },
    referredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer'
    },

    // Service preferences and history
    servicePreferences: {
        preferredServices: [String],
        specialRequests: String,
        allergies: [String],
        medicalConditions: String,
        notes: String
    },

    // Financial information
    financialInfo: {
        totalSpent: {
            type: Number,
            default: 0
        },
        averageSpent: {
            type: Number,
            default: 0
        },
        lastPaymentDate: Date,
        paymentMethod: {
            type: String,
            enum: ['cash', 'credit_card', 'bank_transfer', 'paypal', 'bit']
        },
        creditLimit: {
            type: Number,
            default: 0
        },
        outstandingBalance: {
            type: Number,
            default: 0
        }
    },

    // Visit tracking
    visitHistory: {
        firstVisit: {
            type: Date,
            default: Date.now
        },
        lastVisit: Date,
        totalVisits: {
            type: Number,
            default: 0
        },
        noShowCount: {
            type: Number,
            default: 0
        },
        cancellationCount: {
            type: Number,
            default: 0
        }
    },

    // Rating and feedback
    customerRating: {
        averageRating: {
            type: Number,
            min: 1,
            max: 5
        },
        totalRatings: {
            type: Number,
            default: 0
        },
        feedback: [{
            date: {
                type: Date,
                default: Date.now
            },
            rating: {
                type: Number,
                min: 1,
                max: 5
            },
            comment: String,
            appointmentId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Appointment'
            }
        }]
    },

    // Emergency contact
    emergencyContact: {
        name: String,
        phone: String,
        relationship: String
    },

    // Custom fields for business-specific information
    customFields: [{
        name: String,
        value: String,
        type: {
            type: String,
            enum: ['text', 'number', 'boolean', 'date', 'select']
        }
    }],

    // Communication log
    communicationLog: [{
        type: {
            type: String,
            enum: ['call', 'sms', 'whatsapp', 'email', 'in_person']
        },
        direction: {
            type: String,
            enum: ['inbound', 'outbound']
        },
        subject: String,
        content: String,
        date: {
            type: Date,
            default: Date.now
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],

    // Tags and categories
    tags: [String],
    categories: [String],

    // System information
    isActive: {
        type: Boolean,
        default: true
    }

}, {
    timestamps: true,
    collection: 'customers'
});

// Indexes
customerSchema.index({ businessId: 1, phone: 1 }, { unique: true });
customerSchema.index({ businessId: 1, email: 1 }, { sparse: true });
customerSchema.index({ businessId: 1, status: 1 });
customerSchema.index({ businessId: 1, customerType: 1 });
customerSchema.index({ 'visitHistory.lastVisit': -1 });

// Virtual fields
customerSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

customerSchema.virtual('age').get(function() {
    if (!this.dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
});

customerSchema.virtual('isLoyal').get(function() {
    return this.visitHistory.totalVisits > 5 && this.visitHistory.noShowCount < 2;
});

customerSchema.virtual('riskLevel').get(function() {
    const noShowRate = this.visitHistory.totalVisits > 0 ? 
        this.visitHistory.noShowCount / this.visitHistory.totalVisits : 0;

    if (noShowRate > 0.3) return 'high';
    if (noShowRate > 0.1) return 'medium';
    return 'low';
});

// Instance methods
customerSchema.methods.addVisit = async function() {
    this.visitHistory.totalVisits += 1;
    this.visitHistory.lastVisit = new Date();
    return await this.save();
};

customerSchema.methods.addNoShow = async function() {
    this.visitHistory.noShowCount += 1;
    return await this.save();
};

customerSchema.methods.addCancellation = async function() {
    this.visitHistory.cancellationCount += 1;
    return await this.save();
};

customerSchema.methods.updateFinancials = async function(amount, paymentMethod) {
    this.financialInfo.totalSpent += amount;
    this.financialInfo.averageSpent = this.financialInfo.totalSpent / Math.max(1, this.visitHistory.totalVisits);
    this.financialInfo.lastPaymentDate = new Date();
    if (paymentMethod) {
        this.financialInfo.paymentMethod = paymentMethod;
    }
    return await this.save();
};

customerSchema.methods.addFeedback = async function(rating, comment, appointmentId) {
    this.customerRating.feedback.push({
        rating,
        comment,
        appointmentId,
        date: new Date()
    });

    // Update average rating
    const allRatings = this.customerRating.feedback.map(f => f.rating);
    this.customerRating.averageRating = allRatings.reduce((a, b) => a + b, 0) / allRatings.length;
    this.customerRating.totalRatings = allRatings.length;

    return await this.save();
};

customerSchema.methods.addCommunication = function(type, direction, subject, content) {
    this.communicationLog.push({
        type,
        direction,
        subject,
        content,
        date: new Date()
    });
    return this;
};

// Static methods
customerSchema.statics.findByPhone = function(businessId, phone) {
    return this.findOne({ businessId, phone });
};

customerSchema.statics.findByEmail = function(businessId, email) {
    return this.findOne({ businessId, email: email.toLowerCase() });
};

customerSchema.statics.getActiveCustomers = function(businessId) {
    return this.find({ businessId, status: 'active' });
};

customerSchema.statics.getVIPCustomers = function(businessId) {
    return this.find({ 
        businessId, 
        $or: [
            { status: 'vip' },
            { customerType: 'vip' },
            { 'financialInfo.totalSpent': { $gte: 1000 } },
            { 'visitHistory.totalVisits': { $gte: 10 } }
        ]
    });
};

customerSchema.statics.getCustomerStats = function(businessId) {
    return this.aggregate([
        { $match: { businessId: mongoose.Types.ObjectId(businessId) } },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalRevenue: { $sum: '$financialInfo.totalSpent' },
                avgVisits: { $avg: '$visitHistory.totalVisits' }
            }
        }
    ]);
};

customerSchema.statics.searchCustomers = function(businessId, searchTerm) {
    const regex = new RegExp(searchTerm, 'i');
    return this.find({
        businessId,
        $or: [
            { firstName: regex },
            { lastName: regex },
            { phone: regex },
            { email: regex }
        ]
    });
};

const Customer = mongoose.model('Customer', customerSchema);
module.exports = Customer;