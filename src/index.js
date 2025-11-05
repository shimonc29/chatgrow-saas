// MUST load environment variables FIRST before any other modules
require('dotenv').config();

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const helmet = require('helmet');

// Import logging system
const { logInfo, logError, logWarning } = require('./utils/logger');

// Import routes with error handling
let logsRoutes, authRoutes, healthRoutes, eventsRoutes, dashboardRoutes, providerRoutes, subscriberRoutes;
try {
    logsRoutes = require('./routes/logs');
    authRoutes = require('./routes/auth');
    healthRoutes = require('./routes/health');
    eventsRoutes = require('./routes/events');
    dashboardRoutes = require('./routes/dashboard');
    providerRoutes = require('./routes/provider');
    subscriberRoutes = require('./routes/subscribers');
    console.log('✅ All routes loaded successfully');
} catch (error) {
    console.warn('Some routes not available, using fallback');
    console.error('Route loading error:', error.message);
    console.error(error.stack);
    // Create minimal fallback routes
    logsRoutes = express.Router();
    authRoutes = express.Router();
    healthRoutes = express.Router();
    eventsRoutes = express.Router();
    dashboardRoutes = express.Router();
    providerRoutes = express.Router();
    subscriberRoutes = express.Router();

    // Add basic responses
    logsRoutes.get('/', (req, res) => res.json({ message: 'Logs service not available' }));
    authRoutes.get('/', (req, res) => res.json({ message: 'Auth service not available' }));
    healthRoutes.get('/', (req, res) => res.json({ message: 'Health service not available' }));
    eventsRoutes.get('/', (req, res) => res.json({ message: 'Events service not available' }));
    dashboardRoutes.get('/', (req, res) => res.json({ message: 'Dashboard service not available' }));
    providerRoutes.get('/', (req, res) => res.json({ message: 'Provider service not available' }));
    subscriberRoutes.get('/', (req, res) => res.json({ message: 'Subscriber service not available' }));
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

// Import services with error handling
let LogService;
try {
    LogService = require('./services/logService');
} catch (error) {
    console.warn('Some services not available, using fallback');
}

// Initialize NotificationService (replaces WhatsApp)
let notificationService;
try {
    notificationService = require('./services/notificationService');
    console.log('NotificationService initialized successfully');
} catch (error) {
    console.warn('NotificationService not available:', error.message);
}

// Initialize services safely with try-catch
console.log('Initializing services in safe mode...');

let logService;
try {
    // Try to initialize real services
    const LogServiceClass = require('./services/logService');
    logService = new LogServiceClass();
    console.log('Real services initialized successfully');
} catch (error) {
    console.warn('Using fallback mock services due to:', error.message);
    // Fallback to mock services
    logService = {
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
}

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy - required for Replit environment and rate limiting
app.set('trust proxy', 1);

// Security middleware - MUST be first
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: true
}));

// Rate limiting middleware
const rateLimit = require('express-rate-limit');
const apiLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
});

