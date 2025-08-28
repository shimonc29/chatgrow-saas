const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'message-queue' },
  transports: [
    new winston.transports.File({ filename: 'logs/queue-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/queue-combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Rate limiting configuration
const RATE_LIMIT_BASE = 30000; // 30 seconds base
const JITTER_RANGE = 15000;    // 15 seconds jitter range

// Rate limiter storage per connection (in memory)
const rateLimiters = new Map();
const pausedConnections = new Set();

// Generate random jitter between 0 and JITTER_RANGE
const generateJitter = () => Math.floor(Math.random() * JITTER_RANGE);

// Calculate delay for rate limiting
const calculateDelay = (connectionId) => {
  const now = Date.now();
  const limiter = rateLimiters.get(connectionId);
  
  if (!limiter) {
    // First message for this connection
    const jitter = generateJitter();
    const interval = RATE_LIMIT_BASE + jitter;
    rateLimiters.set(connectionId, {
      lastMessage: now,
      interval: interval
    });
    return 0;
  }
  
  const timeSinceLastMessage = now - limiter.lastMessage;
  const requiredDelay = limiter.interval - timeSinceLastMessage;
  
  if (requiredDelay <= 0) {
    // Can send immediately, update interval with new jitter
    const jitter = generateJitter();
    limiter.interval = RATE_LIMIT_BASE + jitter;
    limiter.lastMessage = now;
    return 0;
  }
  
  return requiredDelay;
};

// Create a mock queue for development (no Redis dependency)
const messageQueue = {
  add: async (data) => {
    logger.info('Mock queue: Message would be added', data);
    return { id: Date.now() };
  },
  getJobCounts: async () => ({ waiting: 0, active: 0, completed: 0, failed: 0 }),
  pause: async () => logger.info('Mock queue: Paused'),
  resume: async () => logger.info('Mock queue: Resumed'),
  process: () => logger.info('Mock queue: Process started'),
  on: () => {}, // Mock event handler
  close: async () => logger.info('Mock queue: Closed'),
  getWaiting: async () => [],
  getActive: async () => [],
  getCompleted: async () => [],
  getFailed: async () => [],
  getDelayed: async () => []
};

logger.info('Using mock queue (Redis not available)');

// Add message to queue with rate limiting
const addMessageToQueue = async (connectionId, message, recipients, priority = 'normal') => {
  try {
    const delay = calculateDelay(connectionId);
    
    const jobData = {
      connectionId,
      message,
      recipients: Array.isArray(recipients) ? recipients : [recipients],
      timestamp: Date.now(),
      priority
    };

    const jobOptions = {
      delay,
      priority: priority === 'high' ? 1 : priority === 'low' ? 3 : 2,
      jobId: `${connectionId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    const job = await messageQueue.add('send-message', jobData, jobOptions);
    
    logger.info(`Message queued successfully`, {
      jobId: job.id,
      connectionId,
      delay,
      recipientsCount: jobData.recipients.length
    });

    return {
      success: true,
      jobId: job.id,
      delay,
      estimatedSendTime: Date.now() + delay
    };

  } catch (error) {
    logger.error('Failed to add message to queue:', {
      connectionId,
      error: error.message,
      stack: error.stack
    });
    
    throw new Error(`Failed to queue message: ${error.message}`);
  }
};

// Get queue status for a connection
const getQueueStatus = async (connectionId) => {
  try {
    const limiter = rateLimiters.get(connectionId);
    const now = Date.now();
    const timeUntilNextAllowed = limiter ? 
      Math.max(0, (limiter.lastMessage + limiter.interval) - now) : 0;

    return {
      connectionId,
      totalJobs: 0,
      waiting: 0,
      active: 0,
      delayed: 0,
      failed: 0,
      timeUntilNextAllowed,
      rateLimitInfo: limiter ? {
        lastMessage: limiter.lastMessage,
        interval: limiter.interval,
        nextAllowedTime: limiter.lastMessage + limiter.interval
      } : null
    };

  } catch (error) {
    logger.error('Failed to get queue status:', {
      connectionId,
      error: error.message
    });
    throw error;
  }
};

// Pause queue for a specific connection
const pauseQueue = async (connectionId) => {
  try {
    pausedConnections.add(connectionId);
    logger.info(`Queue paused for connection: ${connectionId}`);
    return { success: true, message: 'Queue paused successfully' };

  } catch (error) {
    logger.error('Failed to pause queue:', {
      connectionId,
      error: error.message
    });
    throw error;
  }
};

// Resume queue for a specific connection
const resumeQueue = async (connectionId) => {
  try {
    pausedConnections.delete(connectionId);
    logger.info(`Queue resumed for connection: ${connectionId}`);
    return { success: true, message: 'Queue resumed successfully' };

  } catch (error) {
    logger.error('Failed to resume queue:', {
      connectionId,
      error: error.message
    });
    throw error;
  }
};

// Check if queue is paused for a connection
const isQueuePaused = async (connectionId) => {
  return pausedConnections.has(connectionId);
};

// Clean up rate limiters (remove old entries)
const cleanupRateLimiters = () => {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  for (const [connectionId, limiter] of rateLimiters.entries()) {
    if (now - limiter.lastMessage > maxAge) {
      rateLimiters.delete(connectionId);
    }
  }
};

// Run cleanup every hour
setInterval(cleanupRateLimiters, 60 * 60 * 1000);

module.exports = {
  messageQueue,
  redisClient: null,
  addMessageToQueue,
  getQueueStatus,
  pauseQueue,
  resumeQueue,
  isQueuePaused,
  logger
}; 