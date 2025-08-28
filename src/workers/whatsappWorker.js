const { messageQueue } = require('../queues/messageQueue');
const whatsAppService = require('../services/whatsappService');
const WhatsAppConnection = require('../models/WhatsAppConnection');
const MessageLog = require('../models/MessageLog');
const { logInfo, logError, logWarning, logDebug } = require('../utils/logger');

class WhatsAppWorker {
    constructor() {
        this.isProcessing = false;
        this.concurrency = 5; // Process 5 messages concurrently
        this.maxRetries = 3;
        this.retryDelays = [5000, 15000, 30000]; // Progressive delays
        this.setupQueueProcessing();
    }

    setupQueueProcessing() {
        // Process messages with concurrency
        messageQueue.process(this.concurrency, async (job) => {
            return await this.processMessage(job);
        });

        // Handle job events
        messageQueue.on('completed', async (job, result) => {
            await this.handleJobCompleted(job, result);
        });

        messageQueue.on('failed', async (job, err) => {
            await this.handleJobFailed(job, err);
        });

        messageQueue.on('stalled', async (job) => {
            await this.handleJobStalled(job);
        });

        messageQueue.on('error', (error) => {
            logError('WhatsApp worker queue error', error);
        });

        logInfo('WhatsApp worker initialized', {
            concurrency: this.concurrency,
            maxRetries: this.maxRetries
        });
    }

    async processMessage(job) {
        const startTime = Date.now();
        const { connectionId, message, recipients, priority, metadata } = job.data;

        try {
            logDebug('Processing WhatsApp message job', {
                jobId: job.id,
                connectionId,
                recipientsCount: recipients.length,
                priority
            });

            // Validate connection
            const connection = await WhatsAppConnection.findOne({ connectionId });
            if (!connection) {
                throw new Error(`Connection ${connectionId} not found`);
            }

            if (!connection.canSendMessages) {
                throw new Error(`Connection ${connectionId} is not ready to send messages`);
            }

            // Log message start
            const messageLog = await this.createMessageLog(job.id, connectionId, message, recipients, metadata);

            const results = [];
            const errors = [];

            // Process each recipient
            for (const recipient of recipients) {
                try {
                    const result = await this.sendMessageWithRetry(
                        connectionId,
                        recipient,
                        message,
                        job.attemptsMade
                    );

                    results.push({
                        recipient,
                        success: true,
                        messageId: result.messageId,
                        timestamp: result.timestamp
                    });

                    // Update message log
                    await this.updateMessageLog(messageLog, recipient, 'sent', result.messageId);

                    // Add delay between messages to respect rate limits
                    if (recipients.indexOf(recipient) < recipients.length - 1) {
                        await this.sleep(this.calculateDelay(priority));
                    }

                } catch (error) {
                    errors.push({
                        recipient,
                        success: false,
                        error: error.message
                    });

                    // Update message log
                    await this.updateMessageLog(messageLog, recipient, 'failed', null, error.message);

                    logError('Failed to send message to recipient', error, {
                        jobId: job.id,
                        connectionId,
                        recipient,
                        attempt: job.attemptsMade
                    });
                }
            }

            const processingTime = Date.now() - startTime;

            // Update final message log status
            await this.finalizeMessageLog(messageLog, results, errors, processingTime);

            logInfo('WhatsApp message job completed', {
                jobId: job.id,
                connectionId,
                totalRecipients: recipients.length,
                successful: results.length,
                failed: errors.length,
                processingTime
            });

            return {
                success: true,
                results,
                errors,
                processingTime,
                messageLogId: messageLog._id
            };

        } catch (error) {
            const processingTime = Date.now() - startTime;
            
            logError('WhatsApp message job failed', error, {
                jobId: job.id,
                connectionId,
                processingTime,
                attempt: job.attemptsMade
            });

            // If this is the final attempt, mark as permanently failed
            if (job.attemptsMade >= this.maxRetries) {
                await this.handlePermanentFailure(job, error, processingTime);
            }

            throw error;
        }
    }

