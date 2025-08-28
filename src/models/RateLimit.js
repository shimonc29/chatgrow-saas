const mongoose = require('mongoose');

const rateLimitSchema = new mongoose.Schema({
  connectionId: {
    type: String,
    required: true,
    unique: true
  },
  
  lastMessageTime: {
    type: Date,
    default: null
  },
  
  messageCount: {
    type: Number,
    default: 0
  },
  
  dailyMessageCount: {
    type: Number,
    default: 0
  },
  
  lastDailyReset: {
    type: Date,
    default: Date.now
  },
  
  status: {
    type: String,
    enum: ['active', 'warning', 'blocked', 'paused'],
    default: 'active'
  },
  
  warningCount: {
    type: Number,
    default: 0
  },
  
  blockCount: {
    type: Number,
    default: 0
  },
  
  lastWarningTime: {
    type: Date,
    default: null
  },
  
  lastBlockTime: {
    type: Date,
    default: null
  },
  
  rateLimitConfig: {
    baseInterval: {
      type: Number,
      default: 30000 // 30 seconds
    },
    maxInterval: {
      type: Number,
      default: 45000 // 45 seconds
    },
    jitterRange: {
      type: Number,
      default: 10000 // 10 seconds
    },
    dailyLimit: {
      type: Number,
      default: 1000 // 1000 messages per day
    },
    warningThreshold: {
      type: Number,
      default: 800 // Warning at 80% of daily limit
    }
  },
  
  currentInterval: {
    type: Number,
    default: 30000
  },
  
  nextAllowedTime: {
    type: Date,
    default: null
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better performance
rateLimitSchema.index({ connectionId: 1 });
rateLimitSchema.index({ status: 1 });
rateLimitSchema.index({ lastMessageTime: 1 });
rateLimitSchema.index({ nextAllowedTime: 1 });
rateLimitSchema.index({ dailyMessageCount: 1 });

// Pre-save middleware to update timestamps
rateLimitSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to find or create rate limit for connection
rateLimitSchema.statics.findOrCreate = async function(connectionId) {
  let rateLimit = await this.findOne({ connectionId });
  
  if (!rateLimit) {
    rateLimit = new this({
      connectionId,
      lastMessageTime: null,
      messageCount: 0,
      dailyMessageCount: 0,
      lastDailyReset: new Date(),
      status: 'active',
      nextAllowedTime: new Date()
    });
  }
  
  return rateLimit;
};

// Method to reset daily count if needed
rateLimitSchema.methods.resetDailyCountIfNeeded = function() {
  const now = new Date();
  const lastReset = new Date(this.lastDailyReset);
  
  // Reset if it's a new day
  if (now.getDate() !== lastReset.getDate() || 
      now.getMonth() !== lastReset.getMonth() || 
      now.getFullYear() !== lastReset.getFullYear()) {
    
    this.dailyMessageCount = 0;
    this.lastDailyReset = now;
    this.status = 'active'; // Reset status to active on new day
    this.warningCount = 0;
    
    return true;
  }
  
  return false;
};

// Method to check if connection is blocked
rateLimitSchema.methods.isBlocked = function() {
  return this.status === 'blocked' || this.status === 'paused';
};

// Method to check if connection is in warning state
rateLimitSchema.methods.isWarning = function() {
  return this.status === 'warning';
};

// Method to get time until next allowed message
rateLimitSchema.methods.getTimeUntilNextAllowed = function() {
  if (!this.nextAllowedTime) return 0;
  
  const now = new Date();
  const timeDiff = this.nextAllowedTime.getTime() - now.getTime();
  
  return Math.max(0, timeDiff);
};

// Method to update status based on daily count
rateLimitSchema.methods.updateStatus = function() {
  const { dailyLimit, warningThreshold } = this.rateLimitConfig;
  
  if (this.dailyMessageCount >= dailyLimit) {
    this.status = 'blocked';
    this.lastBlockTime = new Date();
    this.blockCount++;
  } else if (this.dailyMessageCount >= warningThreshold) {
    this.status = 'warning';
    this.lastWarningTime = new Date();
    this.warningCount++;
  } else {
    this.status = 'active';
  }
};

// Method to increment message count
rateLimitSchema.methods.incrementMessageCount = function() {
  this.messageCount++;
  this.dailyMessageCount++;
  this.lastMessageTime = new Date();
  this.updateStatus();
};

// Method to pause connection
rateLimitSchema.methods.pause = function() {
  this.status = 'paused';
  this.updatedAt = new Date();
};

// Method to resume connection
rateLimitSchema.methods.resume = function() {
  if (this.status === 'paused') {
    this.status = 'active';
    this.updatedAt = new Date();
  }
};

// Method to get rate limit statistics
rateLimitSchema.methods.getStats = function() {
  return {
    connectionId: this.connectionId,
    status: this.status,
    messageCount: this.messageCount,
    dailyMessageCount: this.dailyMessageCount,
    dailyLimit: this.rateLimitConfig.dailyLimit,
    warningThreshold: this.rateLimitConfig.warningThreshold,
    lastMessageTime: this.lastMessageTime,
    nextAllowedTime: this.nextAllowedTime,
    timeUntilNextAllowed: this.getTimeUntilNextAllowed(),
    warningCount: this.warningCount,
    blockCount: this.blockCount,
    currentInterval: this.currentInterval,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Static method to get all connections with warnings
rateLimitSchema.statics.getWarningConnections = function() {
  return this.find({ status: 'warning' });
};

// Static method to get all blocked connections
rateLimitSchema.statics.getBlockedConnections = function() {
  return this.find({ status: 'blocked' });
};

// Static method to get all paused connections
rateLimitSchema.statics.getPausedConnections = function() {
  return this.find({ status: 'paused' });
};

// Static method to clean old records (older than 30 days)
rateLimitSchema.statics.cleanOldRecords = async function() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const result = await this.deleteMany({
    updatedAt: { $lt: thirtyDaysAgo },
    status: { $in: ['blocked', 'paused'] }
  });
  
  return result;
};

// Static method to get daily statistics
rateLimitSchema.statics.getDailyStats = async function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const stats = await this.aggregate([
    {
      $match: {
        lastDailyReset: { $gte: today }
      }
    },
    {
      $group: {
        _id: null,
        totalConnections: { $sum: 1 },
        totalMessages: { $sum: '$dailyMessageCount' },
        activeConnections: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        warningConnections: {
          $sum: { $cond: [{ $eq: ['$status', 'warning'] }, 1, 0] }
        },
        blockedConnections: {
          $sum: { $cond: [{ $eq: ['$status', 'blocked'] }, 1, 0] }
        },
        pausedConnections: {
          $sum: { $cond: [{ $eq: ['$status', 'paused'] }, 1, 0] }
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalConnections: 0,
    totalMessages: 0,
    activeConnections: 0,
    warningConnections: 0,
    blockedConnections: 0,
    pausedConnections: 0
  };
};

module.exports = mongoose.model('RateLimit', rateLimitSchema); 