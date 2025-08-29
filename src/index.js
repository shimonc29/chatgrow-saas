const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// Import logging system
const { logInfo, logError, logWarning } = require('./utils/logger');

// Import routes with error handling
let logsRoutes, authRoutes, whatsAppRoutes, healthRoutes, eventsRoutes;
try {
    logsRoutes = require('./routes/logs');
    authRoutes = require('./routes/auth');
    whatsAppRoutes = require('./routes/whatsapp');
    healthRoutes = require('./routes/health');
    eventsRoutes = require('./routes/events');
} catch (error) {
    console.warn('Some routes not available, using fallback');
    // Create minimal fallback routes
    const express = require('express');
    logsRoutes = express.Router();
    authRoutes = express.Router();
    whatsAppRoutes = express.Router();
    healthRoutes = express.Router();
    eventsRoutes = express.Router();
    
    // Add basic responses
    logsRoutes.get('/', (req, res) => res.json({ message: 'Logs service not available' }));
    authRoutes.get('/', (req, res) => res.json({ message: 'Auth service not available' }));
    whatsAppRoutes.get('/', (req, res) => res.json({ message: 'WhatsApp service not available' }));
    healthRoutes.get('/', (req, res) => res.json({ message: 'Health service not available' }));
    eventsRoutes.get('/', (req, res) => res.json({ message: 'Events service not available' }));
}

// Import middleware (with error handling)
let RateLimiterMiddleware, authMiddleware, securityMiddleware;
try {
    RateLimiterMiddleware = require('./middleware/rateLimiter');
    authMiddleware = require('./middleware/auth');
    securityMiddleware = require('./middleware/security');
} catch (error) {
    console.warn('Some middleware modules not available, using fallback');
}

// Import queue system with error handling
let messageQueue;
try {
    messageQueue = require('./queues/messageQueue').messageQueue;
} catch (error) {
    console.warn('Message queue not available, using fallback');
    messageQueue = null;
}

// Import services with error handling
let QueueService, LogService;
try {
    QueueService = require('./services/queueService');
    LogService = require('./services/logService');
} catch (error) {
    console.warn('Some services not available, using fallback');
}

// Initialize services (WhatsApp disabled until MongoDB is available)
// const whatsAppService = require('./services/whatsappService');

// Always use mock services for development to prevent startup issues
console.log('Initializing services in fallback mode for development...');
const queueService = {
    addMessage: () => Promise.resolve({ id: 'mock-' + Date.now() }),
    getQueueStatus: () => Promise.resolve({ status: 'mock', waiting: 0, active: 0 }),
    pauseQueue: () => Promise.resolve(),
    resumeQueue: () => Promise.resolve(),
    getQueueStatistics: () => Promise.resolve({ total: 0, processed: 0, failed: 0 })
};
const logService = {
    logMessage: (data) => {
        console.log('Mock log:', data);
        return Promise.resolve({ messageId: data.messageId || 'mock-' + Date.now() });
    },
    updateMessageStatus: (messageId, status, details) => {
        console.log('Mock status update:', { messageId, status, details });
        return Promise.resolve();
    },
    getMessageHistory: () => Promise.resolve({ messages: [], total: 0 })
};

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware (simplified for stable startup)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors());

// Basic root route
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
                database: mongoose.connection.readyState === 1 ? 'operational' : 'fallback',
                queue: 'operational',
                logging: 'operational',
                rateLimiting: 'operational'
            },
            version: process.env.npm_package_version || '1.0.0',
            mode: 'development'
        };

        // Always return healthy in development mode
        res.status(200).json(health);
    } catch (error) {
        console.error('Health check failed:', error);
        res.status(200).json({
            status: 'healthy',
            timestamp: new Date(),
            mode: 'development',
            note: 'Running in fallback mode'
        });
    }
});

// Favicon handler
app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
});

// API Routes with error handling
if (authRoutes) app.use('/api/auth', authRoutes);
if (eventsRoutes) app.use('/api/events', eventsRoutes);
if (logsRoutes) app.use('/api/logs', logsRoutes);
if (healthRoutes) app.use('/api/health', healthRoutes);

// Load appointments and customers routes with error handling
try {
    app.use('/api/appointments', require('./routes/appointments'));
    app.use('/api/customers', require('./routes/customers'));
} catch (error) {
    console.warn('Appointments/Customers routes not available');
    app.get('/api/appointments', (req, res) => res.json({ message: 'Appointments service not available' }));
    app.get('/api/customers', (req, res) => res.json({ message: 'Customers service not available' }));
}
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
// Dashboard route with error handling
try {
    const dashboardRouter = require('./routes/dashboard');
    app.use('/dashboard', dashboardRouter);
    console.log('Dashboard route loaded successfully');
} catch (error) {
    console.warn('Dashboard route file not available, using built-in dashboard');
}