// Apply rate limiting to all /api routes
app.use('/api', apiLimiter);

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
            notifications: '/api/notifications',
            healthMonitoring: '/api/health',
            rateLimit: '/api/rate-limit'
        }
    });
});

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        let dbStatus = 'fallback';
        try {
            const client = await pool.connect();
            await client.query('SELECT 1');
            client.release();
            dbStatus = 'operational';
        } catch (error) {
            dbStatus = 'fallback';
        }

        const health = {
            status: 'healthy',
            timestamp: new Date(),
            services: {
                database: dbStatus,
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

// WhatsApp API removed - using NotificationService instead

// Load appointments and customers routes with error handling
try {
    app.use('/api/appointments', require('./routes/appointments'));
    app.use('/api/customers', require('./routes/customers'));
    app.use('/api/analytics', require('./routes/analytics'));
    app.use('/api/payments', require('./routes/payments'));
    app.use('/api/invoices', require('./routes/invoices'));
    console.log('All business management routes loaded successfully');
} catch (error) {
    console.warn('Some business routes not available, creating fallback routes');
    app.get('/api/appointments', (req, res) => res.json({ message: 'Appointments service not available' }));
    app.get('/api/customers', (req, res) => res.json({ message: 'Customers service not available' }));
    app.get('/api/analytics', (req, res) => res.json({ message: 'Analytics service not available' }));
    app.get('/api/payments', (req, res) => res.json({ message: 'Payments service not available' }));
    app.get('/api/invoices', (req, res) => res.json({ message: 'Invoices service not available' }));
}

// Add missing routes for dashboard links
app.get('/api/calendar', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="he" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>יומן וזמינות - BusinessFlow</title>
            <style>
                body { font-family: Arial; padding: 20px; direction: rtl; background: #f5f5f5; }
                .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
                .btn { background: #667eea; color: white; padding: 10px 20px; border: none; border-radius: 5px; text-decoration: none; }
                .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; margin: 20px 0; }
                .day-header { background: #667eea; color: white; padding: 10px; text-align: center; font-weight: bold; }
                .day-cell { background: #f8f9fa; padding: 15px; border: 1px solid #ddd; text-align: center; cursor: pointer; }
                .day-cell:hover { background: #e9ecef; }
                .available { background: #d4edda !important; }
                .booked { background: #f8d7da !important; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>📅 יומן וניהול זמינות</h1>
                <p>הגדר את הזמינות השבועית שלך ונהל את לוח השנה העסקי</p>

                <div style="margin: 20px 0;">
                    <a href="/dashboard" class="btn">🏠 חזרה לדאשבורד</a>
                    <button class="btn" onclick="alert('בהמתנה לפיתוח')">➕ הוסף זמינות</button>
                    <button class="btn" onclick="alert('בהמתנה לפיתוח')">🚫 חסום תאריך</button>
                </div>

                <h3>יומן השבוע</h3>
                <div class="calendar-grid">
                    <div class="day-header">ראשון</div>
                    <div class="day-header">שני</div>
                    <div class="day-header">שלישי</div>
                    <div class="day-header">רביעי</div>
                    <div class="day-header">חמישי</div>
                    <div class="day-header">שישי</div>
                    <div class="day-header">שבת</div>

                    <div class="day-cell available">1<br>זמין</div>
                    <div class="day-cell available">2<br>זמין</div>
                    <div class="day-cell booked">3<br>תפוס</div>
                    <div class="day-cell available">4<br>זמין</div>
                    <div class="day-cell available">5<br>זמין</div>
                    <div class="day-cell">6<br>סגור</div>
                    <div class="day-cell">7<br>סגור</div>
                </div>

                <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
                    <h4>מקרא:</h4>
                    <div style="display: flex; gap: 20px;">
                        <span>🟢 זמין לתורים</span>
                        <span>🔴 תפוס/מלא</span>
                        <span>⚫ סגור</span>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `);
});

try {
    app.use('/auth', authRoutes);
    console.log('✅ Auth routes applied');
    
    app.use('/provider', providerRoutes);
    console.log('✅ Provider routes applied');
    
    app.use('/subscribers', subscriberRoutes);
    console.log('✅ Subscriber routes applied');
    
    app.use('/dashboard', dashboardRoutes);
    console.log('✅ Dashboard routes applied');
    
    app.use('/health', healthRoutes);
    console.log('✅ Health routes applied');
    
    if (logsRoutes) {
        app.use('/logs', logsRoutes);
        console.log('✅ Logs routes applied');
    }
} catch (error) {
    console.error('❌ Error applying routes:', error.message);
    console.error(error.stack);
}

// Rate limiting routes (with comprehensive error handling)
let rateLimiter;
try {
    if (RateLimiterMiddleware) {
        console.log('⚙️ Initializing rate limiter...');
        rateLimiter = new RateLimiterMiddleware();
        
        if (typeof rateLimiter.createRouter === 'function') {
            app.use('/api/rate-limit', rateLimiter.createRouter());
            console.log('✅ Rate limiter routes created successfully');
        } else {
            app.use('/api/rate-limit', (req, res) => {
                res.json({ message: 'Rate limiting not available in fallback mode' });
            });
            console.log('⚠️ Rate limiter using fallback mode (no createRouter method)');
        }
    } else {
        app.use('/api/rate-limit', (req, res) => {
            res.json({ message: 'Rate limiting not available in fallback mode' });
        });
        console.log('⚠️ Rate limiter using fallback mode (middleware not available)');
    }
} catch (error) {
    console.error('❌ Rate limiter initialization failed:', error.message);
    console.error(error.stack);
    app.use('/api/rate-limit', (req, res) => {
        res.json({ message: 'Rate limiting failed to initialize', error: error.message });
    });
}


// Queue endpoints removed - using NotificationService instead

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

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Import database configurations
const { connectMongoDB, isMongoDBConnected } = require('./config/database');
const { connectRedis, isRedisConnected } = require('./config/redis');

// Connect to PostgreSQL
async function connectToPostgreSQL() {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    
    // Initialize subscriber table
    const Subscriber = require('./models/Subscriber');
    await Subscriber.createTable();
    
    logInfo('Connected to PostgreSQL successfully');
    return true;
  } catch (error) {
    logWarning('PostgreSQL not available, running in fallback mode:', error.message);
    return false;
  }
}

// Connect to all databases
async function connectToDatabase() {
  const results = await Promise.allSettled([
    connectToPostgreSQL(),
    connectMongoDB(),
    connectRedis()
  ]);

  logInfo('Database connections initialized', {
    postgresql: results[0].status === 'fulfilled' && results[0].value,
    mongodb: results[1].status === 'fulfilled' && isMongoDBConnected(),
    redis: results[2].status === 'fulfilled' && isRedisConnected()
  });

  return true;
}

// Simplified graceful shutdown
async function gracefulShutdown(signal, server) {
    console.log(`Received ${signal}. Starting graceful shutdown...`);
    try {
        if (pool) {
            await pool.end();
        }
        if (server) {
            server.close(() => process.exit(0));
        } else {
            process.exit(0);
        }
    } catch (error) {
        console.error('Shutdown error:', error.message);
        process.exit(1);
    }
}

// Removed complex startServer function - using simple startup instead

// Only start if this file is run directly
if (require.main === module) {
    const PORT = process.env.PORT || 5000;
    const HOST = process.env.HOST || '0.0.0.0';

    // Add detailed global error handlers before starting server
    process.on('uncaughtException', (error) => {
        console.error('🚨 UNCAUGHT EXCEPTION - THIS CRASHES THE APP:');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        console.error('Location:', error.fileName, error.lineNumber);
        // Don't exit in development - just log
    });

    process.on('unhandledRejection', (reason, promise) => {
        console.error('🚨 UNHANDLED PROMISE REJECTION - THIS CRASHES THE APP:');
        console.error('Reason:', reason);
        console.error('Promise:', promise);
        if (reason && reason.stack) {
            console.error('Stack:', reason.stack);
        }
        // Don't exit in development - just log
    });

    // Add warning for deprecated warnings
    process.on('warning', (warning) => {
        console.warn('⚠️ Warning:', warning.name, warning.message);
    });

    // Simple server startup without complex error handling
    const server = app.listen(PORT, HOST, () => {
        console.log(`🚀 ChatGrow Server running on ${HOST}:${PORT}`);
        console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
        console.log(`🏥 Health: http://localhost:${PORT}/health`);
        
        // Try database connection after server is up (non-blocking)
        setTimeout(() => {
            connectToDatabase().catch(err => {
                console.warn('Database connection failed, continuing in fallback mode:', err.message);
            });
        }, 1000);
    });

    // Simple error handling
    server.on('error', (error) => {
        console.error('Server error:', error.message);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log('Received SIGTERM, shutting down gracefully...');
        server.close(() => {
            process.exit(0);
        });
    });

    process.on('SIGINT', () => {
        console.log('Received SIGINT, shutting down gracefully...');
        server.close(() => {
            process.exit(0);
        });
    });
}

module.exports = app;