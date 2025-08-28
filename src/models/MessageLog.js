const mongoose = require('mongoose');

const messageLogSchema = new mongoose.Schema({
    // Basic message information
    messageId: {
        type: String,
        required: true,
        unique: true
    },
    connectionId: {
        type: String,
        required: true
    },
    recipient: {
        type: String,
        required: true
    },
    messageContent: {
        type: String,
        required: true
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'video', 'audio', 'document', 'location', 'contact'],
        default: 'text'
    },
    
    // Status tracking
    status: {
        type: String,
        enum: ['pending', 'sent', 'delivered', 'read', 'failed', 'cancelled'],
        default: 'pending'
    },
    
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    sentAt: {
        type: Date
    },
    deliveredAt: {
        type: Date
    },
    readAt: {
        type: Date
    },
    failedAt: {
        type: Date
    },
    
    // Error information
    error: {
        code: String,
        message: String,
        details: mongoose.Schema.Types.Mixed
    },
    
    // Retry information
    retryCount: {
        type: Number,
        default: 0
    },
    maxRetries: {
        type: Number,
        default: 3
    },
    
    // Queue information
    queueJobId: {
        type: String
    },
    queueStatus: {
        type: String,
        enum: ['queued', 'processing', 'completed', 'failed', 'cancelled'],
        default: 'queued'
    },
    
    // Performance metrics
    processingTime: {
        type: Number, // in milliseconds
        default: 0
    },
    deliveryTime: {
        type: Number, // time from sent to delivered in milliseconds
        default: 0
    },
    
    // Metadata
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    
    // User/client information
    userId: {
        type: String
    },
    clientId: {
        type: String
    },
    
    // WhatsApp specific fields
    whatsappMessageId: {
        type: String
    },
    chatId: {
        type: String
    },
    
    // Rate limiting information
    rateLimitInfo: {
        wasRateLimited: {
            type: Boolean,
            default: false
        },
        rateLimitDelay: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true,
    collection: 'message_logs'
});

// Indexes for better query performance
messageLogSchema.index({ connectionId: 1, createdAt: -1 });
messageLogSchema.index({ status: 1, createdAt: -1 });
messageLogSchema.index({ recipient: 1, createdAt: -1 });
messageLogSchema.index({ userId: 1, createdAt: -1 });
messageLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days TTL

// Static methods
messageLogSchema.statics.findByConnectionId = function(connectionId, limit = 100, skip = 0) {
    return this.find({ connectionId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);
};

messageLogSchema.statics.findByRecipient = function(recipient, limit = 100, skip = 0) {
    return this.find({ recipient })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);
};

messageLogSchema.statics.findByStatus = function(status, limit = 100, skip = 0) {
    return this.find({ status })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);
};

messageLogSchema.statics.getStatsByConnection = function(connectionId, startDate, endDate) {
    const matchStage = {
        connectionId,
        createdAt: {
            $gte: startDate,
            $lte: endDate
        }
    };
    
    return this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                avgProcessingTime: { $avg: '$processingTime' },
                avgDeliveryTime: { $avg: '$deliveryTime' }
            }
        }
    ]);
};

messageLogSchema.statics.getDailyStats = function(startDate, endDate) {
    return this.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: startDate,
                    $lte: endDate
                }
            }
        },
        {
            $group: {
                _id: {
                    date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    status: '$status'
                },
                count: { $sum: 1 },
                avgProcessingTime: { $avg: '$processingTime' },
                avgDeliveryTime: { $avg: '$deliveryTime' }
            }
        },
        {
            $group: {
                _id: '$_id.date',
                stats: {
                    $push: {
                        status: '$_id.status',
                        count: '$count',
                        avgProcessingTime: '$avgProcessingTime',
                        avgDeliveryTime: '$avgDeliveryTime'
                    }
                },
                totalMessages: { $sum: '$count' }
            }
        },
        { $sort: { _id: 1 } }
    ]);
};

messageLogSchema.statics.getFailedMessages = function(limit = 100, skip = 0) {
    return this.find({ status: 'failed' })
        .sort({ failedAt: -1 })
        .limit(limit)
        .skip(skip);
};

messageLogSchema.statics.cleanOldLogs = function(daysToKeep = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    return this.deleteMany({
        createdAt: { $lt: cutoffDate }
    });
};

// Instance methods
messageLogSchema.methods.updateStatus = function(newStatus, additionalData = {}) {
    this.status = newStatus;
    
    switch (newStatus) {
        case 'sent':
            this.sentAt = new Date();
            break;
        case 'delivered':
            this.deliveredAt = new Date();
            if (this.sentAt) {
                this.deliveryTime = this.deliveredAt.getTime() - this.sentAt.getTime();
            }
            break;
        case 'read':
            this.readAt = new Date();
            break;
        case 'failed':
            this.failedAt = new Date();
            if (additionalData.error) {
                this.error = additionalData.error;
            }
            break;
    }
    
    if (additionalData.processingTime) {
        this.processingTime = additionalData.processingTime;
    }
    
    if (additionalData.whatsappMessageId) {
        this.whatsappMessageId = additionalData.whatsappMessageId;
    }
    
    if (additionalData.chatId) {
        this.chatId = additionalData.chatId;
    }
    
    return this.save();
};

messageLogSchema.methods.incrementRetry = function() {
    this.retryCount += 1;
    return this.save();
};

messageLogSchema.methods.setRateLimitInfo = function(delay, wasLimited = true) {
    this.rateLimitInfo = {
        wasRateLimited: wasLimited,
        rateLimitDelay: delay
    };
    return this.save();
};

// Virtual for calculating delivery success rate
messageLogSchema.virtual('isSuccessful').get(function() {
    return ['delivered', 'read'].includes(this.status);
});

// Pre-save middleware
messageLogSchema.pre('save', function(next) {
    // Auto-generate messageId if not provided
    if (!this.messageId) {
        this.messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    next();
});

// Create the model
const MessageLog = mongoose.model('MessageLog', messageLogSchema);

module.exports = MessageLog; 