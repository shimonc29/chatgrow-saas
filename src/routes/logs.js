const express = require('express');
const router = express.Router();
const LogService = require('../services/logService');
const { logApiRequest, logError } = require('../utils/logger');

// Initialize log service
const logService = new LogService();

// Middleware for request logging
const logRequest = (req, res, next) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        logApiRequest(req.method, req.originalUrl, res.statusCode, responseTime, {
            userAgent: req.get('User-Agent'),
            ip: req.ip,
            userId: req.user?.id
        });
    });
    
    next();
};

// Apply logging middleware to all routes
router.use(logRequest);

/**
 * @route GET /api/logs/messages
 * @desc Get message history with filters
 * @access Private
 */
router.get('/messages', async (req, res) => {
    try {
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
        } = req.query;

        // Validate limit
        const parsedLimit = Math.min(parseInt(limit) || 100, 1000);
        const parsedSkip = parseInt(skip) || 0;

        const filters = {
            connectionId,
            recipient,
            status,
            userId,
            startDate,
            endDate,
            limit: parsedLimit,
            skip: parsedSkip,
            sortBy,
            sortOrder
        };

        const result = await logService.getMessageHistory(filters);

        res.json({
            success: true,
            data: result,
            message: 'Message history retrieved successfully'
        });
    } catch (error) {
        logError('Failed to get message history', error, {
            query: req.query,
            operation: 'GET /api/logs/messages'
        });

        res.status(500).json({
            success: false,
            error: 'Failed to retrieve message history',
            message: error.message
        });
    }
});

/**
 * @route GET /api/logs/stats
 * @desc Get delivery statistics
 * @access Private
 */
router.get('/stats', async (req, res) => {
    try {
        const {
            connectionId,
            startDate,
            endDate
        } = req.query;

        const filters = {
            connectionId,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined
        };

        const stats = await logService.getDeliveryStats(filters);

        res.json({
            success: true,
            data: stats,
            message: 'Delivery statistics retrieved successfully'
        });
    } catch (error) {
        logError('Failed to get delivery stats', error, {
            query: req.query,
            operation: 'GET /api/logs/stats'
        });

        res.status(500).json({
            success: false,
            error: 'Failed to retrieve delivery statistics',
            message: error.message
        });
    }
});

/**
 * @route GET /api/logs/connection/:id
 * @desc Get connection-specific statistics
 * @access Private
 */
router.get('/connection/:id', async (req, res) => {
    try {
        const { id: connectionId } = req.params;
        const {
            startDate,
            endDate
        } = req.query;

        const options = {
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined
        };

        const stats = await logService.getConnectionStats(connectionId, options);

        res.json({
            success: true,
            data: stats,
            message: 'Connection statistics retrieved successfully'
        });
    } catch (error) {
        logError('Failed to get connection stats', error, {
            connectionId: req.params.id,
            query: req.query,
            operation: 'GET /api/logs/connection/:id'
        });

        res.status(500).json({
            success: false,
            error: 'Failed to retrieve connection statistics',
            message: error.message
        });
    }
});

/**
 * @route GET /api/logs/report
 * @desc Generate comprehensive report
 * @access Private
 */
router.get('/report', async (req, res) => {
    try {
        const {
            connectionId,
            startDate,
            endDate,
            includeDailyStats = 'true',
            includeFailedMessages = 'true'
        } = req.query;

        const options = {
            connectionId,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            includeDailyStats: includeDailyStats === 'true',
            includeFailedMessages: includeFailedMessages === 'true'
        };

        const report = await logService.generateReport(options);

        res.json({
            success: true,
            data: report,
            message: 'Report generated successfully'
        });
    } catch (error) {
        logError('Failed to generate report', error, {
            query: req.query,
            operation: 'GET /api/logs/report'
        });

        res.status(500).json({
            success: false,
            error: 'Failed to generate report',
            message: error.message
        });
    }
});

/**
 * @route GET /api/logs/failed
 * @desc Get failed messages
 * @access Private
 */
