// const Queue = require('bull'); // Disabled for development
const { logInfo, logError, logWarning, logDebug } = require('../utils/logger');
const { getRateLimitData, canSendMessage, updateRateLimitAfterMessage } = require('../utils/rateLimitUtils');
const MessageLog = require('../models/MessageLog');
const WhatsAppConnection = require('../models/WhatsAppConnection');
const { createTestContacts, measureTime, calculateStatistics } = require('../utils/testUtils');

class LoadTestSystem {
    constructor() {
        this.testResults = {
            startTime: null,
            endTime: null,
            totalMessages: 0,
            successfulMessages: 0,
            failedMessages: 0,
            blockedMessages: 0,
            averageTimePerMessage: 0,
            totalTime: 0,
            errors: [],
            warnings: [],
            recommendations: [],
            connectionStats: {},
            rateLimitStats: {},
            performanceMetrics: {
                minTime: Infinity,
                maxTime: 0,
                medianTime: 0,
                p95Time: 0,
                p99Time: 0
            }
        };
        
        this.isRunning = false;
        this.testQueue = null;
        this.connections = new Map();
        this.currentTestId = null;
    }

    async init() {
        try {
            // Use mock queue for development (no Redis dependency)
            this.testQueue = {
                add: async (data) => {
                    logInfo('Mock test queue: Message would be processed', data);
                    return { id: Date.now() };
                },
                process: () => logInfo('Mock test queue: Process started'),
                close: async () => logInfo('Mock test queue: Closed')
            };

            logInfo('Load test system initialized with mock queue');
        } catch (error) {
            logError('Failed to initialize load test system', { error: error.message });
            throw error;
        }
    }

    async runLoadTest(options = {}) {
        const {
            messageCount = 500,
            connectionId = 'test-connection',
            messageTemplate = 'Test message #{number} from ChatGrow Load Test',
            delayBetweenMessages = 1000, // 1 second
            maxConcurrentMessages = 5,
            testDuration = 300000, // 5 minutes
            enableRateLimiting = true,
            enableLogging = true,
            enableHealthChecks = true
        } = options;

        if (this.isRunning) {
            throw new Error('Load test is already running');
        }

        this.isRunning = true;
        this.currentTestId = `load-test-${Date.now()}`;
        
        logInfo('Starting load test', {
            testId: this.currentTestId,
            messageCount,
            connectionId,
            options
        });

        try {
            // Initialize test results
            this.testResults = {
                testId: this.currentTestId,
                startTime: new Date(),
                endTime: null,
                totalMessages: messageCount,
                successfulMessages: 0,
                failedMessages: 0,
                blockedMessages: 0,
                averageTimePerMessage: 0,
                totalTime: 0,
                errors: [],
                warnings: [],
                recommendations: [],
                connectionStats: {},
                rateLimitStats: {},
                performanceMetrics: {
                    minTime: Infinity,
                    maxTime: 0,
                    medianTime: 0,
                    p95Time: 0,
                    p99Time: 0
                },
                options
            };

            // Pre-test health check
            if (enableHealthChecks) {
                await this.performPreTestHealthCheck();
            }

            // Create test contacts
            const testContacts = await createTestContacts(messageCount);

            // Start the test
            const startTime = Date.now();
            
            // Add messages to queue in batches
            const batchSize = Math.min(maxConcurrentMessages, 10);
            const batches = this.createBatches(testContacts, batchSize);
            
            for (let i = 0; i < batches.length; i++) {
                if (!this.isRunning) break; // Allow early termination
                
                const batch = batches[i];
                const batchPromises = batch.map((contact, index) => {
                    const messageNumber = i * batchSize + index + 1;
                    const message = messageTemplate.replace('{number}', messageNumber);
                    
                    return this.addTestMessageToQueue({
                        connectionId,
                        recipient: contact.phone,
                        message,
                        messageNumber,
                        testId: this.currentTestId
                    });
                });

                await Promise.all(batchPromises);
                
                // Add delay between batches
                if (i < batches.length - 1) {
                    await this.sleep(delayBetweenMessages);
                }
            }

            // Wait for all messages to complete
            await this.waitForQueueCompletion();
            
            const endTime = Date.now();
            this.testResults.endTime = new Date();
            this.testResults.totalTime = endTime - startTime;

            // Calculate final statistics
            await this.calculateFinalStatistics();

            // Generate recommendations
            this.generateRecommendations();

            // Log final results
            logInfo('Load test completed', {
                testId: this.currentTestId,
                results: this.testResults
            });

            return this.testResults;

        } catch (error) {
            logError('Load test failed', {
                testId: this.currentTestId,
                error: error.message,
                stack: error.stack
            });
            
            this.testResults.errors.push({
                type: 'TEST_FAILURE',
                message: error.message,
                timestamp: new Date()
            });
            
            throw error;
        } finally {
            this.isRunning = false;
        }
    }

