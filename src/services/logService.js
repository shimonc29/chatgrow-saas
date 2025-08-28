const MessageLog = require('../models/MessageLog');
const { logInfo, logError, logDebug } = require('../utils/logger');

class LogService {
    constructor() {
        this.logger = { logInfo, logError, logDebug };
    }

    /**
     * Log a new message
     * @param {Object} messageData - Message data to log
     * @returns {Promise<MessageLog>}
     */
    async logMessage(messageData) {
        try {
            const startTime = Date.now();
            
            const logEntry = new MessageLog({
                messageId: messageData.messageId,
                connectionId: messageData.connectionId,
                recipient: messageData.recipient,
                messageContent: messageData.messageContent,
                messageType: messageData.messageType || 'text',
                status: messageData.status || 'pending',
                queueJobId: messageData.queueJobId,
                userId: messageData.userId,
                clientId: messageData.clientId,
                metadata: messageData.metadata || {}
            });

            const savedLog = await logEntry.save();
            
            this.logger.logDebug('Message logged successfully', {
                messageId: savedLog.messageId,
                connectionId: savedLog.connectionId,
                recipient: savedLog.recipient,
                processingTime: Date.now() - startTime
            });

            return savedLog;
        } catch (error) {
            this.logger.logError('Failed to log message', error, {
                messageData,
                operation: 'logMessage'
            });
            throw error;
        }
    }

    /**
     * Update message status
     * @param {string} messageId - Message ID
     * @param {string} newStatus - New status
     * @param {Object} additionalData - Additional data
     * @returns {Promise<MessageLog>}
     */
    async updateMessageStatus(messageId, newStatus, additionalData = {}) {
        try {
            const startTime = Date.now();
            
            const messageLog = await MessageLog.findOne({ messageId });
            if (!messageLog) {
                throw new Error(`Message log not found: ${messageId}`);
            }

            const updatedLog = await messageLog.updateStatus(newStatus, additionalData);
            
            this.logger.logInfo('Message status updated', {
                messageId,
                oldStatus: messageLog.status,
                newStatus,
                processingTime: Date.now() - startTime
            });

            return updatedLog;
        } catch (error) {
            this.logger.logError('Failed to update message status', error, {
                messageId,
                newStatus,
                additionalData,
                operation: 'updateMessageStatus'
            });
            throw error;
        }
    }

