const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { logInfo, logError, logDebug } = require('../utils/logger');

const userSchema = new mongoose.Schema({
    // Basic user information
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: function(email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(email);
            },
            message: 'Please provide a valid email address'
        }
    },
    
    password: {
        type: String,
        required: true,
        minlength: [8, 'Password must be at least 8 characters long'],
        validate: {
            validator: function(password) {
                // At least one uppercase, one lowercase, one number, one special character
                const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
                return passwordRegex.test(password);
            },
            message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        }
    },

    // User profile
    firstName: {
        type: String,
        trim: true,
        maxlength: [50, 'First name cannot exceed 50 characters']
    },
    
    lastName: {
        type: String,
        trim: true,
        maxlength: [50, 'Last name cannot exceed 50 characters']
    },

    // Subscription and plan information
    plan: {
        type: String,
        enum: ['free', 'basic', 'premium', 'enterprise'],
        default: 'free'
    },

    planDetails: {
        maxConnections: {
            type: Number,
            default: 1
        },
        maxMessagesPerDay: {
            type: Number,
            default: 100
        },
        features: [{
            type: String,
            enum: ['basic_messaging', 'bulk_messaging', 'analytics', 'api_access', 'priority_support', 'custom_integrations']
        }],
        expiresAt: {
            type: Date
        }
    },

    // WhatsApp connections
    connectionIds: [{
        type: String
    }],

    // Account status and timestamps
    isActive: {
        type: Boolean,
        default: true
    },

    isEmailVerified: {
        type: Boolean,
        default: false
    },

    emailVerificationToken: {
        type: String
    },

    emailVerificationExpires: {
        type: Date
    },

    passwordResetToken: {
        type: String
    },

    passwordResetExpires: {
        type: Date
    },

    lastLogin: {
        type: Date,
        default: Date.now
    },

    lastActivity: {
        type: Date,
        default: Date.now
    },

    loginAttempts: {
        type: Number,
        default: 0
    },

    lockUntil: {
        type: Date
    },

    // API access
    apiKeys: [{
        key: {
            type: String,
            unique: true,
            sparse: true
        },
        name: String,
        permissions: [{
            type: String,
            enum: ['read', 'write', 'admin']
        }],
        isActive: {
            type: Boolean,
            default: true
        },
        lastUsed: {
            type: Date
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],

    // Session management
    activeSessions: [{
        sessionId: String,
        deviceInfo: {
            userAgent: String,
            ip: String,
            location: String
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        lastActivity: {
            type: Date,
            default: Date.now
        },
        expiresAt: {
            type: Date
        }
    }],

    // Usage statistics
    usageStats: {
        totalMessagesSent: {
            type: Number,
            default: 0
        },
        totalMessagesDelivered: {
            type: Number,
            default: 0
        },
        totalMessagesFailed: {
            type: Number,
            default: 0
        },
        lastMessageSent: {
            type: Date
        },
        dailyMessageCount: {
            type: Number,
            default: 0
        },
        dailyMessageReset: {
            type: Date,
            default: Date.now
        }
    },

    // Preferences
    preferences: {
        timezone: {
            type: String,
            default: 'UTC'
        },
        language: {
            type: String,
            default: 'en'
        },
        notifications: {
            email: {
                type: Boolean,
                default: true
            },
            push: {
                type: Boolean,
                default: true
            },
            sms: {
                type: Boolean,
                default: false
            }
        }
    },

    // Metadata
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true,
    collection: 'users'
});

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ plan: 1, isActive: 1 });
userSchema.index({ lastLogin: -1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'apiKeys.key': 1 });
userSchema.index({ connectionIds: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
    if (this.firstName && this.lastName) {
        return `${this.firstName} ${this.lastName}`;
    }
    return this.firstName || this.lastName || this.email;
});

// Virtual for account status
userSchema.virtual('isLocked').get(function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Virtual for plan status
userSchema.virtual('isPlanActive').get(function() {
    if (!this.planDetails.expiresAt) return true;
    return this.planDetails.expiresAt > Date.now();
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
    try {
        // Only hash the password if it has been modified (or is new)
        if (!this.isModified('password')) return next();

        // Hash password with salt rounds
        const saltRounds = 12;
        this.password = await bcrypt.hash(this.password, saltRounds);
        
        logDebug('Password hashed for user', { userId: this._id, email: this.email });
        next();
    } catch (error) {
        logError('Error hashing password', error, { userId: this._id, email: this.email });
        next(error);
    }
});

// Pre-save middleware to reset daily message count
userSchema.pre('save', function(next) {
    const now = new Date();
    const lastReset = this.usageStats.dailyMessageReset;
    
    // Reset daily count if it's a new day
    if (!lastReset || lastReset.getDate() !== now.getDate() || 
        lastReset.getMonth() !== now.getMonth() || 
        lastReset.getFullYear() !== now.getFullYear()) {
        this.usageStats.dailyMessageCount = 0;
        this.usageStats.dailyMessageReset = now;
    }
    
    next();
});

// Instance methods
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        const isMatch = await bcrypt.compare(candidatePassword, this.password);
        logDebug('Password comparison result', { 
            userId: this._id, 
            email: this.email, 
            isMatch 
        });
        return isMatch;
    } catch (error) {
        logError('Error comparing passwords', error, { 
            userId: this._id, 
            email: this.email 
        });
        throw error;
    }
};

