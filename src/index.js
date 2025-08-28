const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// Import logging system
const { logInfo, logError, logWarning } = require('./utils/logger');

// Import routes
const logsRoutes = require('./routes/logs');
const authRoutes = require('./routes/auth');
const whatsAppRoutes = require('./routes/whatsapp');
const healthRoutes = require('./routes/health'); // Added Health monitoring routes
const eventsRoutes = require('./routes/events'); // Added Events management routes

// Import middleware
const RateLimiterMiddleware = require('./middleware/rateLimiter');
const authMiddleware = require('./middleware/auth');
const securityMiddleware = require('./middleware/security');

// Import queue system
const { messageQueue } = require('./queues/messageQueue');

// Import services
const QueueService = require('./services/queueService');
const LogService = require('./services/logService');

// Initialize services
const queueService = new QueueService();
const logService = new LogService();
const rateLimiter = new RateLimiterMiddleware();

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(securityMiddleware.configureHelmet());
app.use(securityMiddleware.ipFilter());
app.use(securityMiddleware.requestLogger());
app.use(securityMiddleware.inputValidation());
app.use(securityMiddleware.configureCORS());
app.use(securityMiddleware.requestSizeLimit());
app.use(securityMiddleware.securityHeaders());

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (handled by security middleware)

// Root endpoint - redirect to dashboard
app.get('/', (req, res) => {
    res.redirect('/dashboard');
});

// API info endpoint
app.get('/api', (req, res) => {
    res.json({
        success: true,
        message: 'ChatGrow API Server is running',
        version: process.env.npm_package_version || '1.0.0',
        timestamp: new Date(),
        endpoints: {
            dashboard: '/dashboard',
            health: '/health',
            auth: '/api/auth',
            logs: '/api/logs',
            whatsapp: '/api/whatsapp',
            healthMonitoring: '/api/health',
            queue: '/api/queue',
            rateLimit: '/api/rate-limit'
        }
    });
});

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        const health = {
            status: 'healthy',
            timestamp: new Date(),
            services: {
                database: 'operational',
                queue: 'operational',
                logging: 'operational',
                rateLimiting: 'operational'
            },
            version: process.env.npm_package_version || '1.0.0'
        };

        // Check database connection
        if (mongoose.connection.readyState !== 1) {
            health.status = 'degraded';
            health.services.database = 'disconnected';
            health.warnings = health.warnings || [];
            health.warnings.push('Database not connected - running in fallback mode');
        }

        // Check queue status
        try {
            const queueStatus = await messageQueue.getJobCounts();
            health.queueStats = queueStatus;
        } catch (error) {
            health.services.queue = 'error';
            health.queueError = error.message;
        }

        const statusCode = health.status === 'healthy' ? 200 : 503;
        res.status(statusCode).json(health);
    } catch (error) {
        logError('Health check failed', error);
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date(),
            error: error.message
        });
    }
});

// Favicon handler
app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/whatsapp', whatsAppRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/health', healthRoutes); // Mount health monitoring routes
app.use('/api/events', eventsRoutes); // Mount events management routes
app.use('/api/queue', (req, res) => {
    const QueueService = require('./services/queueService');
    const queueService = new QueueService();

    if (req.path === '/status') {
        queueService.getQueueStatus(req.query.connectionId || 'default')
            .then(result => res.json(result))
            .catch(err => res.status(500).json({ error: err.message }));
    } else if (req.path === '/stats') {
        queueService.getQueueStatistics()
            .then(result => res.json(result))
            .catch(err => res.status(500).json({ error: err.message }));
    } else {
        res.json({
            success: true,
            message: 'Queue API is available',
            endpoints: {
                status: '/api/queue/status?connectionId=YOUR_ID',
                stats: '/api/queue/stats'
            }
        });
    }
});
app.use('', require('./routes/dashboard')); // Added dashboard route

// Rate limiting routes (from rate limiter middleware)
app.use('/api/rate-limit', rateLimiter.createRouter());

// Message queue endpoints
app.post('/api/queue/message', async (req, res) => {
    try {
        const { connectionId, message, recipients, priority = 'normal' } = req.body;

        if (!connectionId || !message || !recipients) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: connectionId, message, recipients'
            });
        }

        // Add message to queue
        const job = await queueService.addMessage(connectionId, message, recipients, priority);

        // Log the message
        const messageData = {
            messageId: job.id.toString(),
            connectionId,
            recipient: Array.isArray(recipients) ? recipients[0] : recipients,
            messageContent: message,
            messageType: 'text',
            status: 'pending',
            queueJobId: job.id.toString(),
            userId: req.user?.id,
            metadata: { priority, recipients }
        };

        await logService.logMessage(messageData);

        res.json({
            success: true,
            data: {
                jobId: job.id,
                messageId: job.id.toString(),
                status: 'queued'
            },
            message: 'Message added to queue successfully'
        });

    } catch (error) {
        logError('Failed to add message to queue', error, {
            body: req.body,
            operation: 'POST /api/queue/message'
        });

        res.status(500).json({
            success: false,
            error: 'Failed to add message to queue',
            message: error.message
        });
    }
});

