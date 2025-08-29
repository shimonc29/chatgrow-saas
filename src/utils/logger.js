
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for JSON logging
const jsonFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Custom format for console logging (more readable)
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let log = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
            log += ` ${JSON.stringify(meta)}`;
        }
        return log;
    })
);

// Create daily rotate file transport for different log levels
const createDailyRotateTransport = (level, filename) => {
    return new DailyRotateFile({
        filename: path.join(logsDir, `${filename}-%DATE%.log`),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d', // Keep logs for 14 days
        level: level,
        format: jsonFormat
    });
};

// Create the logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    defaultMeta: { 
        service: 'chatgrow',
        version: process.env.npm_package_version || '1.0.0'
    },
    transports: [
        // Error logs
        createDailyRotateTransport('error', 'error'),
        
        // Warning logs
        createDailyRotateTransport('warn', 'warn'),
        
        // Info logs
        createDailyRotateTransport('info', 'info'),
        
        // Debug logs (only in development)
        ...(process.env.NODE_ENV === 'development' ? [
            createDailyRotateTransport('debug', 'debug')
        ] : [])
    ],
    exceptionHandlers: [
        createDailyRotateTransport('error', 'exceptions')
    ],
    rejectionHandlers: [
        createDailyRotateTransport('error', 'rejections')
    ]
});

// Add console transport for development
if (process.env.NODE_ENV === 'development') {
    logger.add(new winston.transports.Console({
        format: consoleFormat,
        level: 'debug'
    }));
}

// Add console transport for production (only errors and warnings)
if (process.env.NODE_ENV === 'production') {
    logger.add(new winston.transports.Console({
        format: consoleFormat,
        level: 'warn'
    }));
}

// Helper functions for structured logging
const logMessage = (level, message, meta = {}) => {
    logger.log(level, message, meta);
};

const logError = (message, error = null, meta = {}) => {
    const logData = {
        ...meta,
        error: error ? {
            message: error.message,
            stack: error.stack,
            name: error.name
        } : null
    };
    logger.error(message, logData);
};

const logWarning = (message, meta = {}) => {
    logger.warn(message, meta);
};

const logInfo = (message, meta = {}) => {
    logger.info(message, meta);
};

const logDebug = (message, meta = {}) => {
    logger.debug(message, meta);
};

// WhatsApp specific logging
const logWhatsAppMessage = (connectionId, messageId, recipient, status, meta = {}) => {
    logger.info('WhatsApp Message', {
        connectionId,
        messageId,
        recipient,
        status,
        ...meta
    });
};

const logWhatsAppError = (connectionId, messageId, recipient, error, meta = {}) => {
    logger.error('WhatsApp Error', {
        connectionId,
        messageId,
        recipient,
        error: error.message,
        stack: error.stack,
        ...meta
    });
};

// Queue specific logging
const logQueueJob = (jobId, queueName, status, meta = {}) => {
    logger.info('Queue Job', {
        jobId,
        queueName,
        status,
        ...meta
    });
};

const logQueueError = (jobId, queueName, error, meta = {}) => {
    logger.error('Queue Error', {
        jobId,
        queueName,
        error: error.message,
        stack: error.stack,
        ...meta
    });
};

// Rate limiting logging
const logRateLimit = (connectionId, action, meta = {}) => {
    logger.warn('Rate Limit', {
        connectionId,
        action,
        ...meta
    });
};

// API request logging
const logApiRequest = (method, url, statusCode, responseTime, meta = {}) => {
    const level = statusCode >= 400 ? 'warn' : 'info';
    logger.log(level, 'API Request', {
        method,
        url,
        statusCode,
        responseTime: `${responseTime}ms`,
        ...meta
    });
};

// Database logging
const logDatabaseOperation = (operation, collection, duration, meta = {}) => {
    logger.debug('Database Operation', {
        operation,
        collection,
        duration: `${duration}ms`,
        ...meta
    });
};

// Export the logger and helper functions
module.exports = {
    logger,
    logMessage,
    logError,
    logWarning,
    logInfo,
    logDebug,
    logWhatsAppMessage,
    logWhatsAppError,
    logQueueJob,
    logQueueError,
    logRateLimit,
    logApiRequest,
    logDatabaseOperation
};