    async sendMessageWithRetry(connectionId, recipient, message, attemptNumber) {
        let lastError;

        for (let retryAttempt = 0; retryAttempt <= this.maxRetries; retryAttempt++) {
            try {
                const result = await whatsAppService.sendMessage(connectionId, recipient, message, {
                    priority: 'normal',
                    retryOnFailure: retryAttempt < this.maxRetries
                });

                return result;
            } catch (error) {
                lastError = error;

                // Don't retry on certain errors
                if (this.isNonRetryableError(error)) {
                    throw error;
                }

                if (retryAttempt < this.maxRetries) {
                    const delay = this.retryDelays[retryAttempt] || this.retryDelays[this.retryDelays.length - 1];
                    
                    logWarning('Message send attempt failed, retrying', {
                        connectionId,
                        recipient,
                        retryAttempt: retryAttempt + 1,
                        maxRetries: this.maxRetries,
                        delay,
                        error: error.message
                    });

                    await this.sleep(delay);
                }
            }
        }

        throw lastError;
    }

    isNonRetryableError(error) {
        const nonRetryableErrors = [
            'Connection not found',
            'Connection not ready',
            'Invalid phone number',
            'Message too long',
            'Rate limit exceeded',
            'Blocked by WhatsApp'
        ];

        return nonRetryableErrors.some(msg => error.message.includes(msg));
    }

    calculateDelay(priority) {
        const baseDelay = 1000; // 1 second base delay
        
        switch (priority) {
            case 'high':
                return baseDelay * 0.5; // 500ms
            case 'low':
                return baseDelay * 2; // 2 seconds
            default:
                return baseDelay; // 1 second
        }
    }

    async createMessageLog(jobId, connectionId, message, recipients, metadata) {
        try {
            const messageLog = new MessageLog({
                messageId: jobId,
                connectionId,
                recipient: recipients.join(','), // Store all recipients
                messageContent: typeof message === 'string' ? message : JSON.stringify(message),
                status: 'queued',
                queueJobId: jobId,
                metadata: {
                    ...metadata,
                    recipientsCount: recipients.length,
                    messageType: typeof message === 'string' ? 'text' : 'media'
                }
            });

            await messageLog.save();
            return messageLog;
        } catch (error) {
            logError('Failed to create message log', error, { jobId, connectionId });
            throw error;
        }
    }

    async updateMessageLog(messageLog, recipient, status, messageId = null, error = null) {
        try {
            // Create a new log entry for this recipient
            const recipientLog = new MessageLog({
                messageId: messageLog.messageId,
                connectionId: messageLog.connectionId,
                recipient,
                messageContent: messageLog.messageContent,
                status,
                messageId,
                error,
                metadata: messageLog.metadata
            });

            await recipientLog.save();
        } catch (error) {
            logError('Failed to update message log', error, {
                messageLogId: messageLog._id,
                recipient,
                status
            });
        }
    }

    async finalizeMessageLog(messageLog, results, errors, processingTime) {
        try {
            const successCount = results.length;
            const failureCount = errors.length;
            const totalCount = successCount + failureCount;

            // Update the main message log
            messageLog.status = failureCount === 0 ? 'completed' : 'partial_failure';
            messageLog.processingTime = processingTime;
            messageLog.metadata = {
                ...messageLog.metadata,
                successCount,
                failureCount,
                totalCount,
                successRate: totalCount > 0 ? (successCount / totalCount) * 100 : 0
            };

            await messageLog.save();
        } catch (error) {
            logError('Failed to finalize message log', error, {
                messageLogId: messageLog._id
            });
        }
    }

