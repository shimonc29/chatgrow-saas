
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const subscriberSchema = new mongoose.Schema({
    // Basic subscriber information
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    
    // Personal information
    profile: {
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
        dateOfBirth: Date,
        gender: {
            type: String,
            enum: ['male', 'female', 'other']
        },
        city: String,
        interests: [String],
        profileImage: String
    },
    
    // Subscription plan
    subscription: {
        plan: {
            type: String,
            enum: ['free', 'basic', 'premium', 'vip'],
            default: 'free'
        },
        status: {
            type: String,
            enum: ['active', 'suspended', 'cancelled', 'expired'],
            default: 'active'
        },
        startDate: {
            type: Date,
            default: Date.now
        },
        endDate: Date,
        autoRenew: {
            type: Boolean,
            default: false
        },
        features: {
            maxEventsPerMonth: {
                type: Number,
                default: 3
            },
            prioritySupport: {
                type: Boolean,
                default: false
            },
            advancedAnalytics: {
                type: Boolean,
                default: false
            },
            customBranding: {
                type: Boolean,
                default: false
            },
            whatsappIntegration: {
                type: Boolean,
                default: false
            }
        }
    },
    
    // Payment information
    payment: {
        method: {
            type: String,
            enum: ['credit_card', 'paypal', 'bank_transfer', 'bit']
        },
        lastPayment: {
            amount: Number,
            date: Date,
            transactionId: String,
            status: {
                type: String,
                enum: ['completed', 'pending', 'failed']
            }
        },
        billingAddress: {
            street: String,
            city: String,
            state: String,
            zipCode: String,
            country: { type: String, default: 'Israel' }
        }
    },
    
    // Service provider connections
    connectedProviders: [{
        providerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Provider'
        },
        connectionDate: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['active', 'blocked', 'inactive'],
            default: 'active'
        }
    }],
    
    // Event registrations
    registrations: [{
        eventId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Event'
        },
        registrationDate: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['registered', 'attended', 'cancelled', 'no_show'],
            default: 'registered'
        },
        paymentStatus: {
            type: String,
            enum: ['paid', 'pending', 'refunded'],
            default: 'pending'
        }
    }],
    
    // Communication preferences
    preferences: {
        notifications: {
            email: {
                type: Boolean,
                default: true
            },
            whatsapp: {
                type: Boolean,
                default: true
            },
            sms: {
                type: Boolean,
                default: false
            }
        },
        language: {
            type: String,
            default: 'he'
        },
        timezone: {
            type: String,
            default: 'Asia/Jerusalem'
        }
    },
    
    // Usage analytics
    analytics: {
        lastLogin: Date,
        totalEventsAttended: {
            type: Number,
            default: 0
        },
        totalSpent: {
            type: Number,
            default: 0
        },
        favoriteProviders: [String],
        averageRating: {
            type: Number,
            default: 0
        }
    },
    
    // Account status
    status: {
        type: String,
        enum: ['active', 'inactive', 'banned', 'pending_verification'],
        default: 'pending_verification'
    },
    
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    
    emailVerificationToken: String,
    passwordResetToken: String,
    passwordResetExpires: Date,
    
    // Referral system
    referral: {
        referredBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subscriber'
        },
        referralCode: {
            type: String,
            unique: true,
            sparse: true
        },
        referrals: [{
            subscriberId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Subscriber'
            },
            date: {
                type: Date,
                default: Date.now
            },
            bonus: Number
        }]
    }
}, {
    timestamps: true,
    collection: 'subscribers'
});

// Indexes
subscriberSchema.index({ email: 1 });
subscriberSchema.index({ 'subscription.plan': 1, status: 1 });
subscriberSchema.index({ 'referral.referralCode': 1 });

// Virtual for full name
subscriberSchema.virtual('fullName').get(function() {
    return `${this.profile.firstName} ${this.profile.lastName}`;
});

// Pre-save middleware to hash password
subscriberSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Pre-save middleware to generate referral code
subscriberSchema.pre('save', function(next) {
    if (this.isNew && !this.referral.referralCode) {
        this.referral.referralCode = this._id.toString().slice(-8).toUpperCase();
    }
    next();
});

// Instance methods
subscriberSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

subscriberSchema.methods.upgradeSubscription = async function(newPlan) {
    const plans = {
        free: { maxEventsPerMonth: 3, prioritySupport: false, advancedAnalytics: false },
        basic: { maxEventsPerMonth: 10, prioritySupport: false, advancedAnalytics: true },
        premium: { maxEventsPerMonth: 50, prioritySupport: true, advancedAnalytics: true },
        vip: { maxEventsPerMonth: -1, prioritySupport: true, advancedAnalytics: true, customBranding: true }
    };
    
    this.subscription.plan = newPlan;
    this.subscription.features = { ...this.subscription.features, ...plans[newPlan] };
    this.subscription.startDate = new Date();
    
    return await this.save();
};

subscriberSchema.methods.registerForEvent = async function(eventId, paymentStatus = 'pending') {
    this.registrations.push({
        eventId,
        paymentStatus
    });
    return await this.save();
};

subscriberSchema.methods.connectToProvider = async function(providerId) {
    const existing = this.connectedProviders.find(p => p.providerId.toString() === providerId);
    if (!existing) {
        this.connectedProviders.push({ providerId });
        return await this.save();
    }
    return this;
};

// Static methods
subscriberSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase() });
};

subscriberSchema.statics.findByReferralCode = function(code) {
    return this.findOne({ 'referral.referralCode': code });
};

subscriberSchema.statics.getSubscriptionStats = function() {
    return this.aggregate([
        {
            $group: {
                _id: '$subscription.plan',
                count: { $sum: 1 },
                activeCount: {
                    $sum: {
                        $cond: [{ $eq: ['$subscription.status', 'active'] }, 1, 0]
                    }
                }
            }
        }
    ]);
};

const Subscriber = mongoose.model('Subscriber', subscriberSchema);
module.exports = Subscriber;
