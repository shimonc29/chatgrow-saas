const express = require('express');
const router = express.Router();
const healthService = require('../services/healthService');
const authMiddleware = require('../middleware/auth');
const { logInfo, logError, logApiRequest } = require('../utils/logger');

// Request timing middleware
router.use((req, res, next) => {
    req.startTime = Date.now();
    next();
});

// Basic health check - no authentication required
// GET /api/health
router.get('/', async (req, res) => {
    try {
        const health = await healthService.runFullHealthCheck();
        
        const statusCode = health.overall === 'healthy' ? 200 : 503;
        
        res.status(statusCode).json({
            success: true,
            status: health.overall,
            timestamp: health.timestamp,
            responseTime: health.responseTime,
            uptime: process.uptime(),
            version: process.env.npm_package_version || '1.0.0'
        });
    } catch (error) {
        logError('Health check failed', error);
        res.status(503).json({
            success: false,
            status: 'error',
            error: 'Health check failed',
            timestamp: new Date()
        });
    }
});

// Detailed health check - requires authentication
// GET /api/health/detailed
router.get('/detailed', authMiddleware.authenticate(), async (req, res) => {
    try {
        const detailedHealth = await healthService.runDetailedHealthCheck();
        
        const statusCode = detailedHealth.overall === 'healthy' ? 200 : 503;
        
        res.status(statusCode).json({
            success: true,
            data: {
                overall: detailedHealth.overall,
                timestamp: detailedHealth.timestamp,
                responseTime: detailedHealth.responseTime,
                checks: detailedHealth.checks,
                detailed: detailedHealth.detailed,
                uptime: process.uptime(),
                version: process.env.npm_package_version || '1.0.0'
            }
        });
    } catch (error) {
        logError('Detailed health check failed', error);
        res.status(503).json({
            success: false,
            error: 'Detailed health check failed',
            message: error.message
        });
    }
});

// WhatsApp connections health check - requires authentication
// GET /api/health/connections
router.get('/connections', authMiddleware.authenticate(), async (req, res) => {
    try {
        const connectionHealth = await healthService.checkWhatsAppConnections();
        const connectionMetrics = await healthService.getConnectionMetrics();
        
        res.json({
            success: true,
            data: {
                health: connectionHealth,
                metrics: connectionMetrics,
                timestamp: new Date()
            }
        });
    } catch (error) {
        logError('WhatsApp connections health check failed', error);
        res.status(500).json({
            success: false,
            error: 'WhatsApp connections health check failed',
            message: error.message
        });
    }
});

// Dashboard data - requires authentication
// GET /api/health/dashboard
router.get('/dashboard', authMiddleware.authenticate(), async (req, res) => {
    try {
        const dashboardData = await healthService.getDashboardData();
        
        res.json({
            success: true,
            data: dashboardData
        });
    } catch (error) {
        logError('Dashboard data retrieval failed', error);
        res.status(500).json({
            success: false,
            error: 'Dashboard data retrieval failed',
            message: error.message
        });
    }
});

// Individual service health checks - requires authentication
// GET /api/health/mongodb
router.get('/mongodb', authMiddleware.authenticate(), async (req, res) => {
    try {
        const mongoHealth = await healthService.checkMongoDB();
        
        const statusCode = mongoHealth.status === 'healthy' ? 200 : 503;
        
        res.status(statusCode).json({
            success: true,
            data: mongoHealth
        });
    } catch (error) {
        logError('MongoDB health check failed', error);
        res.status(503).json({
            success: false,
            error: 'MongoDB health check failed',
            message: error.message
        });
    }
});

// GET /api/health/redis
router.get('/redis', authMiddleware.authenticate(), async (req, res) => {
    try {
        const redisHealth = await healthService.checkRedis();
        
        const statusCode = redisHealth.status === 'healthy' ? 200 : 503;
        
        res.status(statusCode).json({
            success: true,
            data: redisHealth
        });
    } catch (error) {
        logError('Redis health check failed', error);
        res.status(503).json({
            success: false,
            error: 'Redis health check failed',
            message: error.message
        });
    }
});

