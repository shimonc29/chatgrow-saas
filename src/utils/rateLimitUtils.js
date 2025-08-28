const RateLimit = require('../models/RateLimit');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'rate-limit-utils' },
  transports: [
    new winston.transports.File({ filename: 'logs/rate-limit-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/rate-limit-combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// In-memory cache for rate limit data (for performance)
const rateLimitCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Generate random jitter between -range and +range
 * @param {number} range - Jitter range in milliseconds
 * @returns {number} Random jitter value
 */
function generateJitter(range) {
  return Math.floor((Math.random() - 0.5) * 2 * range);
}

/**
 * Calculate next allowed time for sending message
 * @param {Object} rateLimit - Rate limit document
 * @param {number} baseInterval - Base interval in milliseconds
 * @param {number} jitterRange - Jitter range in milliseconds
 * @returns {Date} Next allowed time
 */
function calculateNextAllowedTime(rateLimit, baseInterval, jitterRange) {
  const now = new Date();
  const jitter = generateJitter(jitterRange);
  const interval = Math.max(baseInterval + jitter, 1000); // Minimum 1 second
  
  // Update the current interval in the rate limit
  rateLimit.currentInterval = interval;
  
  const nextTime = new Date(now.getTime() + interval);
  return nextTime;
}

/**
 * Get rate limit data for connection (from cache or database)
 * @param {string} connectionId - Connection identifier
 * @returns {Promise<Object>} Rate limit data
 */
async function getRateLimitData(connectionId) {
  try {
    // Check cache first
    const cached = rateLimitCache.get(connectionId);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      return cached.data;
    }
    
    // Get from database
    const rateLimit = await RateLimit.findOrCreate(connectionId);
    
    // Reset daily count if needed
    rateLimit.resetDailyCountIfNeeded();
    
    // Cache the data
    rateLimitCache.set(connectionId, {
      data: rateLimit,
      timestamp: Date.now()
    });
    
    return rateLimit;
    
  } catch (error) {
    logger.error('Failed to get rate limit data:', {
      connectionId,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Check if connection can send message now
 * @param {string} connectionId - Connection identifier
 * @returns {Promise<Object>} Check result with delay and status
 */
async function canSendMessage(connectionId) {
  try {
    const rateLimit = await getRateLimitData(connectionId);
    
    // Check if connection is blocked
    if (rateLimit.isBlocked()) {
      return {
        canSend: false,
        delay: 0,
        reason: `Connection is ${rateLimit.status}`,
        status: rateLimit.status,
        nextAllowedTime: rateLimit.nextAllowedTime,
        stats: rateLimit.getStats()
      };
    }
    
    const now = new Date();
    const timeUntilNext = rateLimit.getTimeUntilNextAllowed();
    
    if (timeUntilNext > 0) {
      return {
        canSend: false,
        delay: timeUntilNext,
        reason: 'Rate limit active',
        status: rateLimit.status,
        nextAllowedTime: rateLimit.nextAllowedTime,
        stats: rateLimit.getStats()
      };
    }
    
    return {
      canSend: true,
      delay: 0,
      reason: 'Ready to send',
      status: rateLimit.status,
      nextAllowedTime: rateLimit.nextAllowedTime,
      stats: rateLimit.getStats()
    };
    
  } catch (error) {
    logger.error('Failed to check if can send message:', {
      connectionId,
      error: error.message
    });
    throw error;
  }
}

/**
 * Update rate limit after sending message
 * @param {string} connectionId - Connection identifier
 * @param {number} baseInterval - Base interval in milliseconds
 * @param {number} jitterRange - Jitter range in milliseconds
 * @returns {Promise<Object>} Updated rate limit data
 */
async function updateRateLimitAfterMessage(connectionId, baseInterval = 30000, jitterRange = 10000) {
  try {
    const rateLimit = await getRateLimitData(connectionId);
    
    // Increment message count
    rateLimit.incrementMessageCount();
    
    // Calculate next allowed time
    const nextAllowedTime = calculateNextAllowedTime(rateLimit, baseInterval, jitterRange);
    rateLimit.nextAllowedTime = nextAllowedTime;
    
    // Save to database
    await rateLimit.save();
    
    // Update cache
    rateLimitCache.set(connectionId, {
      data: rateLimit,
      timestamp: Date.now()
    });
    
    // Log the update
    logger.info('Rate limit updated after message:', {
      connectionId,
      messageCount: rateLimit.messageCount,
      dailyMessageCount: rateLimit.dailyMessageCount,
      status: rateLimit.status,
      nextAllowedTime: nextAllowedTime.toISOString(),
      currentInterval: rateLimit.currentInterval
    });
    
    // Check for warnings
    if (rateLimit.isWarning()) {
      logger.warn('Connection approaching daily limit:', {
        connectionId,
        dailyMessageCount: rateLimit.dailyMessageCount,
        dailyLimit: rateLimit.rateLimitConfig.dailyLimit,
        warningThreshold: rateLimit.rateLimitConfig.warningThreshold
      });
    }
    
    // Check for blocking
    if (rateLimit.status === 'blocked') {
      logger.error('Connection blocked due to daily limit:', {
        connectionId,
        dailyMessageCount: rateLimit.dailyMessageCount,
        dailyLimit: rateLimit.rateLimitConfig.dailyLimit
      });
    }
    
    return {
      success: true,
      nextAllowedTime: nextAllowedTime,
      stats: rateLimit.getStats()
    };
    
  } catch (error) {
    logger.error('Failed to update rate limit after message:', {
      connectionId,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Get rate limit status for connection
 * @param {string} connectionId - Connection identifier
 * @returns {Promise<Object>} Rate limit status
 */
async function getRateLimitStatus(connectionId) {
  try {
    const rateLimit = await getRateLimitData(connectionId);
    const checkResult = await canSendMessage(connectionId);
    
    return {
      connectionId,
      ...checkResult,
      stats: rateLimit.getStats(),
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    logger.error('Failed to get rate limit status:', {
      connectionId,
      error: error.message
    });
    throw error;
  }
}

/**
 * Pause rate limit for connection
 * @param {string} connectionId - Connection identifier
 * @returns {Promise<Object>} Pause result
 */
async function pauseRateLimit(connectionId) {
  try {
    const rateLimit = await getRateLimitData(connectionId);
    rateLimit.pause();
    await rateLimit.save();
    
    // Update cache
    rateLimitCache.set(connectionId, {
      data: rateLimit,
      timestamp: Date.now()
    });
    
    logger.info('Rate limit paused:', {
      connectionId,
      status: rateLimit.status
    });
    
    return {
      success: true,
      message: 'Rate limit paused successfully',
      status: rateLimit.status
    };
    
  } catch (error) {
    logger.error('Failed to pause rate limit:', {
      connectionId,
      error: error.message
    });
    throw error;
  }
}

/**
 * Resume rate limit for connection
 * @param {string} connectionId - Connection identifier
 * @returns {Promise<Object>} Resume result
 */
async function resumeRateLimit(connectionId) {
  try {
    const rateLimit = await getRateLimitData(connectionId);
    rateLimit.resume();
    await rateLimit.save();
    
    // Update cache
    rateLimitCache.set(connectionId, {
      data: rateLimit,
      timestamp: Date.now()
    });
    
    logger.info('Rate limit resumed:', {
      connectionId,
      status: rateLimit.status
    });
    
    return {
      success: true,
      message: 'Rate limit resumed successfully',
      status: rateLimit.status
    };
    
  } catch (error) {
    logger.error('Failed to resume rate limit:', {
      connectionId,
      error: error.message
    });
    throw error;
  }
}

/**
 * Reset rate limit for connection
 * @param {string} connectionId - Connection identifier
 * @returns {Promise<Object>} Reset result
 */
async function resetRateLimit(connectionId) {
  try {
    const rateLimit = await getRateLimitData(connectionId);
    
    // Reset counters
    rateLimit.messageCount = 0;
    rateLimit.dailyMessageCount = 0;
    rateLimit.warningCount = 0;
    rateLimit.blockCount = 0;
    rateLimit.status = 'active';
    rateLimit.lastMessageTime = null;
    rateLimit.nextAllowedTime = new Date();
    rateLimit.lastDailyReset = new Date();
    
    await rateLimit.save();
    
    // Update cache
    rateLimitCache.set(connectionId, {
      data: rateLimit,
      timestamp: Date.now()
    });
    
    logger.info('Rate limit reset:', {
      connectionId,
      status: rateLimit.status
    });
    
    return {
      success: true,
      message: 'Rate limit reset successfully',
      stats: rateLimit.getStats()
    };
    
  } catch (error) {
    logger.error('Failed to reset rate limit:', {
      connectionId,
      error: error.message
    });
    throw error;
  }
}

/**
 * Clean old cache entries
 */
function cleanCache() {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [connectionId, cached] of rateLimitCache.entries()) {
    if (now - cached.timestamp > CACHE_TTL) {
      rateLimitCache.delete(connectionId);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    logger.info('Cleaned old cache entries:', { cleanedCount });
  }
}

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
function getCacheStats() {
  return {
    size: rateLimitCache.size,
    maxAge: CACHE_TTL,
    entries: Array.from(rateLimitCache.keys())
  };
}

/**
 * Clear entire cache
 */
function clearCache() {
  const size = rateLimitCache.size;
  rateLimitCache.clear();
  logger.info('Cache cleared:', { clearedEntries: size });
}

// Run cache cleanup every 10 minutes
setInterval(cleanCache, 10 * 60 * 1000);

// Run database cleanup every day at 2 AM
setInterval(async () => {
  try {
    const now = new Date();
    if (now.getHours() === 2 && now.getMinutes() === 0) {
      const result = await RateLimit.cleanOldRecords();
      logger.info('Cleaned old rate limit records:', result);
    }
  } catch (error) {
    logger.error('Failed to clean old records:', error);
  }
}, 60 * 1000); // Check every minute

module.exports = {
  generateJitter,
  calculateNextAllowedTime,
  getRateLimitData,
  canSendMessage,
  updateRateLimitAfterMessage,
  getRateLimitStatus,
  pauseRateLimit,
  resumeRateLimit,
  resetRateLimit,
  cleanCache,
  getCacheStats,
  clearCache,
  logger
}; 