userSchema.methods.incrementLoginAttempts = async function() {
    // If we have a previous lock that has expired, restart at 1
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return await this.updateOne({
            $unset: { lockUntil: 1 },
            $set: { loginAttempts: 1 }
        });
    }
    
    const updates = { $inc: { loginAttempts: 1 } };
    
    // Lock account after 5 failed attempts for 2 hours
    if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
        updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 };
    }
    
    return await this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = async function() {
    return await this.updateOne({
        $unset: { loginAttempts: 1, lockUntil: 1 }
    });
};

userSchema.methods.updateLastLogin = async function() {
    this.lastLogin = new Date();
    this.lastActivity = new Date();
    return await this.save();
};

userSchema.methods.addConnection = async function(connectionId) {
    if (!this.connectionIds.includes(connectionId)) {
        this.connectionIds.push(connectionId);
        return await this.save();
    }
    return this;
};

userSchema.methods.removeConnection = async function(connectionId) {
    this.connectionIds = this.connectionIds.filter(id => id !== connectionId);
    return await this.save();
};

userSchema.methods.generateApiKey = function(name = 'Default API Key') {
    const crypto = require('crypto');
    const apiKey = crypto.randomBytes(32).toString('hex');
    
    this.apiKeys.push({
        key: apiKey,
        name: name,
        permissions: ['read', 'write'],
        isActive: true,
        createdAt: new Date()
    });
    
    return apiKey;
};

userSchema.methods.revokeApiKey = async function(apiKey) {
    this.apiKeys = this.apiKeys.filter(key => key.key !== apiKey);
    return await this.save();
};

userSchema.methods.addSession = function(sessionId, deviceInfo) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days
    
    this.activeSessions.push({
        sessionId,
        deviceInfo,
        expiresAt
    });
    
    return this;
};

userSchema.methods.removeSession = async function(sessionId) {
    this.activeSessions = this.activeSessions.filter(session => session.sessionId !== sessionId);
    return await this.save();
};

userSchema.methods.cleanExpiredSessions = async function() {
    const now = new Date();
    this.activeSessions = this.activeSessions.filter(session => session.expiresAt > now);
    return await this.save();
};

userSchema.methods.incrementMessageCount = async function(status = 'sent') {
    const updates = {
        $inc: { 'usageStats.totalMessagesSent': 1, 'usageStats.dailyMessageCount': 1 }
    };
    
    if (status === 'delivered') {
        updates.$inc['usageStats.totalMessagesDelivered'] = 1;
    } else if (status === 'failed') {
        updates.$inc['usageStats.totalMessagesFailed'] = 1;
    }
    
    updates.$set = { 'usageStats.lastMessageSent': new Date() };
    
    return await this.updateOne(updates);
};

userSchema.methods.canSendMessage = function() {
    // Check if account is active
    if (!this.isActive) return { canSend: false, reason: 'Account is deactivated' };
    
    // Check if plan is active
    if (!this.isPlanActive) return { canSend: false, reason: 'Plan has expired' };
    
    // Check daily message limit
    if (this.usageStats.dailyMessageCount >= this.planDetails.maxMessagesPerDay) {
        return { canSend: false, reason: 'Daily message limit exceeded' };
    }
    
    return { canSend: true };
};

// Static methods
userSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findByApiKey = function(apiKey) {
    return this.findOne({ 'apiKeys.key': apiKey, 'apiKeys.isActive': true });
};

userSchema.statics.findActiveUsers = function() {
    return this.find({ isActive: true });
};

userSchema.statics.findByPlan = function(plan) {
    return this.find({ plan, isActive: true });
};

userSchema.statics.getUsersWithExpiredPlans = function() {
    return this.find({
        'planDetails.expiresAt': { $lt: new Date() },
        isActive: true
    });
};

userSchema.statics.getUsersByConnectionId = function(connectionId) {
    return this.find({ connectionIds: connectionId });
};

userSchema.statics.getUsageStats = function(startDate, endDate) {
    return this.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: '$plan',
                totalUsers: { $sum: 1 },
                totalMessagesSent: { $sum: '$usageStats.totalMessagesSent' },
                totalMessagesDelivered: { $sum: '$usageStats.totalMessagesDelivered' },
                totalMessagesFailed: { $sum: '$usageStats.totalMessagesFailed' },
                avgMessagesPerUser: { $avg: '$usageStats.totalMessagesSent' }
            }
        }
    ]);
};

userSchema.statics.cleanInactiveSessions = async function() {
    const now = new Date();
    return await this.updateMany(
        {},
        { $pull: { activeSessions: { expiresAt: { $lt: now } } } }
    );
};

userSchema.statics.getLockedAccounts = function() {
    return this.find({
        lockUntil: { $gt: Date.now() }
    });
};

// Create the model
const User = mongoose.model('User', userSchema);

module.exports = User; 