    async processTestMessage(job) {
        const { connectionId, recipient, message, messageNumber, testId } = job.data;
        const startTime = Date.now();
        
        try {
            // Check rate limiting
            const rateLimitCheck = await this.checkRateLimit(connectionId);
            if (!rateLimitCheck.canSend) {
                this.testResults.blockedMessages++;
                this.testResults.rateLimitStats.blockedCount = (this.testResults.rateLimitStats.blockedCount || 0) + 1;
                
                logWarning('Message blocked by rate limit', {
                    testId,
                    messageNumber,
                    connectionId,
                    recipient,
                    reason: rateLimitCheck.reason
                });
                
                return {
                    status: 'blocked',
                    reason: rateLimitCheck.reason,
                    processingTime: Date.now() - startTime
                };
            }

            // Simulate message sending
            const sendResult = await this.simulateMessageSending(connectionId, recipient, message);
            
            const processingTime = Date.now() - startTime;
            
            // Update statistics
            if (sendResult.status === 'success') {
                this.testResults.successfulMessages++;
            } else {
                this.testResults.failedMessages++;
                this.testResults.errors.push({
                    type: 'SEND_FAILURE',
                    message: sendResult.error,
                    messageNumber,
                    recipient,
                    timestamp: new Date()
                });
            }

            // Update performance metrics
            this.updatePerformanceMetrics(processingTime);

            // Log message result
            logDebug('Test message processed', {
                testId,
                messageNumber,
                status: sendResult.status,
                processingTime,
                recipient
            });

            return {
                status: sendResult.status,
                processingTime,
                error: sendResult.error
            };

        } catch (error) {
            const processingTime = Date.now() - startTime;
            
            this.testResults.failedMessages++;
            this.testResults.errors.push({
                type: 'PROCESSING_ERROR',
                message: error.message,
                messageNumber,
                recipient,
                timestamp: new Date()
            });

            logError('Error processing test message', {
                testId,
                messageNumber,
                error: error.message,
                processingTime
            });

            return {
                status: 'error',
                error: error.message,
                processingTime
            };
        }
    }

    async checkRateLimit(connectionId) {
        try {
            const rateLimitData = await getRateLimitData(connectionId);
            const canSend = await canSendMessage(connectionId);
            
            return {
                canSend,
                rateLimitData,
                reason: canSend ? null : 'Rate limit exceeded'
            };
        } catch (error) {
            logError('Rate limit check failed', { connectionId, error: error.message });
            return {
                canSend: true, // Allow sending if rate limit check fails
                error: error.message
            };
        }
    }

    async simulateMessageSending(connectionId, recipient, message) {
        // Simulate realistic message sending with potential failures
        const random = Math.random();
        
        // Simulate different failure scenarios
        if (random < 0.02) { // 2% chance of immediate failure
            return {
                status: 'failed',
                error: 'Simulated network error'
            };
        }
        
        if (random < 0.05) { // 3% chance of timeout
            await this.sleep(5000); // Simulate 5 second timeout
            return {
                status: 'failed',
                error: 'Simulated timeout'
            };
        }
        
        if (random < 0.08) { // 3% chance of WhatsApp block
            return {
                status: 'failed',
                error: 'Simulated WhatsApp block'
            };
        }

        // Simulate normal processing time (100-500ms)
        const processingTime = 100 + Math.random() * 400;
        await this.sleep(processingTime);
        
        return {
            status: 'success',
            processingTime
        };
    }