    async handlePermanentFailure(job, error, processingTime) {
        try {
            const { connectionId, message, recipients, metadata } = job.data;

            // Create failure log
            const messageLog = new MessageLog({
                messageId: job.id,
                connectionId,
                recipient: recipients.join(','),
                messageContent: typeof message === 'string' ? message : JSON.stringify(message),
                status: 'permanently_failed',
                error: error.message,
                processingTime,
                retryCount: job.attemptsMade,
                metadata: {
                    ...metadata,
                    finalAttempt: true,
                    failureReason: error.message
                }
            });

            await messageLog.save();

            logError('Message permanently failed after all retries', {
                jobId: job.id,
                connectionId,
                error: error.message,
                attempts: job.attemptsMade,
                processingTime
            });
        } catch (logError) {
            logError('Failed to log permanent failure', logError, { jobId: job.id });
        }
    }

    async handleJobCompleted(job, result) {
        try {
            logInfo('WhatsApp message job completed successfully', {
                jobId: job.id,
                connectionId: job.data.connectionId,
                processingTime: result.processingTime,
                successfulRecipients: result.results.length,
                failedRecipients: result.errors.length
            });

            // Update connection stats
            if (result.results.length > 0) {
                const connection = await WhatsAppConnection.findOne({ connectionId: job.data.connectionId });
                if (connection) {
                    await connection.incrementMessageCount('sent');
                }
            }
        } catch (error) {
            logError('Failed to handle job completion', error, { jobId: job.id });
        }
    }

    async handleJobFailed(job, error) {
        try {
            logError('WhatsApp message job failed', error, {
                jobId: job.id,
                connectionId: job.data.connectionId,
                attempt: job.attemptsMade,
                maxRetries: this.maxRetries
            });

            // Update connection error stats
            const connection = await WhatsAppConnection.findOne({ connectionId: job.data.connectionId });
            if (connection) {
                await connection.incrementMessageCount('failed');
            }

            // If this was the final attempt, log as permanent failure
            if (job.attemptsMade >= this.maxRetries) {
                await this.handlePermanentFailure(job, error, 0);
            }
        } catch (logError) {
            logError('Failed to handle job failure', logError, { jobId: job.id });
        }
    }

    async handleJobStalled(job) {
        try {
            logWarning('WhatsApp message job stalled', {
                jobId: job.id,
                connectionId: job.data.connectionId,
                stalledAt: new Date().toISOString()
            });

            // Attempt to retry the job
            await job.retry();
        } catch (error) {
            logError('Failed to retry stalled job', error, { jobId: job.id });
        }
    }

    // Worker management methods
    async pause() {
        try {
            await messageQueue.pause();
            this.isProcessing = false;
            logInfo('WhatsApp worker paused');
        } catch (error) {
            logError('Failed to pause WhatsApp worker', error);
            throw error;
        }
    }

    async resume() {
        try {
            await messageQueue.resume();
            this.isProcessing = true;
            logInfo('WhatsApp worker resumed');
        } catch (error) {
            logError('Failed to resume WhatsApp worker', error);
            throw error;
        }
    }

    async getWorkerStats() {
        try {
            const waiting = await messageQueue.getWaiting();
            const active = await messageQueue.getActive();
            const completed = await messageQueue.getCompleted();
            const failed = await messageQueue.getFailed();

            return {
                waiting: waiting.length,
                active: active.length,
                completed: completed.length,
                failed: failed.length,
                isProcessing: this.isProcessing,
                concurrency: this.concurrency
            };
        } catch (error) {
            logError('Failed to get worker stats', error);
            throw error;
        }
    }

    async cleanup() {
        try {
            // Close the queue
            await messageQueue.close();
            
            logInfo('WhatsApp worker cleanup completed');
        } catch (error) {
            logError('Failed to cleanup WhatsApp worker', error);
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Create singleton instance
const whatsAppWorker = new WhatsAppWorker();

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    logInfo('Received SIGTERM, cleaning up WhatsApp worker');
    await whatsAppWorker.cleanup();
});

process.on('SIGINT', async () => {
    logInfo('Received SIGINT, cleaning up WhatsApp worker');
    await whatsAppWorker.cleanup();
});

module.exports = whatsAppWorker; 