const {
  canSendMessage,
  updateRateLimitAfterMessage,
  getRateLimitStatus,
  pauseRateLimit,
  resumeRateLimit,
  resetRateLimit,
  logger
} = require('../utils/rateLimitUtils');

/**
 * Advanced Rate Limiter Middleware for WhatsApp Messages
 * Prevents WhatsApp blocks with intelligent rate limiting
 */
class RateLimiterMiddleware {
  constructor(options = {}) {
    this.options = {
      baseInterval: options.baseInterval || 30000, // 30 seconds
      jitterRange: options.jitterRange || 10000,   // ±10 seconds
      enableWarnings: options.enableWarnings !== false,
      enableLogging: options.enableLogging !== false,
      strictMode: options.strictMode || false,
      ...options
    };
  }

  /**
   * Main rate limiter middleware function
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async rateLimit(req, res, next) {
    const connectionId = req.body.connectionId || req.params.connectionId || req.query.connectionId;
    
    if (!connectionId) {
      return res.status(400).json({
        success: false,
        error: 'Connection ID is required',
        message: 'Rate limiting requires a connection ID'
      });
    }

    try {
      // Check if connection can send message
      const checkResult = await canSendMessage(connectionId);
      
      if (this.options.enableLogging) {
        this.logRateLimitCheck(connectionId, checkResult);
      }

      // If connection is blocked, return error
      if (!checkResult.canSend) {
        return this.handleRateLimitExceeded(res, connectionId, checkResult);
      }

      // Add rate limit info to request for later use
      req.rateLimit = {
        connectionId,
        canSend: true,
        status: checkResult.status,
        stats: checkResult.stats,
        timestamp: new Date()
      };

      // Continue to next middleware
      next();

    } catch (error) {
      logger.error('Rate limiter middleware error:', {
        connectionId,
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: 'Rate limit check failed',
        message: 'Internal server error during rate limit check'
      });
    }
  }

  /**
   * Post-message rate limit update middleware
   * Should be called after successful message sending
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async updateRateLimit(req, res, next) {
    const connectionId = req.rateLimit?.connectionId || req.body.connectionId;
    
    if (!connectionId) {
      return next();
    }

    try {
      // Update rate limit after message
      const updateResult = await updateRateLimitAfterMessage(
        connectionId,
        this.options.baseInterval,
        this.options.jitterRange
      );

      if (this.options.enableLogging) {
        this.logRateLimitUpdate(connectionId, updateResult);
      }

      // Add update info to response
      if (res.locals) {
        res.locals.rateLimitUpdate = updateResult;
      }

      next();

    } catch (error) {
      logger.error('Rate limit update middleware error:', {
        connectionId,
        error: error.message,
        stack: error.stack
      });

      // Don't fail the request, just log the error
      next();
    }
  }

  /**
   * Handle rate limit exceeded
   * @param {Object} res - Express response object
   * @param {string} connectionId - Connection identifier
   * @param {Object} checkResult - Rate limit check result
   */
  handleRateLimitExceeded(res, connectionId, checkResult) {
    const { status, delay, reason, stats } = checkResult;
    
    // Determine appropriate status code
    let statusCode = 429; // Too Many Requests
    if (status === 'blocked') {
      statusCode = 403; // Forbidden
    } else if (status === 'paused') {
      statusCode = 503; // Service Unavailable
    }

    // Calculate retry after time
    const retryAfter = Math.ceil(delay / 1000); // Convert to seconds

    // Set appropriate headers
    res.set({
      'X-RateLimit-Limit': stats.dailyLimit,
      'X-RateLimit-Remaining': Math.max(0, stats.dailyLimit - stats.dailyMessageCount),
      'X-RateLimit-Reset': stats.nextAllowedTime,
      'Retry-After': retryAfter,
      'X-RateLimit-Status': status
    });

    return res.status(statusCode).json({
      success: false,
      error: 'Rate limit exceeded',
      message: `Message sending blocked: ${reason}`,
      details: {
        connectionId,
        status,
        delay,
        retryAfter,
        nextAllowedTime: stats.nextAllowedTime,
        dailyMessageCount: stats.dailyMessageCount,
        dailyLimit: stats.dailyLimit,
        warningThreshold: stats.warningThreshold
      }
    });
  }

  /**
   * Log rate limit check
   * @param {string} connectionId - Connection identifier
   * @param {Object} checkResult - Check result
   */
  logRateLimitCheck(connectionId, checkResult) {
    const { canSend, status, delay, stats } = checkResult;
    
    if (canSend) {
      logger.info('Rate limit check passed:', {
        connectionId,
        status,
        dailyMessageCount: stats.dailyMessageCount,
        dailyLimit: stats.dailyLimit,
        remainingMessages: stats.dailyLimit - stats.dailyMessageCount
      });
    } else {
      logger.warn('Rate limit check failed:', {
        connectionId,
        status,
        delay,
        dailyMessageCount: stats.dailyMessageCount,
        dailyLimit: stats.dailyLimit
      });
    }
  }