app.get('/api/queue/status/:connectionId', async (req, res) => {
    try {
        const { connectionId } = req.params;
        const status = await queueService.getQueueStatus(connectionId);

        res.json({
            success: true,
            data: status,
            message: 'Queue status retrieved successfully'
        });

    } catch (error) {
        logError('Failed to get queue status', error, {
            connectionId: req.params.connectionId,
            operation: 'GET /api/queue/status/:connectionId'
        });

        res.status(500).json({
            success: false,
            error: 'Failed to get queue status',
            message: error.message
        });
    }
});

app.post('/api/queue/pause/:connectionId', async (req, res) => {
    try {
        const { connectionId } = req.params;
        await queueService.pauseQueue(connectionId);

        res.json({
            success: true,
            message: 'Queue paused successfully'
        });

    } catch (error) {
        logError('Failed to pause queue', error, {
            connectionId: req.params.connectionId,
            operation: 'POST /api/queue/pause/:connectionId'
        });

        res.status(500).json({
            success: false,
            error: 'Failed to pause queue',
            message: error.message
        });
    }
});

app.post('/api/queue/resume/:connectionId', async (req, res) => {
    try {
        const { connectionId } = req.params;
        await queueService.resumeQueue(connectionId);

        res.json({
            success: true,
            message: 'Queue resumed successfully'
        });

    } catch (error) {
        logError('Failed to resume queue', error, {
            connectionId: req.params.connectionId,
            operation: 'POST /api/queue/resume/:connectionId'
        });

        res.status(500).json({
            success: false,
            error: 'Failed to resume queue',
            message: error.message
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    logError('Unhandled error', error, {
        url: req.originalUrl,
        method: req.method,
        ip: req.ip
    });

    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        message: `Cannot ${req.method} ${req.originalUrl}`
    });
});

// Connect to MongoDB
async function connectToDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatgrow';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      bufferCommands: false, // Disable mongoose buffering
      bufferMaxEntries: 0 // Disable mongoose buffering
    });
    logInfo('Connected to MongoDB successfully');
    return true;
  } catch (error) {
    logWarning('MongoDB not available, running in fallback mode:', error.message);
    // Set mongoose to not buffer commands when disconnected
    mongoose.set('bufferCommands', false);
    return false;
  }
}

// Graceful shutdown
async function gracefulShutdown(signal, server) {
    logInfo(`Received ${signal}. Starting graceful shutdown...`);

    try {
        // Close database connection
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            logInfo('Database connection closed');
        }

        // Close queue connections
        if (messageQueue && typeof messageQueue.close === 'function') {
            await messageQueue.close();
            logInfo('Message queue closed');
        }

        // Close server
        if (server) {
            server.close(() => {
                logInfo('HTTP server closed');
                process.exit(0);
            });
        } else {
            process.exit(0);
        }

    } catch (error) {
        logError('Error during graceful shutdown', error);
        process.exit(1);
    }
}

// Start server
async function startServer() {
    try {
        // Connect to database
        const dbConnected = await connectToDatabase();

        // Start server
        const server = app.listen(PORT, '0.0.0.0', () => {
            logInfo(`ChatGrow server started successfully`, {
                port: PORT,
                environment: process.env.NODE_ENV,
                version: process.env.npm_package_version || '1.0.0'
            });

            console.log(`🚀 ChatGrow server running on port ${PORT}`);
            console.log(`📊 Health check: http://0.0.0.0:${PORT}/health`);
            console.log(`🔐 Auth API: http://0.0.0.0:${PORT}/api/auth`);
            console.log(`📝 Logs API: http://0.0.0.0:${PORT}/api/logs`);
            console.log(`📱 WhatsApp API: http://0.0.0.0:${PORT}/api/whatsapp`);
            console.log(`🏥 Health API: http://0.0.0.0:${PORT}/api/health`);
            console.log(`⚡ Queue API: http://0.0.0.0:${PORT}/api/queue`);
            console.log(`🛡️ Rate Limit API: http://0.0.0.0:${PORT}/api/rate-limit`);
        });

        // Handle graceful shutdown
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM', server));
        process.on('SIGINT', () => gracefulShutdown('SIGINT', server));

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            logError('Uncaught Exception', error);
            gracefulShutdown('uncaughtException', server);
        });

        process.on('unhandledRejection', (reason, promise) => {
            logError('Unhandled Rejection', new Error(reason), { promise });
            gracefulShutdown('unhandledRejection', server);
        });

    } catch (error) {
        logError('Failed to start server', error);
        process.exit(1);
    }
}

// Start the application
if (require.main === module) {
    startServer();
}

module.exports = app;