// GET /api/health/queue
router.get('/queue', authMiddleware.authenticate(), async (req, res) => {
    try {
        const queueHealth = await healthService.checkQueue();
        const queueMetrics = await healthService.getQueueMetrics();
        
        const statusCode = queueHealth.status === 'healthy' ? 200 : 503;
        
        res.status(statusCode).json({
            success: true,
            data: {
                health: queueHealth,
                metrics: queueMetrics
            }
        });
    } catch (error) {
        logError('Queue health check failed', error);
        res.status(503).json({
            success: false,
            error: 'Queue health check failed',
            message: error.message
        });
    }
});

// GET /api/health/system
router.get('/system', authMiddleware.authenticate(), async (req, res) => {
    try {
        const systemHealth = healthService.checkSystemResources();
        const systemMetrics = healthService.getSystemMetrics();
        
        const statusCode = systemHealth.status === 'healthy' ? 200 : 503;
        
        res.status(statusCode).json({
            success: true,
            data: {
                health: systemHealth,
                metrics: systemMetrics
            }
        });
    } catch (error) {
        logError('System health check failed', error);
        res.status(503).json({
            success: false,
            error: 'System health check failed',
            message: error.message
        });
    }
});

// Performance metrics - requires authentication
// GET /api/health/performance
router.get('/performance', authMiddleware.authenticate(), async (req, res) => {
    try {
        const performanceMetrics = await healthService.getPerformanceMetrics();
        
        res.json({
            success: true,
            data: performanceMetrics
        });
    } catch (error) {
        logError('Performance metrics retrieval failed', error);
        res.status(500).json({
            success: false,
            error: 'Performance metrics retrieval failed',
            message: error.message
        });
    }
});

// Health check history - requires authentication
// GET /api/health/history
router.get('/history', authMiddleware.authenticate(), async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const history = Array.from(healthService.healthChecks.values())
            .slice(-parseInt(limit))
            .map(check => ({
                timestamp: check.timestamp,
                overall: check.overall,
                responseTime: check.responseTime,
                checks: Object.keys(check.checks).map(service => ({
                    service,
                    status: check.checks[service].status,
                    responseTime: check.checks[service].responseTime
                }))
            }));
        
        res.json({
            success: true,
            data: {
                history,
                total: healthService.metrics.totalChecks,
                failed: healthService.metrics.failedChecks
            }
        });
    } catch (error) {
        logError('Health history retrieval failed', error);
        res.status(500).json({
            success: false,
            error: 'Health history retrieval failed',
            message: error.message
        });
    }
});

// Health check configuration - requires admin authentication
// GET /api/health/config
router.get('/config', authMiddleware.requirePlan(['enterprise']), async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                thresholds: healthService.thresholds,
                metrics: {
                    totalChecks: healthService.metrics.totalChecks,
                    failedChecks: healthService.metrics.failedChecks,
                    uptime: Date.now() - healthService.metrics.uptime
                }
            }
        });
    } catch (error) {
        logError('Health config retrieval failed', error);
        res.status(500).json({
            success: false,
            error: 'Health config retrieval failed',
            message: error.message
        });
    }
});

// Manual health check trigger - requires admin authentication
// POST /api/health/trigger
router.post('/trigger', authMiddleware.requirePlan(['enterprise']), async (req, res) => {
    try {
        const { type = 'full' } = req.body;
        
        let healthResult;
        if (type === 'detailed') {
            healthResult = await healthService.runDetailedHealthCheck();
        } else {
            healthResult = await healthService.runFullHealthCheck();
        }
        
        res.json({
            success: true,
            data: healthResult
        });
    } catch (error) {
        logError('Manual health check trigger failed', error);
        res.status(500).json({
            success: false,
            error: 'Manual health check trigger failed',
            message: error.message
        });
    }
});

// Response time logging middleware
router.use((req, res, next) => {
    const responseTime = Date.now() - req.startTime;
    logApiRequest('Health API', {
        method: req.method,
        path: req.path,
        responseTime,
        statusCode: res.statusCode,
        userAgent: req.get('User-Agent')
    });
    next();
});

// Error handling middleware for health routes
router.use((error, req, res, next) => {
    logError('Health route error', error, {
        method: req.method,
        path: req.path,
        userAgent: req.get('User-Agent')
    });
    
    res.status(500).json({
        success: false,
        error: 'Internal health service error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred'
    });
});

module.exports = router; 