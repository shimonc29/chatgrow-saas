const { 
  addMessageToQueue, 
  getQueueStatus, 
  pauseQueue, 
  resumeQueue, 
  isQueuePaused,
  logger 
} = require('../queues/messageQueue');

class QueueService {
  /**
   * Add a message to the queue for sending
   * @param {string} connectionId - WhatsApp connection identifier
   * @param {string} message - Message content to send
   * @param {string|string[]} recipients - Phone number(s) to send to
   * @param {string} priority - Message priority: 'high', 'normal', 'low'
   * @returns {Promise<Object>} Queue result with job details
   */
  async addMessage(connectionId, message, recipients, priority = 'normal') {
    try {
      // Validate inputs
      if (!connectionId || !message || !recipients) {
        throw new Error('Missing required parameters: connectionId, message, recipients');
      }

      // Check if queue is paused for this connection
      const isPaused = await isQueuePaused(connectionId);
      if (isPaused) {
        throw new Error(`Queue is paused for connection: ${connectionId}`);
      }

      // Validate priority
      const validPriorities = ['high', 'normal', 'low'];
      if (!validPriorities.includes(priority)) {
        throw new Error(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
      }

      // Validate recipients format
      const recipientArray = Array.isArray(recipients) ? recipients : [recipients];
      const validRecipients = recipientArray.filter(recipient => {
        // Basic phone number validation (can be enhanced)
        return recipient && typeof recipient === 'string' && recipient.length >= 10;
      });

      if (validRecipients.length === 0) {
        throw new Error('No valid recipients provided');
      }

      // Add message to queue
      const result = await addMessageToQueue(connectionId, message, validRecipients, priority);

      logger.info('Message added to queue successfully', {
        connectionId,
        jobId: result.jobId,
        recipientsCount: validRecipients.length,
        priority,
        estimatedSendTime: new Date(result.estimatedSendTime).toISOString()
      });

      return {
        success: true,
        jobId: result.jobId,
        delay: result.delay,
        estimatedSendTime: result.estimatedSendTime,
        recipientsCount: validRecipients.length,
        message: 'Message queued successfully'
      };

    } catch (error) {
      logger.error('Failed to add message to queue service:', {
        connectionId,
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message,
        message: 'Failed to queue message'
      };
    }
  }

  /**
   * Get queue status for a specific connection
   * @param {string} connectionId - WhatsApp connection identifier
   * @returns {Promise<Object>} Queue status information
   */
  async getQueueStatus(connectionId) {
    try {
      if (!connectionId) {
        throw new Error('Connection ID is required');
      }

      const status = await getQueueStatus(connectionId);
      const isPaused = await isQueuePaused(connectionId);

      const result = {
        ...status,
        isPaused,
        status: isPaused ? 'paused' : 'active',
        lastUpdated: new Date().toISOString()
      };

      logger.info('Queue status retrieved', {
        connectionId,
        totalJobs: result.totalJobs,
        isPaused: result.isPaused
      });

      return {
        success: true,
        data: result
      };

    } catch (error) {
      logger.error('Failed to get queue status:', {
        connectionId,
        error: error.message
      });

      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Pause queue for a specific connection
   * @param {string} connectionId - WhatsApp connection identifier
   * @returns {Promise<Object>} Pause operation result
   */
  async pauseQueue(connectionId) {
    try {
      if (!connectionId) {
        throw new Error('Connection ID is required');
      }

      // Check if already paused
      const alreadyPaused = await isQueuePaused(connectionId);
      if (alreadyPaused) {
        return {
          success: true,
          message: 'Queue is already paused',
          wasAlreadyPaused: true
        };
      }

      const result = await pauseQueue(connectionId);

      logger.info('Queue paused successfully', {
        connectionId,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        message: 'Queue paused successfully',
        connectionId,
        pausedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Failed to pause queue:', {
        connectionId,
        error: error.message
      });

      return {
        success: false,
        error: error.message,
        message: 'Failed to pause queue'
      };
    }
  }

  /**
   * Resume queue for a specific connection
   * @param {string} connectionId - WhatsApp connection identifier
   * @returns {Promise<Object>} Resume operation result
   */
  async resumeQueue(connectionId) {
    try {
      if (!connectionId) {
        throw new Error('Connection ID is required');
      }

      // Check if already active
      const isPaused = await isQueuePaused(connectionId);
      if (!isPaused) {
        return {
          success: true,
          message: 'Queue is already active',
          wasAlreadyActive: true
        };
      }

      const result = await resumeQueue(connectionId);

      logger.info('Queue resumed successfully', {
        connectionId,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        message: 'Queue resumed successfully',
        connectionId,
        resumedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Failed to resume queue:', {
        connectionId,
        error: error.message
      });

      return {
        success: false,
        error: error.message,
        message: 'Failed to resume queue'
      };
    }
  }

  /**
   * Get comprehensive queue statistics
   * @returns {Promise<Object>} Overall queue statistics
   */
  async getQueueStatistics() {
    try {
      const { messageQueue } = require('../queues/messageQueue');
      
      const waiting = await messageQueue.getWaiting();
      const active = await messageQueue.getActive();
      const completed = await messageQueue.getCompleted();
      const failed = await messageQueue.getFailed();
      const delayed = await messageQueue.getDelayed();

      const stats = {
        total: waiting.length + active.length + completed.length + failed.length + delayed.length,
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
        timestamp: new Date().toISOString()
      };

      return {
        success: true,
        data: stats
      };

    } catch (error) {
      logger.error('Failed to get queue statistics:', {
        error: error.message
      });

      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Clear failed jobs for a specific connection
   * @param {string} connectionId - WhatsApp connection identifier
   * @returns {Promise<Object>} Clear operation result
   */
  async clearFailedJobs(connectionId) {
    try {
      if (!connectionId) {
        throw new Error('Connection ID is required');
      }

      const { messageQueue } = require('../queues/messageQueue');
      const failed = await messageQueue.getFailed();
      
      const connectionFailedJobs = failed.filter(job => 
        job.data.connectionId === connectionId
      );

      let clearedCount = 0;
      for (const job of connectionFailedJobs) {
        await job.remove();
        clearedCount++;
      }

      logger.info('Failed jobs cleared', {
        connectionId,
        clearedCount
      });

      return {
        success: true,
        message: `Cleared ${clearedCount} failed jobs`,
        clearedCount
      };

    } catch (error) {
      logger.error('Failed to clear failed jobs:', {
        connectionId,
        error: error.message
      });

      return {
        success: false,
        error: error.message,
        message: 'Failed to clear failed jobs'
      };
    }
  }
}

module.exports = QueueService; 