  /**
   * Log rate limit update
   * @param {string} connectionId - Connection identifier
   * @param {Object} updateResult - Update result
   */
  logRateLimitUpdate(connectionId, updateResult) {
    const { stats } = updateResult;
    
    logger.info('Rate limit updated:', {
      connectionId,
      messageCount: stats.messageCount,
      dailyMessageCount: stats.dailyMessageCount,
      status: stats.status,
      nextAllowedTime: stats.nextAllowedTime,
      currentInterval: stats.currentInterval
    });

    // Log warnings if approaching limits
    if (stats.status === 'warning') {
      logger.warn('Connection approaching daily limit:', {
        connectionId,
        dailyMessageCount: stats.dailyMessageCount,
        dailyLimit: stats.dailyLimit,
        percentageUsed: ((stats.dailyMessageCount / stats.dailyLimit) * 100).toFixed(2) + '%'
      });
    }
  }

  /**
   * Get rate limit status endpoint middleware
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getStatus(req, res) {
    const connectionId = req.params.connectionId || req.query.connectionId;
    
    if (!connectionId) {
      return res.status(400).json({
        success: false,
        error: 'Connection ID is required'
      });
    }

    try {
      const status = await getRateLimitStatus(connectionId);
      
      return res.json({
        success: true,
        data: status
      });

    } catch (error) {
      logger.error('Failed to get rate limit status:', {
        connectionId,
        error: error.message
      });

      return res.status(500).json({
        success: false,
        error: 'Failed to get rate limit status',
        message: error.message
      });
    }
  }

  /**
   * Pause rate limit endpoint middleware
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async pause(req, res) {
    const connectionId = req.params.connectionId || req.body.connectionId;
    
    if (!connectionId) {
      return res.status(400).json({
        success: false,
        error: 'Connection ID is required'
      });
    }

    try {
      const result = await pauseRateLimit(connectionId);
      
      return res.json({
        success: true,
        message: 'Rate limit paused successfully',
        data: result
      });

    } catch (error) {
      logger.error('Failed to pause rate limit:', {
        connectionId,
        error: error.message
      });

      return res.status(500).json({
        success: false,
        error: 'Failed to pause rate limit',
        message: error.message
      });
    }
  }

  /**
   * Resume rate limit endpoint middleware
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async resume(req, res) {
    const connectionId = req.params.connectionId || req.body.connectionId;
    
    if (!connectionId) {
      return res.status(400).json({
        success: false,
        error: 'Connection ID is required'
      });
    }

    try {
      const result = await resumeRateLimit(connectionId);
      
      return res.json({
        success: true,
        message: 'Rate limit resumed successfully',
        data: result
      });

    } catch (error) {
      logger.error('Failed to resume rate limit:', {
        connectionId,
        error: error.message
      });

      return res.status(500).json({
        success: false,
        error: 'Failed to resume rate limit',
        message: error.message
      });
    }
  }

  /**
   * Reset rate limit endpoint middleware
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async reset(req, res) {
    const connectionId = req.params.connectionId || req.body.connectionId;
    
    if (!connectionId) {
      return res.status(400).json({
        success: false,
        error: 'Connection ID is required'
      });
    }

    try {
      const result = await resetRateLimit(connectionId);
      
      return res.json({
        success: true,
        message: 'Rate limit reset successfully',
        data: result
      });

    } catch (error) {
      logger.error('Failed to reset rate limit:', {
        connectionId,
        error: error.message
      });

      return res.status(500).json({
        success: false,
        error: 'Failed to reset rate limit',
        message: error.message
      });
    }
  }

  /**
   * Create Express router with rate limit endpoints
   * @returns {Object} Express router
   */
  createRouter() {
    const express = require('express');
    const router = express.Router();

    // Rate limit status endpoint
    router.get('/status/:connectionId', this.getStatus.bind(this));
    router.get('/status', this.getStatus.bind(this));

    // Rate limit control endpoints
    router.post('/pause', this.pause.bind(this));
    router.post('/resume', this.resume.bind(this));
    router.post('/reset', this.reset.bind(this));
    router.post('/pause/:connectionId', this.pause.bind(this));
    router.post('/resume/:connectionId', this.resume.bind(this));
    router.post('/reset/:connectionId', this.reset.bind(this));

    return router;
  }

  /**
   * Create middleware functions for Express app
   * @returns {Object} Middleware functions
   */
  createMiddleware() {
    return {
      rateLimit: this.rateLimit.bind(this),
      updateRateLimit: this.updateRateLimit.bind(this),
      router: this.createRouter()
    };
  }
}

// Export middleware class and factory function
module.exports = RateLimiterMiddleware;

// Factory function for easy usage
module.exports.createRateLimiter = (options) => {
  return new RateLimiterMiddleware(options);
}; 