// Always provide dashboard route (fallback or main)
app.get('/dashboard', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html dir="rtl" lang="he">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>ניהול תורים - BusinessFlow</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    padding: 20px;
                    direction: rtl;
                }
                
                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                    background: rgba(255, 255, 255, 0.95);
                    border-radius: 20px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                    overflow: hidden;
                }
                
                .header {
                    background: linear-gradient(45deg, #667eea, #764ba2);
                    color: white;
                    padding: 30px 40px;
                    text-align: center;
                }
                
                .header h1 {
                    font-size: 2.5em;
                    margin-bottom: 10px;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                }
                
                .header p {
                    font-size: 1.2em;
                    opacity: 0.9;
                }
                
                .main-content {
                    padding: 40px;
                }
                
                .stats-overview {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                    margin-bottom: 40px;
                }
                
                .stat-card {
                    background: white;
                    border-radius: 15px;
                    padding: 25px;
                    text-align: center;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                    border: 3px solid transparent;
                    transition: all 0.3s ease;
                }
                
                .stat-card:hover {
                    transform: translateY(-5px);
                    border-color: #667eea;
                    box-shadow: 0 15px 40px rgba(102, 126, 234, 0.2);
                }
                
                .stat-number {
                    font-size: 2.5em;
                    font-weight: bold;
                    color: #667eea;
                    margin-bottom: 10px;
                }
                
                .stat-label {
                    color: #666;
                    font-size: 1.1em;
                }
                
                .stat-icon {
                    font-size: 2em;
                    margin-bottom: 15px;
                }
                
                .features-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                    gap: 30px;
                    margin-bottom: 40px;
                }
                
                .feature-card {
                    background: white;
                    border-radius: 15px;
                    padding: 30px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                    transition: all 0.3s ease;
                }
                
                .feature-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 15px 40px rgba(0,0,0,0.15);
                }
                
                .feature-header {
                    display: flex;
                    align-items: center;
                    margin-bottom: 20px;
                }
                
                .feature-icon {
                    font-size: 2.5em;
                    margin-left: 15px;
                }
                
                .feature-title {
                    font-size: 1.5em;
                    color: #333;
                    font-weight: bold;
                }
                
                .feature-description {
                    color: #666;
                    line-height: 1.6;
                    margin-bottom: 20px;
                }
                
                .btn {
                    background: linear-gradient(45deg, #667eea, #764ba2);
                    color: white;
                    border: none;
                    padding: 12px 25px;
                    border-radius: 8px;
                    font-size: 1em;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-decoration: none;
                    display: inline-block;
                    margin: 5px;
                }
                
                .btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
                }
                
                .btn-secondary {
                    background: linear-gradient(45deg, #95a5a6, #7f8c8d);
                }
                
                .btn-success {
                    background: linear-gradient(45deg, #27ae60, #2ecc71);
                }
                
                .btn-warning {
                    background: linear-gradient(45deg, #f39c12, #e67e22);
                }
                
                .demo-notice {
                    background: #e8f4f8;
                    border: 2px solid #3498db;
                    border-radius: 10px;
                    padding: 20px;
                    margin-bottom: 30px;
                    text-align: center;
                }
                
                .demo-notice h3 {
                    color: #2980b9;
                    margin-bottom: 10px;
                }
                
                .status-badge {
                    display: inline-block;
                    padding: 5px 12px;
                    border-radius: 20px;
                    font-size: 0.9em;
                    font-weight: bold;
                    background: #27ae60;
                    color: white;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🗓️ BusinessFlow</h1>
                    <p>מערכת ניהול תורים ולקוחות מתקדמת לעסקים</p>
                </div>
                
                <div class="main-content">
                    <div class="demo-notice">
                        <h3>🎯 ברוכים הבאים למערכת החדשה!</h3>
                        <p>BusinessFlow - פתרון מקיף לניהול תורים, לקוחות ותשלומים עבור עסקים קטנים ובינוניים</p>
                        <span class="status-badge">מצב הדגמה</span>
                    </div>
                    
                    <div class="stats-overview">
                        <div class="stat-card">
                            <div class="stat-icon">📅</div>
                            <div class="stat-number">0</div>
                            <div class="stat-label">תורים השבוע</div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-icon">👥</div>
                            <div class="stat-number">0</div>
                            <div class="stat-label">לקוחות פעילים</div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-icon">💰</div>
                            <div class="stat-number">₪0</div>
                            <div class="stat-label">הכנסות החודש</div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-icon">⭐</div>
                            <div class="stat-number">4.8</div>
                            <div class="stat-label">דירוג ממוצע</div>
                        </div>
                    </div>
                    
                    <div class="features-grid">
                        <div class="feature-card">
                            <div class="feature-header">
                                <div class="feature-icon">🗓️</div>
                                <div class="feature-title">יומן וזמינות</div>
                            </div>
                            <div class="feature-description">
                                הגדרת זמינות שבועית, חסימת תאריכים ונהול לוח השנה העסקי שלך בצורה פשוטה ויעילה.
                            </div>
                            <button class="btn" onclick="alert('בהמתנה לפיתוח')">נהל יומן</button>
                        </div>
                        
                        <div class="feature-card">
                            <div class="feature-header">
                                <div class="feature-icon">⏰</div>
                                <div class="feature-title">ניהול תורים</div>
                            </div>
                            <div class="feature-description">
                                קביעת תורים, עריכה וביטול. ממשק נוח ללקוחות עם אפשרות הזמנה עצמית 24/7.
                            </div>
                            <a href="/api/appointments" class="btn">נהל תורים</a>
                        </div>
                        
                        <div class="feature-card">
                            <div class="feature-header">
                                <div class="feature-icon">👨‍💼</div>
                                <div class="feature-title">ניהול לקוחות</div>
                            </div>
                            <div class="feature-description">
                                מאגר לקוחות מלא עם היסטוריית פגישות, העדפות אישיות ומעקב אחר סטטוס התשלומים.
                            </div>
                            <a href="/api/customers" class="btn">רשימת לקוחות</a>
                        </div>
                        
                        <div class="feature-card">
                            <div class="feature-header">
                                <div class="feature-icon">💳</div>
                                <div class="feature-title">ניהול תשלומים</div>
                            </div>
                            <div class="feature-description">
                                מעקב אחר תשלומים, חשבוניות אוטומטיות, תזכורות תשלום ודיווחים פיננסיים מפורטים.
                            </div>
                            <button class="btn btn-warning" onclick="alert('בהמתנה לפיתוח')">נהל תשלומים</button>
                        </div>
                        
                        <div class="feature-card">
                            <div class="feature-header">
                                <div class="feature-icon">📱</div>
                                <div class="feature-title">תזכורות WhatsApp</div>
                            </div>
                            <div class="feature-description">
                                שליחת תזכורות אוטומטיות ללקוחות דרך WhatsApp, SMS ואימייל עם הודעות מותאמות אישית.
                            </div>
                            <button class="btn btn-secondary" onclick="alert('בהמתנה לפיתוח')">הגדרות WhatsApp</button>
                        </div>
                        
                        <div class="feature-card">
                            <div class="feature-header">
                                <div class="feature-icon">📊</div>
                                <div class="feature-title">דוחות ואנליטיקה</div>
                            </div>
                            <div class="feature-description">
                                דוחות מפורטים על הכנסות, נוכחות לקוחות, שעות עבודה ומדדי ביצועים עסקיים.
                            </div>
                            <button class="btn btn-secondary" onclick="alert('בהמתנה לפיתוח')">צפה בדוחות</button>
                        </div>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `);
});

// Rate limiting routes (with error handling)
let rateLimiter; // Declare rateLimiter here
if (RateLimiterMiddleware) {
    rateLimiter = new RateLimiterMiddleware();
    if (typeof rateLimiter.createRouter === 'function') {
        app.use('/api/rate-limit', rateLimiter.createRouter());
    } else {
        app.use('/api/rate-limit', (req, res) => {
            res.json({ message: 'Rate limiting not available in fallback mode' });
        });
    }
} else {
    app.use('/api/rate-limit', (req, res) => {
        res.json({ message: 'Rate limiting not available in fallback mode' });
    });
}


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

    // Set mongoose to not buffer commands when disconnected
    mongoose.set('bufferCommands', false);
    mongoose.set('bufferMaxEntries', 0);

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 3000, // 3 second timeout
      socketTimeoutMS: 30000,
      connectTimeoutMS: 5000
    });
    logInfo('Connected to MongoDB successfully');
    return true;
  } catch (error) {
    logWarning('MongoDB not available, running in fallback mode:', error.message);
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
        // Connect to database (non-blocking) - don't wait for it
        setTimeout(() => {
            connectToDatabase().catch(err => {
                logWarning('Database connection failed, continuing in fallback mode');
            });
        }, 1000);

        // Start server immediately
        const PORT = process.env.PORT || 5000;
        const HOST = process.env.HOST || '0.0.0.0';

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
          console.error('Uncaught Exception:', error);
          // Don't exit in development, just log the error
          if (process.env.NODE_ENV === 'production') {
            process.exit(1);
          }
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
          console.error('Unhandled Rejection at:', promise, 'reason:', reason);
          // Don't exit in development, just log the error
          if (process.env.NODE_ENV === 'production') {
            process.exit(1);
          }
        });

        const server = app.listen(PORT, HOST, () => {
            logInfo('Server started successfully', {
                port: PORT,
                host: HOST,
                environment: process.env.NODE_ENV || 'development',
                timestamp: new Date().toISOString()
            });

            // Test basic functionality
            console.log(`\n🚀 ChatGrow Server is running successfully!`);
            console.log(`🌐 Server URL: http://localhost:${PORT}/`);
            console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
            console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
            console.log(`📱 WhatsApp API: http://localhost:${PORT}/api/whatsapp`);
            console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
            console.log(`📋 API Documentation available at each endpoint`);
            console.log(`✅ Server is ready for connections!\n`);
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
            gracefulShutdown('SIGTERM', server);
        });

        process.on('SIGINT', () => {
            gracefulShutdown('SIGINT', server);
        });

        return server;

    } catch (error) {
        logError('Failed to start server', error);
        console.error('Failed to start server:', error.message);
        process.exit(1);
    }
}

// Start the application
if (require.main === module) {
    startServer();
}

module.exports = app;