    /**
     * Get message history with filters
     * @param {Object} filters - Filter criteria
     * @param {Object} options - Query options
     * @returns {Promise<Object>}
     */
    async getMessageHistory(filters = {}, options = {}) {
        try {
            const startTime = Date.now();
            
            const {
                connectionId,
                recipient,
                status,
                userId,
                startDate,
                endDate,
                limit = 100,
                skip = 0,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = filters;

            const query = {};

            if (connectionId) query.connectionId = connectionId;
            if (recipient) query.recipient = recipient;
            if (status) query.status = status;
            if (userId) query.userId = userId;
            
            if (startDate || endDate) {
                query.createdAt = {};
                if (startDate) query.createdAt.$gte = new Date(startDate);
                if (endDate) query.createdAt.$lte = new Date(endDate);
            }

            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

            const messages = await MessageLog.find(query)
                .sort(sort)
                .limit(limit)
                .skip(skip)
                .lean();

            const total = await MessageLog.countDocuments(query);

            this.logger.logDebug('Message history retrieved', {
                filters,
                resultCount: messages.length,
                total,
                processingTime: Date.now() - startTime
            });

            return {
                messages,
                pagination: {
                    total,
                    limit,
                    skip,
                    hasMore: skip + limit < total
                }
            };
        } catch (error) {
            this.logger.logError('Failed to get message history', error, {
                filters,
                options,
                operation: 'getMessageHistory'
            });
            throw error;
        }
    }

    /**
     * Get delivery statistics
     * @param {Object} filters - Filter criteria
     * @returns {Promise<Object>}
     */
    async getDeliveryStats(filters = {}) {
        try {
            const startTime = Date.now();
            
            const {
                connectionId,
                startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
                endDate = new Date()
            } = filters;

            const matchStage = {
                createdAt: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            };

            if (connectionId) {
                matchStage.connectionId = connectionId;
            }

            const stats = await MessageLog.aggregate([
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

            // Calculate totals and success rates
            const totalMessages = stats.reduce((sum, stat) => sum + stat.count, 0);
            const successfulMessages = stats
                .filter(stat => ['delivered', 'read'].includes(stat._id))
                .reduce((sum, stat) => sum + stat.count, 0);

            const result = {
                period: {
                    startDate: new Date(startDate),
                    endDate: new Date(endDate)
                },
                totalMessages,
                successfulMessages,
                successRate: totalMessages > 0 ? (successfulMessages / totalMessages * 100).toFixed(2) : 0,
                stats: stats.reduce((acc, stat) => {
                    acc[stat._id] = {
                        count: stat.count,
                        percentage: totalMessages > 0 ? (stat.count / totalMessages * 100).toFixed(2) : 0,
                        avgProcessingTime: stat.avgProcessingTime ? Math.round(stat.avgProcessingTime) : 0,
                        avgDeliveryTime: stat.avgDeliveryTime ? Math.round(stat.avgDeliveryTime) : 0
                    };
                    return acc;
                }, {}),
                processingTime: Date.now() - startTime
            };

            this.logger.logInfo('Delivery stats retrieved', {
                filters,
                totalMessages,
                successRate: result.successRate,
                processingTime: result.processingTime
            });

            return result;
        } catch (error) {
            this.logger.logError('Failed to get delivery stats', error, {
                filters,
                operation: 'getDeliveryStats'
            });
            throw error;
        }
    }

    /**
     * Generate comprehensive report
     * @param {Object} options - Report options
     * @returns {Promise<Object>}
     */
    async generateReport(options = {}) {
        try {
            const startTime = Date.now();
            
            const {
                connectionId,
                startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
                endDate = new Date(),
                includeDailyStats = true,
                includeFailedMessages = true
            } = options;

            const report = {
                generatedAt: new Date(),
                period: {
                    startDate: new Date(startDate),
                    endDate: new Date(endDate)
                },
                summary: {},
                dailyStats: [],
                failedMessages: [],
                recommendations: []
            };

            // Get overall stats
            const overallStats = await this.getDeliveryStats({
                connectionId,
                startDate,
                endDate
            });

            report.summary = overallStats;

            // Get daily stats if requested
            if (includeDailyStats) {
                const dailyStats = await MessageLog.getDailyStats(
                    new Date(startDate),
                    new Date(endDate)
                );
                report.dailyStats = dailyStats;
            }

            // Get failed messages if requested
            if (includeFailedMessages) {
                const failedMessages = await MessageLog.getFailedMessages(50);
                report.failedMessages = failedMessages.slice(0, 10); // Limit to top 10
            }

            // Generate recommendations
            report.recommendations = this.generateRecommendations(report);

            report.processingTime = Date.now() - startTime;

            this.logger.logInfo('Report generated successfully', {
                options,
                summary: report.summary,
                processingTime: report.processingTime
            });

            return report;
        } catch (error) {
            this.logger.logError('Failed to generate report', error, {
                options,
                operation: 'generateReport'
            });
            throw error;
        }
    }

    /**
     * Get connection-specific statistics
     * @param {string} connectionId - Connection ID
     * @param {Object} options - Query options
     * @returns {Promise<Object>}
     */
    async getConnectionStats(connectionId, options = {}) {
        try {
            const startTime = Date.now();
            
            const {
                startDate = new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
                endDate = new Date()
            } = options;

            const stats = await MessageLog.getStatsByConnection(
                connectionId,
                new Date(startDate),
                new Date(endDate)
            );

            const result = {
                connectionId,
                period: {
                    startDate: new Date(startDate),
                    endDate: new Date(endDate)
                },
                stats: stats.reduce((acc, stat) => {
                    acc[stat._id] = {
                        count: stat.count,
                        avgProcessingTime: stat.avgProcessingTime ? Math.round(stat.avgProcessingTime) : 0,
                        avgDeliveryTime: stat.avgDeliveryTime ? Math.round(stat.avgDeliveryTime) : 0
                    };
                    return acc;
                }, {}),
                processingTime: Date.now() - startTime
            };

            this.logger.logDebug('Connection stats retrieved', {
                connectionId,
                result,
                processingTime: result.processingTime
            });

            return result;
        } catch (error) {
            this.logger.logError('Failed to get connection stats', error, {
                connectionId,
                options,
                operation: 'getConnectionStats'
            });
            throw error;
        }
    }

    /**
     * Clean old log entries
     * @param {number} daysToKeep - Number of days to keep logs
     * @returns {Promise<Object>}
     */
    async cleanOldLogs(daysToKeep = 90) {
        try {
            const startTime = Date.now();
            
            const result = await MessageLog.cleanOldLogs(daysToKeep);
            
            this.logger.logInfo('Old logs cleaned', {
                daysToKeep,
                deletedCount: result.deletedCount,
                processingTime: Date.now() - startTime
            });

            return {
                deletedCount: result.deletedCount,
                daysToKeep,
                processingTime: Date.now() - startTime
            };
        } catch (error) {
            this.logger.logError('Failed to clean old logs', error, {
                daysToKeep,
                operation: 'cleanOldLogs'
            });
            throw error;
        }
    }

    /**
     * Generate recommendations based on report data
     * @param {Object} report - Report data
     * @returns {Array}
     */
    generateRecommendations(report) {
        const recommendations = [];

        const successRate = parseFloat(report.summary.successRate);
        
        if (successRate < 80) {
            recommendations.push({
                type: 'warning',
                priority: 'high',
                message: 'Success rate is below 80%. Consider reviewing failed messages and rate limiting settings.',
                action: 'Review failed messages and adjust rate limiting'
            });
        }

        if (successRate < 60) {
            recommendations.push({
                type: 'critical',
                priority: 'urgent',
                message: 'Success rate is critically low. Immediate action required.',
                action: 'Check WhatsApp connection and rate limiting immediately'
            });
        }

        const failedCount = report.summary.stats.failed?.count || 0;
        if (failedCount > 10) {
            recommendations.push({
                type: 'warning',
                priority: 'medium',
                message: `High number of failed messages (${failedCount}). Review error patterns.`,
                action: 'Analyze failed messages for common error patterns'
            });
        }

        const avgProcessingTime = report.summary.stats.sent?.avgProcessingTime || 0;
        if (avgProcessingTime > 5000) {
            recommendations.push({
                type: 'info',
                priority: 'low',
                message: 'High average processing time. Consider optimizing queue processing.',
                action: 'Review queue worker performance and concurrency settings'
            });
        }

        return recommendations;
    }
}

module.exports = LogService; 