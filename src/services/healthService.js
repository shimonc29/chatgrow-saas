const mongoose = require('mongoose');
// const Redis = require('ioredis'); // Disabled for development
const { messageQueue } = require('../queues/messageQueue');
const whatsAppService = require('./whatsappService');
const WhatsAppConnection = require('../models/WhatsAppConnection');
const { logInfo, logError, logWarning, logDebug } = require('../utils/logger');
const { sendAlert } = require('../utils/alerts');

class HealthService {
    constructor() {
        this.healthChecks = new Map();
        this.metrics = {
            responseTimes: [],
            lastCheck: null,
            uptime: Date.now(),
            totalChecks: 0,
            failedChecks: 0
        };
        this.thresholds = {
            mongoResponseTime: 1000, // 1 second
            redisResponseTime: 500,   // 500ms
            queueLatency: 5000,       // 5 seconds
            whatsAppResponseTime: 3000, // 3 seconds
            memoryUsage: 0.9,         // 90%
            cpuUsage: 0.8             // 80%
        };
        this.alertHistory = new Map();
        this.init();
    }

    async init() {
        try {
            // Disable Redis completely for development
            this.redis = null;
            logInfo('Redis disabled for development');
            
            // Start periodic health checks
            this.startPeriodicChecks();
            
            // Start metrics collection
            this.startMetricsCollection();
            
            logInfo('Health service initialized successfully');
        } catch (error) {
            logError('Failed to initialize health service', error);
        }
    }

    startPeriodicChecks() {
        // Disable automatic health checks for development
        logInfo('Periodic health checks disabled for development');
    }

    startMetricsCollection() {
        // Disable metrics collection for development
        logInfo('Metrics collection disabled for development');
    }

    async runFullHealthCheck() {
        const startTime = Date.now();
        const results = {
            timestamp: new Date(),
            overall: 'healthy',
            checks: {},
            responseTime: 0
        };

        try {
            // MongoDB Health Check
            results.checks.mongodb = await this.checkMongoDB();
            
            // Redis Health Check
            results.checks.redis = await this.checkRedis();
            
            // Queue Health Check
            results.checks.queue = await this.checkQueue();
            
            // WhatsApp Connections Check
            results.checks.whatsapp = await this.checkWhatsAppConnections();
            
            // System Resources Check
            results.checks.system = this.checkSystemResources();

            // Determine overall health
            const failedChecks = Object.values(results.checks).filter(check => check.status === 'unhealthy');
            results.overall = failedChecks.length > 0 ? 'unhealthy' : 'healthy';
            
            results.responseTime = Date.now() - startTime;
            this.metrics.totalChecks++;
            
            if (results.overall === 'unhealthy') {
                this.metrics.failedChecks++;
                await this.handleHealthIssues(results);
            }

            this.healthChecks.set('last', results);
            logDebug('Health check completed', { overall: results.overall, responseTime: results.responseTime });

        } catch (error) {
            logError('Health check failed', error);
            results.overall = 'error';
            results.error = error.message;
            this.metrics.failedChecks++;
        }

        return results;
    }

    async runDetailedHealthCheck() {
        const results = await this.runFullHealthCheck();
        
        // Add detailed metrics
        results.detailed = {
            performance: await this.getPerformanceMetrics(),
            connections: await this.getConnectionMetrics(),
            queue: await this.getQueueMetrics(),
            system: this.getSystemMetrics()
        };

        this.healthChecks.set('detailed', results);
        return results;
    }

    async checkMongoDB() {
        const startTime = Date.now();
        
        try {
            // Check connection status
            const readyState = mongoose.connection.readyState;
            const isConnected = readyState === 1;
            
            // Test query performance
            const testStart = Date.now();
            await mongoose.connection.db.admin().ping();
            const queryTime = Date.now() - testStart;
            
            const responseTime = Date.now() - startTime;
            const status = isConnected && queryTime < this.thresholds.mongoResponseTime ? 'healthy' : 'unhealthy';
            
            return {
                status,
                responseTime,
                readyState,
                isConnected,
                queryTime,
                details: {
                    host: mongoose.connection.host,
                    port: mongoose.connection.port,
                    database: mongoose.connection.name
                }
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                responseTime: Date.now() - startTime,
                error: error.message,
                readyState: mongoose.connection.readyState
            };
        }
    }

    async checkRedis() {
        const startTime = Date.now();
        
        if (!this.redis) {
            return {
                status: 'degraded',
                responseTime: Date.now() - startTime,
                error: 'Redis not available',
                details: {
                    message: 'Running without Redis'
                }
            };
        }
        
        try {
            // Test Redis connection and performance
            const testStart = Date.now();
            await this.redis.ping();
            const pingTime = Date.now() - testStart;
            
            // Test Redis operations
            const testKey = `health_check_${Date.now()}`;
            await this.redis.set(testKey, 'test', 'EX', 10);
            await this.redis.get(testKey);
            await this.redis.del(testKey);
            
            const responseTime = Date.now() - startTime;
            const status = pingTime < this.thresholds.redisResponseTime ? 'healthy' : 'unhealthy';
            
            return {
                status,
                responseTime,
                pingTime,
                details: {
                    host: this.redis.options.host,
                    port: this.redis.options.port,
                    database: this.redis.options.db
                }
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                responseTime: Date.now() - startTime,
                error: error.message
            };
        }
    }