    async addTestMessageToQueue(messageData) {
        try {
            const job = await this.testQueue.add('send-test-message', messageData, {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000
                },
                removeOnComplete: 100,
                removeOnFail: 50
            });
            
            return job.id;
        } catch (error) {
            logError('Failed to add test message to queue', {
                error: error.message,
                messageData
            });
            throw error;
        }
    }

    async waitForQueueCompletion() {
        return new Promise((resolve) => {
            const checkInterval = setInterval(async () => {
                const waiting = await this.testQueue.getWaiting();
                const active = await this.testQueue.getActive();
                
                if (waiting.length === 0 && active.length === 0) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 1000);
        });
    }

    async calculateFinalStatistics() {
        // Calculate average time per message
        if (this.testResults.successfulMessages > 0) {
            this.testResults.averageTimePerMessage = this.testResults.totalTime / this.testResults.successfulMessages;
        }

        // Calculate delivery rate
        this.testResults.deliveryRate = (this.testResults.successfulMessages / this.testResults.totalMessages) * 100;
        
        // Calculate ban rate
        this.testResults.banRate = (this.testResults.blockedMessages / this.testResults.totalMessages) * 100;

        // Calculate performance percentiles
        const times = this.testResults.performanceMetrics.times || [];
        if (times.length > 0) {
            times.sort((a, b) => a - b);
            this.testResults.performanceMetrics.medianTime = times[Math.floor(times.length * 0.5)];
            this.testResults.performanceMetrics.p95Time = times[Math.floor(times.length * 0.95)];
            this.testResults.performanceMetrics.p99Time = times[Math.floor(times.length * 0.99)];
        }
    }

    generateRecommendations() {
        const recommendations = [];

        // Delivery rate recommendations
        if (this.testResults.deliveryRate < 98) {
            recommendations.push({
                type: 'DELIVERY_RATE',
                priority: 'HIGH',
                message: `Delivery rate is ${this.testResults.deliveryRate.toFixed(2)}%, below the 98% target. Consider adjusting rate limiting or message timing.`
            });
        }

        // Ban rate recommendations
        if (this.testResults.banRate > 0.5) {
            recommendations.push({
                type: 'BAN_RATE',
                priority: 'CRITICAL',
                message: `Ban rate is ${this.testResults.banRate.toFixed(2)}%, above the 0.5% threshold. Immediate action required to prevent WhatsApp blocks.`
            });
        }

        // Performance recommendations
        if (this.testResults.averageTimePerMessage > 2000) {
            recommendations.push({
                type: 'PERFORMANCE',
                priority: 'MEDIUM',
                message: `Average processing time is ${this.testResults.averageTimePerMessage.toFixed(0)}ms, consider optimizing queue processing.`
            });
        }

        // Error rate recommendations
        const errorRate = (this.testResults.errors.length / this.testResults.totalMessages) * 100;
        if (errorRate > 1) {
            recommendations.push({
                type: 'ERROR_RATE',
                priority: 'HIGH',
                message: `Error rate is ${errorRate.toFixed(2)}%, investigate and fix underlying issues.`
            });
        }

        this.testResults.recommendations = recommendations;
    }

    async performPreTestHealthCheck() {
        logInfo('Performing pre-test health check');
        
        // Check if connection exists
        const connection = await WhatsAppConnection.findOne({ connectionId: 'test-connection' });
        if (!connection) {
            this.testResults.warnings.push({
                type: 'CONNECTION_MISSING',
                message: 'Test connection not found, using simulation mode'
            });
        }

        // Check queue health
        const queueHealth = await this.testQueue.getJobCounts();
        if (queueHealth.waiting > 0 || queueHealth.active > 0) {
            this.testResults.warnings.push({
                type: 'QUEUE_NOT_EMPTY',
                message: 'Queue contains pending jobs, consider clearing before test'
            });
        }
    }

    updatePerformanceMetrics(processingTime) {
        const metrics = this.testResults.performanceMetrics;
        
        if (!metrics.times) {
            metrics.times = [];
        }
        
        metrics.times.push(processingTime);
        metrics.minTime = Math.min(metrics.minTime, processingTime);
        metrics.maxTime = Math.max(metrics.maxTime, processingTime);
    }

    createBatches(items, batchSize) {
        const batches = [];
        for (let i = 0; i < items.length; i += batchSize) {
            batches.push(items.slice(i, i + batchSize));
        }
        return batches;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async stopTest() {
        this.isRunning = false;
        logInfo('Load test stopped by user');
    }

    async getTestStatus() {
        if (!this.isRunning) {
            return { status: 'idle' };
        }

        const queueCounts = await this.testQueue.getJobCounts();
        
        return {
            status: 'running',
            testId: this.currentTestId,
            progress: {
                completed: this.testResults.successfulMessages + this.testResults.failedMessages,
                total: this.testResults.totalMessages,
                percentage: ((this.testResults.successfulMessages + this.testResults.failedMessages) / this.testResults.totalMessages) * 100
            },
            queue: queueCounts,
            currentStats: {
                successful: this.testResults.successfulMessages,
                failed: this.testResults.failedMessages,
                blocked: this.testResults.blockedMessages
            }
        };
    }

    async cleanup() {
        try {
            if (this.testQueue) {
                await this.testQueue.close();
            }
            logInfo('Load test system cleaned up');
        } catch (error) {
            logError('Error cleaning up load test system', { error: error.message });
        }
    }
}

// Create singleton instance
const loadTestSystem = new LoadTestSystem();

// Graceful shutdown
process.on('SIGTERM', async () => {
    await loadTestSystem.cleanup();
    process.exit(0);
});

process.on('SIGINT', async () => {
    await loadTestSystem.cleanup();
    process.exit(0);
});

module.exports = loadTestSystem; 