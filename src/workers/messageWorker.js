const { messageQueue, isQueuePaused, logger } = require('../queues/messageQueue');

// WhatsApp client manager (you'll need to implement this based on your WhatsApp library)
// This is a placeholder - replace with your actual WhatsApp client implementation
class WhatsAppClientManager {
  constructor() {
    this.clients = new Map(); // connectionId -> client
  }

  async getClient(connectionId) {
    // This should return your WhatsApp client instance
    // Example: return this.clients.get(connectionId);
    throw new Error('WhatsApp client manager not implemented');
  }

  async sendMessage(client, recipient, message) {
    // This should send the actual WhatsApp message
    // Example: return await client.sendMessage(recipient, message);
    throw new Error('WhatsApp send message not implemented');
  }

  async isClientConnected(connectionId) {
    // Check if WhatsApp client is connected
    const client = this.clients.get(connectionId);
    return client && client.isConnected;
  }
}

const whatsappManager = new WhatsAppClientManager();

/**
 * Process a single WhatsApp message
 * @param {Object} job - Bull job object
 * @param {Object} job.data - Job data containing message details
 */
async function processMessage(job) {
  const { connectionId, message, recipients, timestamp, priority } = job.data;
  
  logger.info('Processing message job', {
    jobId: job.id,
    connectionId,
    recipientsCount: recipients.length,
    priority,
    timestamp: new Date(timestamp).toISOString()
  });

  try {
    // Check if queue is paused for this connection
    const isPaused = await isQueuePaused(connectionId);
    if (isPaused) {
      logger.warn('Queue is paused for connection, skipping job', {
        jobId: job.id,
        connectionId
      });
      throw new Error('Queue is paused for this connection');
    }

    // Check if WhatsApp client is connected
    const isConnected = await whatsappManager.isClientConnected(connectionId);
    if (!isConnected) {
      logger.error('WhatsApp client not connected', {
        jobId: job.id,
        connectionId
      });
      throw new Error('WhatsApp client not connected');
    }

    // Get WhatsApp client
    const client = await whatsappManager.getClient(connectionId);
    if (!client) {
      logger.error('WhatsApp client not found', {
        jobId: job.id,
        connectionId
      });
      throw new Error('WhatsApp client not found');
    }

    // Send messages to all recipients
    const results = [];
    const errors = [];

    for (const recipient of recipients) {
      try {
        logger.info('Sending message to recipient', {
          jobId: job.id,
          connectionId,
          recipient,
          messageLength: message.length
        });

        // Send the message
        const result = await whatsappManager.sendMessage(client, recipient, message);
        
        results.push({
          recipient,
          success: true,
          result,
          timestamp: new Date().toISOString()
        });

        logger.info('Message sent successfully', {
          jobId: job.id,
          connectionId,
          recipient,
          result
        });

      } catch (error) {
        logger.error('Failed to send message to recipient', {
          jobId: job.id,
          connectionId,
          recipient,
          error: error.message
        });

        errors.push({
          recipient,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Log final results
    const successCount = results.length;
    const errorCount = errors.length;
    const totalCount = recipients.length;

    logger.info('Message processing completed', {
      jobId: job.id,
      connectionId,
      totalRecipients: totalCount,
      successfulSends: successCount,
      failedSends: errorCount,
      successRate: `${((successCount / totalCount) * 100).toFixed(2)}%`
    });

    // Return results for job completion
    return {
      jobId: job.id,
      connectionId,
      totalRecipients: totalCount,
      successfulSends: successCount,
      failedSends: errorCount,
      results,
      errors,
      completedAt: new Date().toISOString()
    };

  } catch (error) {
    logger.error('Message processing failed', {
      jobId: job.id,
      connectionId,
      error: error.message,
      stack: error.stack
    });

    // Re-throw error to mark job as failed
    throw error;
  }
}

/**
 * Process message with retry logic and error handling
 * @param {Object} job - Bull job object
 */
async function processMessageWithRetry(job) {
  const { connectionId, message, recipients } = job.data;
  
  try {
    // Add some random delay to avoid rate limiting issues
    const randomDelay = Math.random() * 2000; // 0-2 seconds
    await new Promise(resolve => setTimeout(resolve, randomDelay));

    const result = await processMessage(job);
    
    // Update job progress
    await job.progress(100);
    
    return result;

  } catch (error) {
    // Log detailed error information
    logger.error('Message processing failed with retry', {
      jobId: job.id,
      connectionId,
      attempt: job.attemptsMade + 1,
      maxAttempts: job.opts.attempts,
      error: error.message,
      stack: error.stack
    });

    // If this is the last attempt, log final failure
    if (job.attemptsMade >= job.opts.attempts - 1) {
      logger.error('Message processing failed permanently', {
        jobId: job.id,
        connectionId,
        totalAttempts: job.attemptsMade + 1,
        finalError: error.message
      });
    }

    throw error;
  }
}

/**
 * Initialize the message worker
 */
function initializeMessageWorker() {
  logger.info('Initializing message worker...');

  // Process jobs with concurrency control
  messageQueue.process('send-message', 5, processMessageWithRetry);

  // Handle worker events
  messageQueue.on('completed', (job, result) => {
    logger.info('Message job completed successfully', {
      jobId: job.id,
      connectionId: job.data.connectionId,
      successfulSends: result.successfulSends,
      failedSends: result.failedSends
    });
  });

  messageQueue.on('failed', (job, err) => {
    logger.error('Message job failed permanently', {
      jobId: job.id,
      connectionId: job.data.connectionId,
      error: err.message,
      attempts: job.attemptsMade
    });
  });

  messageQueue.on('stalled', (job) => {
    logger.warn('Message job stalled', {
      jobId: job.id,
      connectionId: job.data.connectionId
    });
  });

  messageQueue.on('error', (error) => {
    logger.error('Message queue error', {
      error: error.message,
      stack: error.stack
    });
  });

  logger.info('Message worker initialized successfully');
}

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown() {
  logger.info('Shutting down message worker gracefully...');
  
  try {
    // Wait for current jobs to complete
    await messageQueue.close();
    logger.info('Message worker shutdown completed');
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
  }
}

// Handle process termination
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception in message worker:', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection in message worker:', {
    reason: reason,
    promise: promise
  });
  process.exit(1);
});

module.exports = {
  initializeMessageWorker,
  processMessage,
  processMessageWithRetry,
  gracefulShutdown,
  whatsappManager
}; 