    async checkQueue() {
        const startTime = Date.now();
        
        try {
            // Get queue statistics
            const waiting = await messageQueue.getWaiting();
            const active = await messageQueue.getActive();
            const completed = await messageQueue.getCompleted();
            const failed = await messageQueue.getFailed();
            const delayed = await messageQueue.getDelayed();
            
            // Check queue latency
            const jobCount = waiting.length + active.length;
            const avgLatency = jobCount > 0 ? this.calculateQueueLatency(waiting, active) : 0;
            
            const responseTime = Date.now() - startTime;
            const status = avgLatency < this.thresholds.queueLatency ? 'healthy' : 'unhealthy';
            
            return {
                status,
                responseTime,
                jobCount,
                avgLatency,
                details: {
                    waiting: waiting.length,
                    active: active.length,
                    completed: completed.length,
                    failed: failed.length,
                    delayed: delayed.length
                }
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                responseTime: Date.now() - startTime,
                error: error.message
            };
        }
    }

    async checkWhatsAppConnections() {
        const startTime = Date.now();
        
        try {
            // Get connection statistics
            const totalConnections = await WhatsAppConnection.countDocuments();
            const activeConnections = await WhatsAppConnection.countDocuments({ isActive: true });
            const connectedConnections = await WhatsAppConnection.countDocuments({ status: 'authenticated' });
            const errorConnections = await WhatsAppConnection.countDocuments({ status: 'error' });
            
            // Check connection health
            const staleConnections = await WhatsAppConnection.findStaleConnections(10); // 10 minutes
            const healthScore = this.calculateConnectionHealthScore(activeConnections, connectedConnections, errorConnections);
            
            const responseTime = Date.now() - startTime;
            const status = healthScore > 0.7 ? 'healthy' : 'unhealthy';
            
            return {
                status,
                responseTime,
                healthScore,
                details: {
                    total: totalConnections,
                    active: activeConnections,
                    connected: connectedConnections,
                    error: errorConnections,
                    stale: staleConnections.length
                }
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                responseTime: Date.now() - startTime,
                error: error.message
            };
        }
    }

    checkSystemResources() {
        const startTime = Date.now();
        
        try {
            const memUsage = process.memoryUsage();
            const cpuUsage = process.cpuUsage();
            
            const memoryUsagePercent = memUsage.heapUsed / memUsage.heapTotal;
            const isMemoryHealthy = memoryUsagePercent < this.thresholds.memoryUsage;
            
            const responseTime = Date.now() - startTime;
            const status = isMemoryHealthy ? 'healthy' : 'unhealthy';
            
            return {
                status,
                responseTime,
                details: {
                    memory: {
                        used: memUsage.heapUsed,
                        total: memUsage.heapTotal,
                        external: memUsage.external,
                        usagePercent: memoryUsagePercent
                    },
                    cpu: {
                        user: cpuUsage.user,
                        system: cpuUsage.system
                    },
                    uptime: process.uptime()
                }
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                responseTime: Date.now() - startTime,
                error: error.message
            };
        }
    }

    async getPerformanceMetrics() {
        const recentChecks = Array.from(this.healthChecks.values()).slice(-10);
        
        return {
            avgResponseTime: this.calculateAverageResponseTime(recentChecks),
            successRate: this.calculateSuccessRate(recentChecks),
            uptime: Date.now() - this.metrics.uptime,
            totalChecks: this.metrics.totalChecks,
            failedChecks: this.metrics.failedChecks
        };
    }

    async getConnectionMetrics() {
        const connections = await WhatsAppConnection.find();
        
        return {
            total: connections.length,
            byStatus: this.groupConnectionsByStatus(connections),
            byUser: await this.getConnectionsByUser(),
            recentActivity: await this.getRecentConnectionActivity()
        };
    }

    async getQueueMetrics() {
        const waiting = await messageQueue.getWaiting();
        const active = await messageQueue.getActive();
        const completed = await messageQueue.getCompleted();
        const failed = await messageQueue.getFailed();
        
        return {
            currentLoad: waiting.length + active.length,
            throughput: this.calculateQueueThroughput(completed, failed),
            errorRate: failed.length / (completed.length + failed.length) || 0,
            avgProcessingTime: this.calculateAvgProcessingTime(completed)
        };
    }

