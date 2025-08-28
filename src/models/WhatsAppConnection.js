const mongoose = require('mongoose');
const { logInfo, logError, logDebug } = require('../utils/logger');

const whatsAppConnectionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    connectionId: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function(connectionId) {
                return /^[a-zA-Z0-9_-]{8,32}$/.test(connectionId);
            },
            message: 'Connection ID must be 8-32 characters long and contain only letters, numbers, underscores, and hyphens'
        }
    },
    name: {
        type: String,
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    phoneNumber: {
        type: String,
        trim: true,
        validate: {
            validator: function(phone) {
                if (!phone) return true; // Optional field
                return /^\+?[1-9]\d{1,14}$/.test(phone.replace(/\s/g, ''));
            },
            message: 'Please provide a valid phone number'
        }
    },
    status: {
        type: String,
        enum: ['disconnected', 'connecting', 'connected', 'authenticating', 'authenticated', 'error', 'blocked', 'maintenance'],
        default: 'disconnected'
    },
    qrCode: {
        type: String,
        maxlength: [10000, 'QR code data too large']
    },
    qrCodeExpiresAt: {
        type: Date
    },
    sessionData: {
        type: String,
        maxlength: [50000, 'Session data too large']
    },
    sessionPath: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    lastHeartbeat: {
        type: Date,
        default: Date.now
    },
    lastMessageSent: {
        type: Date
    },
    lastMessageReceived: {
        type: Date
    },
    connectionInfo: {
        platform: String,
        version: String,
        browser: String,
        userAgent: String,
        deviceInfo: {
            type: mongoose.Schema.Types.Mixed
        }
    },
    settings: {
        autoReconnect: {
            type: Boolean,
            default: true
        },
        maxReconnectAttempts: {
            type: Number,
            default: 5,
            min: 1,
            max: 20
        },
        reconnectInterval: {
            type: Number,
            default: 30000, // 30 seconds
            min: 5000,
            max: 300000
        },
        messageRetryAttempts: {
            type: Number,
            default: 3,
            min: 1,
            max: 10
        },
        messageRetryDelay: {
            type: Number,
            default: 5000, // 5 seconds
            min: 1000,
            max: 60000
        },
        enableLogging: {
            type: Boolean,
            default: true
        },
        enableNotifications: {
            type: Boolean,
            default: true
        }
    },
    stats: {
        totalMessagesSent: {
            type: Number,
            default: 0
        },
        totalMessagesReceived: {
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
        connectionUptime: {
            type: Number,
            default: 0 // in seconds
        },
        lastConnectedAt: {
            type: Date
        },
        reconnectCount: {
            type: Number,
            default: 0
        },
        errorCount: {
            type: Number,
            default: 0
        }
    },
    errorInfo: {
        lastError: {
            type: String
        },
        lastErrorAt: {
            type: Date
        },
        errorCount: {
            type: Number,
            default: 0
        },
        errorHistory: [{
            error: String,
            timestamp: {
                type: Date,
                default: Date.now
            },
            context: mongoose.Schema.Types.Mixed
        }]
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true,
    collection: 'whatsapp_connections'
});

// Indexes for better query performance
whatsAppConnectionSchema.index({ userId: 1, isActive: 1 });
whatsAppConnectionSchema.index({ status: 1, lastHeartbeat: 1 });
whatsAppConnectionSchema.index({ connectionId: 1, userId: 1 });
whatsAppConnectionSchema.index({ isDefault: 1, userId: 1 });
whatsAppConnectionSchema.index({ createdAt: -1 });
whatsAppConnectionSchema.index({ lastHeartbeat: -1 });

// Virtual fields
whatsAppConnectionSchema.virtual('isConnected').get(function() {
    return this.status === 'connected' || this.status === 'authenticated';
});

whatsAppConnectionSchema.virtual('isAuthenticated').get(function() {
    return this.status === 'authenticated';
});

whatsAppConnectionSchema.virtual('canSendMessages').get(function() {
    return this.isActive && this.isAuthenticated && this.status !== 'blocked';
});

whatsAppConnectionSchema.virtual('uptimeFormatted').get(function() {
    if (!this.stats.connectionUptime) return '0s';
    const hours = Math.floor(this.stats.connectionUptime / 3600);
    const minutes = Math.floor((this.stats.connectionUptime % 3600) / 60);
    const seconds = this.stats.connectionUptime % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
});

// Pre-save middleware
whatsAppConnectionSchema.pre('save', function(next) {
    // Update lastHeartbeat if status changed to connected
    if (this.isModified('status') && this.status === 'connected') {
        this.lastHeartbeat = new Date();
        this.stats.lastConnectedAt = new Date();
    }
    
    // Update uptime if status changed
    if (this.isModified('status')) {
        if (this.status === 'connected' || this.status === 'authenticated') {
            this.stats.lastConnectedAt = new Date();
        }
    }
    
    next();
});

// Instance methods
whatsAppConnectionSchema.methods.updateHeartbeat = async function() {
    this.lastHeartbeat = new Date();
    if (this.isConnected) {
        const now = new Date();
        if (this.stats.lastConnectedAt) {
            const uptimeDiff = Math.floor((now - this.stats.lastConnectedAt) / 1000);
            this.stats.connectionUptime += uptimeDiff;
        }
        this.stats.lastConnectedAt = now;
    }
    return await this.save();
};

whatsAppConnectionSchema.methods.updateStatus = async function(status, error = null) {
    const oldStatus = this.status;
    this.status = status;
    
    if (error) {
        this.errorInfo.lastError = error;
        this.errorInfo.lastErrorAt = new Date();
        this.errorInfo.errorCount += 1;
        this.errorInfo.errorHistory.push({
            error,
            timestamp: new Date(),
            context: { oldStatus, newStatus: status }
        });
        
        // Keep only last 10 errors
        if (this.errorInfo.errorHistory.length > 10) {
            this.errorInfo.errorHistory = this.errorInfo.errorHistory.slice(-10);
        }
    }
    
    if (status === 'connected' || status === 'authenticated') {
        this.stats.lastConnectedAt = new Date();
    }
    
    await this.save();
    logInfo(`WhatsApp connection status updated`, {
        connectionId: this.connectionId,
        userId: this.userId,
        oldStatus,
        newStatus: status,
        error: error || null
    });
    
    return this;
};

whatsAppConnectionSchema.methods.incrementMessageCount = async function(type = 'sent') {
    switch (type) {
        case 'sent':
            this.stats.totalMessagesSent += 1;
            this.lastMessageSent = new Date();
            break;
        case 'received':
            this.stats.totalMessagesReceived += 1;
            this.lastMessageReceived = new Date();
            break;
        case 'delivered':
            this.stats.totalMessagesDelivered += 1;
            break;
        case 'failed':
            this.stats.totalMessagesFailed += 1;
            break;
    }
    return await this.save();
};

whatsAppConnectionSchema.methods.incrementReconnectCount = async function() {
    this.stats.reconnectCount += 1;
    return await this.save();
};

whatsAppConnectionSchema.methods.setAsDefault = async function() {
    // Remove default from other connections of the same user
    await this.constructor.updateMany(
        { userId: this.userId, _id: { $ne: this._id } },
        { isDefault: false }
    );
    
    this.isDefault = true;
    return await this.save();
};

whatsAppConnectionSchema.methods.getHealthStatus = function() {
    const now = new Date();
    const heartbeatAge = now - this.lastHeartbeat;
    const maxHeartbeatAge = 5 * 60 * 1000; // 5 minutes
    
    return {
        isHealthy: heartbeatAge < maxHeartbeatAge,
        heartbeatAge,
        lastHeartbeat: this.lastHeartbeat,
        status: this.status,
        isActive: this.isActive,
        canSendMessages: this.canSendMessages
    };
};

// Static methods
whatsAppConnectionSchema.statics.findByUserId = function(userId, options = {}) {
    const query = { userId, isActive: true };
    if (options.status) query.status = options.status;
    
    return this.find(query)
        .sort({ isDefault: -1, createdAt: -1 })
        .limit(options.limit || 100);
};

whatsAppConnectionSchema.statics.findDefaultConnection = function(userId) {
    return this.findOne({ userId, isDefault: true, isActive: true });
};

whatsAppConnectionSchema.statics.findActiveConnections = function() {
    return this.find({
        isActive: true,
        status: { $in: ['connected', 'authenticated'] }
    });
};

whatsAppConnectionSchema.statics.findStaleConnections = function(maxAgeMinutes = 10) {
    const cutoff = new Date(Date.now() - (maxAgeMinutes * 60 * 1000));
    return this.find({
        isActive: true,
        lastHeartbeat: { $lt: cutoff }
    });
};

whatsAppConnectionSchema.statics.getConnectionStats = async function(userId = null) {
    const match = userId ? { userId } : {};
    
    const stats = await this.aggregate([
        { $match: { ...match, isActive: true } },
        {
            $group: {
                _id: null,
                totalConnections: { $sum: 1 },
                connectedConnections: {
                    $sum: {
                        $cond: [
                            { $in: ['$status', ['connected', 'authenticated']] },
                            1,
                            0
                        ]
                    }
                },
                totalMessagesSent: { $sum: '$stats.totalMessagesSent' },
                totalMessagesReceived: { $sum: '$stats.totalMessagesReceived' },
                totalMessagesDelivered: { $sum: '$stats.totalMessagesDelivered' },
                totalMessagesFailed: { $sum: '$stats.totalMessagesFailed' },
                totalReconnects: { $sum: '$stats.reconnectCount' },
                totalErrors: { $sum: '$stats.errorCount' }
            }
        }
    ]);
    
    return stats[0] || {
        totalConnections: 0,
        connectedConnections: 0,
        totalMessagesSent: 0,
        totalMessagesReceived: 0,
        totalMessagesDelivered: 0,
        totalMessagesFailed: 0,
        totalReconnects: 0,
        totalErrors: 0
    };
};

whatsAppConnectionSchema.statics.cleanupOldSessions = async function(maxAgeDays = 30) {
    const cutoff = new Date(Date.now() - (maxAgeDays * 24 * 60 * 60 * 1000));
    
    const result = await this.updateMany(
        {
            isActive: false,
            updatedAt: { $lt: cutoff }
        },
        {
            $set: {
                sessionData: null,
                qrCode: null,
                qrCodeExpiresAt: null
            }
        }
    );
    
    logInfo(`Cleaned up old WhatsApp sessions`, {
        modifiedCount: result.modifiedCount,
        maxAgeDays
    });
    
    return result;
};

const WhatsAppConnection = mongoose.model('WhatsAppConnection', whatsAppConnectionSchema);

module.exports = WhatsAppConnection; 