router.get('/failed', async (req, res) => {
    try {
        const {
            limit = 50,
            skip = 0
        } = req.query;

        const parsedLimit = Math.min(parseInt(limit) || 50, 200);
        const parsedSkip = parseInt(skip) || 0;

        const filters = {
            status: 'failed',
            limit: parsedLimit,
            skip: parsedSkip,
            sortBy: 'failedAt',
            sortOrder: 'desc'
        };

        const result = await logService.getMessageHistory(filters);

        res.json({
            success: true,
            data: result,
            message: 'Failed messages retrieved successfully'
        });
    } catch (error) {
        logError('Failed to get failed messages', error, {
            query: req.query,
            operation: 'GET /api/logs/failed'
        });

        res.status(500).json({
            success: false,
            error: 'Failed to retrieve failed messages',
            message: error.message
        });
    }
});

/**
 * @route GET /api/logs/recipient/:phone
 * @desc Get messages by recipient phone number
 * @access Private
 */
router.get('/recipient/:phone', async (req, res) => {
    try {
        const { phone } = req.params;
        const {
            limit = 100,
            skip = 0,
            startDate,
            endDate
        } = req.query;

        const parsedLimit = Math.min(parseInt(limit) || 100, 500);
        const parsedSkip = parseInt(skip) || 0;

        const filters = {
            recipient: phone,
            startDate,
            endDate,
            limit: parsedLimit,
            skip: parsedSkip,
            sortBy: 'createdAt',
            sortOrder: 'desc'
        };

        const result = await logService.getMessageHistory(filters);

        res.json({
            success: true,
            data: result,
            message: 'Recipient messages retrieved successfully'
        });
    } catch (error) {
        logError('Failed to get recipient messages', error, {
            phone: req.params.phone,
            query: req.query,
            operation: 'GET /api/logs/recipient/:phone'
        });

        res.status(500).json({
            success: false,
            error: 'Failed to retrieve recipient messages',
            message: error.message
        });
    }
});

/**
 * @route POST /api/logs/clean
 * @desc Clean old log entries
 * @access Private
 */
router.post('/clean', async (req, res) => {
    try {
        const { daysToKeep = 90 } = req.body;

        const parsedDaysToKeep = Math.max(parseInt(daysToKeep) || 90, 1);

        const result = await logService.cleanOldLogs(parsedDaysToKeep);

        res.json({
            success: true,
            data: result,
            message: 'Old logs cleaned successfully'
        });
    } catch (error) {
        logError('Failed to clean old logs', error, {
            body: req.body,
            operation: 'POST /api/logs/clean'
        });

        res.status(500).json({
            success: false,
            error: 'Failed to clean old logs',
            message: error.message
        });
    }
});

/**
 * @route GET /api/logs/status/:messageId
 * @desc Get specific message status
 * @access Private
 */
router.get('/status/:messageId', async (req, res) => {
    try {
        const { messageId } = req.params;

        const MessageLog = require('../models/MessageLog');
        const messageLog = await MessageLog.findOne({ messageId }).lean();

        if (!messageLog) {
            return res.status(404).json({
                success: false,
                error: 'Message not found',
                message: `Message with ID ${messageId} not found`
            });
        }

        res.json({
            success: true,
            data: messageLog,
            message: 'Message status retrieved successfully'
        });
    } catch (error) {
        logError('Failed to get message status', error, {
            messageId: req.params.messageId,
            operation: 'GET /api/logs/status/:messageId'
        });

        res.status(500).json({
            success: false,
            error: 'Failed to retrieve message status',
            message: error.message
        });
    }
});

/**
 * @route GET /api/logs/health
 * @desc Health check for logging system
 * @access Public
 */
router.get('/health', async (req, res) => {
    try {
        const MessageLog = require('../models/MessageLog');
        
        // Check database connection
        const totalMessages = await MessageLog.countDocuments();
        const recentMessages = await MessageLog.countDocuments({
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        const health = {
            status: 'healthy',
            timestamp: new Date(),
            database: {
                connected: true,
                totalMessages,
                recentMessages24h: recentMessages
            },
            services: {
                logService: 'operational',
                messageLog: 'operational'
            }
        };

        res.json({
            success: true,
            data: health,
            message: 'Logging system is healthy'
        });
    } catch (error) {
        logError('Logging system health check failed', error, {
            operation: 'GET /api/logs/health'
        });

        res.status(503).json({
            success: false,
            error: 'Logging system is unhealthy',
            message: error.message,
            data: {
                status: 'unhealthy',
                timestamp: new Date(),
                database: {
                    connected: false
                }
            }
        });
    }
});

module.exports = router; 