    getSystemMetrics() {
        const memUsage = process.memoryUsage();
        
        return {
            memory: {
                used: memUsage.heapUsed,
                total: memUsage.heapTotal,
                usagePercent: memUsage.heapUsed / memUsage.heapTotal
            },
            uptime: process.uptime(),
            nodeVersion: process.version,
            platform: process.platform
        };
    }

    async handleHealthIssues(healthResults) {
        const issues = [];
        
        Object.entries(healthResults.checks).forEach(([service, check]) => {
            if (check.status === 'unhealthy') {
                issues.push({
                    service,
                    status: check.status,
                    error: check.error,
                    responseTime: check.responseTime
                });
            }
        });

        if (issues.length > 0) {
            await this.sendHealthAlert(issues, healthResults);
        }
    }

    async sendHealthAlert(issues, healthResults) {
        const alertKey = issues.map(i => i.service).sort().join(',');
        const lastAlert = this.alertHistory.get(alertKey);
        const now = Date.now();
        
        // Prevent spam - only send alert every 5 minutes for same issues
        if (!lastAlert || (now - lastAlert) > 300000) {
            await sendAlert({
                type: 'health_issue',
                severity: 'warning',
                title: 'System Health Issues Detected',
                message: `Found ${issues.length} unhealthy services`,
                details: {
                    issues,
                    overallHealth: healthResults.overall,
                    timestamp: healthResults.timestamp
                }
            });
            
            this.alertHistory.set(alertKey, now);
        }
    }

    // Helper methods
    calculateQueueLatency(waiting, active) {
        const now = Date.now();
        const allJobs = [...waiting, ...active];
        
        if (allJobs.length === 0) return 0;
        
        const totalLatency = allJobs.reduce((sum, job) => {
            return sum + (now - job.timestamp);
        }, 0);
        
        return totalLatency / allJobs.length;
    }

    calculateConnectionHealthScore(active, connected, error) {
        if (active === 0) return 0;
        return (connected / active) * (1 - (error / active));
    }

    calculateAverageResponseTime(checks) {
        if (checks.length === 0) return 0;
        const total = checks.reduce((sum, check) => sum + (check.responseTime || 0), 0);
        return total / checks.length;
    }

    calculateSuccessRate(checks) {
        if (checks.length === 0) return 1;
        const successful = checks.filter(check => check.overall === 'healthy').length;
        return successful / checks.length;
    }

    groupConnectionsByStatus(connections) {
        return connections.reduce((acc, conn) => {
            acc[conn.status] = (acc[conn.status] || 0) + 1;
            return acc;
        }, {});
    }

    async getConnectionsByUser() {
        const result = await WhatsAppConnection.aggregate([
            { $group: { _id: '$userId', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);
        return result;
    }

    async getRecentConnectionActivity() {
        const oneHourAgo = new Date(Date.now() - 3600000);
        return await WhatsAppConnection.find({
            lastHeartbeat: { $gte: oneHourAgo }
        }).sort({ lastHeartbeat: -1 }).limit(10);
    }

    calculateQueueThroughput(completed, failed) {
        const total = completed.length + failed.length;
        if (total === 0) return 0;
        
        // Calculate messages per minute
        const now = Date.now();
        const recentCompleted = completed.filter(job => (now - job.processedOn) < 60000);
        return recentCompleted.length;
    }

    calculateAvgProcessingTime(completed) {
        if (completed.length === 0) return 0;
        
        const totalTime = completed.reduce((sum, job) => {
            return sum + (job.finishedOn - job.processedOn);
        }, 0);
        
        return totalTime / completed.length;
    }

    collectSystemMetrics() {
        const memUsage = process.memoryUsage();
        this.metrics.responseTimes.push({
            timestamp: Date.now(),
            memoryUsage: memUsage.heapUsed / memUsage.heapTotal,
            uptime: process.uptime()
        });

        // Keep only last 100 metrics
        if (this.metrics.responseTimes.length > 100) {
            this.metrics.responseTimes.shift();
        }
    }

    async getDashboardData() {
        const [health, connections, queue] = await Promise.all([
            this.runFullHealthCheck(),
            this.getConnectionMetrics(),
            this.getQueueMetrics()
        ]);

        return {
            health: health.overall,
            connections: {
                total: connections.total,
                active: connections.byStatus.authenticated || 0,
                error: connections.byStatus.error || 0
            },
            queue: {
                waiting: queue.currentLoad,
                throughput: queue.throughput,
                errorRate: queue.errorRate
            },
            system: this.getSystemMetrics(),
            lastUpdated: new Date()
        };
    }

    async cleanup() {
        if (this.redis) {
            await this.redis.quit();
        }
        logInfo('Health service cleaned up');
    }
}

const healthService = new HealthService();

// Graceful shutdown
process.on('SIGTERM', async () => {
    await healthService.cleanup();
});

process.on('SIGINT', async () => {
    await healthService.cleanup();
});

module.exports = healthService; 