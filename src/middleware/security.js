const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { logWarning, logError, logInfo, logApiRequest } = require('../utils/logger');

class SecurityMiddleware {
    constructor() {
        this.ipWhitelist = process.env.IP_WHITELIST ? process.env.IP_WHITELIST.split(',') : [];
        this.ipBlacklist = process.env.IP_BLACKLIST ? process.env.IP_BLACKLIST.split(',') : [];
        this.requestLogs = new Map();
        this.suspiciousIPs = new Map();
    }

    /**
     * Configure Helmet security headers
     * @returns {Function} - Helmet middleware
     */
    configureHelmet() {
        return helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'"],
                    fontSrc: ["'self'"],
                    objectSrc: ["'none'"],
                    mediaSrc: ["'self'"],
                    frameSrc: ["'none'"]
                }
            },
            crossOriginEmbedderPolicy: false,
            crossOriginResourcePolicy: { policy: "cross-origin" }
        });
    }

    /**
     * IP filtering middleware
     * @returns {Function} - Express middleware function
     */
    ipFilter() {
        return (req, res, next) => {
            const clientIP = this.getClientIP(req);
            
            // Check blacklist first
            if (this.ipBlacklist.includes(clientIP)) {
                logWarning('Blocked request from blacklisted IP', {
                    ip: clientIP,
                    path: req.path,
                    userAgent: req.get('User-Agent')
                });
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            // Check whitelist if configured
            if (this.ipWhitelist.length > 0 && !this.ipWhitelist.includes(clientIP)) {
                logWarning('Blocked request from non-whitelisted IP', {
                    ip: clientIP,
                    path: req.path,
                    userAgent: req.get('User-Agent')
                });
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            // Log IP for monitoring
            this.logIPRequest(clientIP, req);
            
            next();
        };
    }

    /**
     * Get client IP address
     * @param {Object} req - Express request object
     * @returns {string} - Client IP address
     */
    getClientIP(req) {
        return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
               req.headers['x-real-ip'] ||
               req.connection.remoteAddress ||
               req.socket.remoteAddress ||
               req.ip ||
               'unknown';
    }

    /**
     * Log IP request for monitoring
     * @param {string} ip - IP address
     * @param {Object} req - Express request object
     */
    logIPRequest(ip, req) {
        const now = Date.now();
        const windowMs = 5 * 60 * 1000; // 5 minutes
        const maxRequests = 100;

        if (!this.requestLogs.has(ip)) {
            this.requestLogs.set(ip, []);
        }

        const requests = this.requestLogs.get(ip);
        const windowStart = now - windowMs;

        // Remove old requests
        const recentRequests = requests.filter(timestamp => timestamp > windowStart);
        recentRequests.push(now);
        this.requestLogs.set(ip, recentRequests);

        // Check for suspicious activity
        if (recentRequests.length > maxRequests) {
            this.flagSuspiciousIP(ip, req);
        }
    }

    /**
     * Flag suspicious IP address
     * @param {string} ip - IP address
     * @param {Object} req - Express request object
     */
    flagSuspiciousIP(ip, req) {
        if (!this.suspiciousIPs.has(ip)) {
            this.suspiciousIPs.set(ip, {
                firstSeen: Date.now(),
                requestCount: 0,
                lastRequest: Date.now()
            });
        }

        const suspicious = this.suspiciousIPs.get(ip);
        suspicious.requestCount++;
        suspicious.lastRequest = Date.now();

        logWarning('Suspicious IP activity detected', {
            ip,
            requestCount: suspicious.requestCount,
            path: req.path,
            userAgent: req.get('User-Agent')
        });
    }

    /**
     * API rate limiting middleware
     * @param {Object} options - Rate limiting options
     * @returns {Function} - Express middleware function
     */
    apiRateLimit(options = {}) {
        const {
            windowMs = 15 * 60 * 1000, // 15 minutes
            max = 100, // limit each IP to 100 requests per windowMs
            message = 'Too many requests from this IP, please try again later.',
            standardHeaders = true,
            legacyHeaders = false,
            skipSuccessfulRequests = false,
            skipFailedRequests = false
        } = options;

        return rateLimit({
            windowMs,
            max,
            message: {
                success: false,
                message,
                retryAfter: Math.ceil(windowMs / 1000)
            },
            standardHeaders,
            legacyHeaders,
            skipSuccessfulRequests,
            skipFailedRequests,
            keyGenerator: (req) => {
                // Use API key if available, otherwise use IP
                return req.headers['x-api-key'] || this.getClientIP(req);
            },
            handler: (req, res) => {
                logWarning('API rate limit exceeded', {
                    key: req.headers['x-api-key'] || this.getClientIP(req),
                    path: req.path,
                    userAgent: req.get('User-Agent')
                });
                res.status(429).json({
                    success: false,
                    message,
                    retryAfter: Math.ceil(windowMs / 1000)
                });
            }
        });
    }

    /**
     * Authentication rate limiting middleware
     * @param {Object} options - Rate limiting options
     * @returns {Function} - Express middleware function
     */
    authRateLimit(options = {}) {
        const {
            windowMs = 15 * 60 * 1000, // 15 minutes
            max = 5, // limit each IP to 5 auth attempts per windowMs
            message = 'Too many authentication attempts, please try again later.',
            skipSuccessfulRequests = true,
            skipFailedRequests = false
        } = options;

        return rateLimit({
            windowMs,
            max,
            message: {
                success: false,
                message,
                retryAfter: Math.ceil(windowMs / 1000)
            },
            skipSuccessfulRequests,
            skipFailedRequests,
            keyGenerator: (req) => this.getClientIP(req),
            handler: (req, res) => {
                logWarning('Authentication rate limit exceeded', {
                    ip: this.getClientIP(req),
                    path: req.path,
                    userAgent: req.get('User-Agent')
                });
                res.status(429).json({
                    success: false,
                    message,
                    retryAfter: Math.ceil(windowMs / 1000)
                });
            }
        });
    }

    /**
     * Request logging middleware
     * @returns {Function} - Express middleware function
     */
    requestLogger() {
        return (req, res, next) => {
            const startTime = Date.now();
            const clientIP = this.getClientIP(req);
            const userAgent = req.get('User-Agent') || 'Unknown';

            // Log request start
            logInfo('Incoming request', {
                method: req.method,
                path: req.path,
                ip: clientIP,
                userAgent: userAgent.substring(0, 100), // Truncate long user agents
                query: Object.keys(req.query).length > 0 ? req.query : undefined,
                bodySize: req.headers['content-length'] ? parseInt(req.headers['content-length']) : 0
            });

            // Override res.end to log response
            const originalEnd = res.end;
            res.end = function(chunk, encoding) {
                const responseTime = Date.now() - startTime;
                const statusCode = res.statusCode;

                // Log response
                logApiRequest(req.method, req.path, statusCode, responseTime, {
                    ip: clientIP,
                    userAgent: userAgent.substring(0, 100),
                    responseSize: chunk ? chunk.length : 0
                });

                // Call original end
                originalEnd.call(this, chunk, encoding);
            };

            next();
        };
    }

    /**
     * Input validation middleware
     * @returns {Function} - Express middleware function
     */
    inputValidation() {
        return (req, res, next) => {
            // Check for suspicious patterns in request
            const suspiciousPatterns = [
                /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
                /javascript:/gi,
                /vbscript:/gi,
                /onload\s*=/gi,
                /onerror\s*=/gi,
                /onclick\s*=/gi
            ];

            const checkForSuspiciousContent = (obj) => {
                for (const key in obj) {
                    if (typeof obj[key] === 'string') {
                        for (const pattern of suspiciousPatterns) {
                            if (pattern.test(obj[key])) {
                                return true;
                            }
                        }
                    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                        if (checkForSuspiciousContent(obj[key])) {
                            return true;
                        }
                    }
                }
                return false;
            };

            if (checkForSuspiciousContent(req.body) || checkForSuspiciousContent(req.query)) {
                logWarning('Suspicious input detected', {
                    ip: this.getClientIP(req),
                    path: req.path,
                    userAgent: req.get('User-Agent')
                });
                return res.status(400).json({
                    success: false,
                    message: 'Invalid input detected'
                });
            }

            next();
        };
    }

    /**
     * CORS configuration middleware
     * @param {Object} options - CORS options
     * @returns {Function} - Express middleware function
     */
    configureCORS(options = {}) {
        const {
            origin = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'],
            credentials = true,
            methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders = ['Content-Type', 'Authorization', 'X-API-Key']
        } = options;

        return (req, res, next) => {
            const requestOrigin = req.headers.origin;

            // Check if origin is allowed
            if (origin === '*' || origin.includes(requestOrigin)) {
                res.header('Access-Control-Allow-Origin', requestOrigin);
            }

            res.header('Access-Control-Allow-Credentials', credentials);
            res.header('Access-Control-Allow-Methods', methods.join(', '));
            res.header('Access-Control-Allow-Headers', allowedHeaders.join(', '));

            // Handle preflight requests
            if (req.method === 'OPTIONS') {
                res.status(200).end();
                return;
            }

            next();
        };
    }

    /**
     * Request size limiting middleware
     * @param {Object} options - Size limit options
     * @returns {Function} - Express middleware function
     */
    requestSizeLimit(options = {}) {
        const {
            maxBodySize = '10mb',
            maxUrlLength = 2048,
            maxHeaderSize = 8192
        } = options;

        return (req, res, next) => {
            // Check URL length
            if (req.url.length > maxUrlLength) {
                logWarning('Request URL too long', {
                    ip: this.getClientIP(req),
                    urlLength: req.url.length,
                    maxLength: maxUrlLength
                });
                return res.status(414).json({
                    success: false,
                    message: 'Request URL too long'
                });
            }

            // Check header size
            const headerSize = JSON.stringify(req.headers).length;
            if (headerSize > maxHeaderSize) {
                logWarning('Request headers too large', {
                    ip: this.getClientIP(req),
                    headerSize,
                    maxSize: maxHeaderSize
                });
                return res.status(431).json({
                    success: false,
                    message: 'Request headers too large'
                });
            }

            next();
        };
    }

    /**
     * Security headers middleware
     * @returns {Function} - Express middleware function
     */
    securityHeaders() {
        return (req, res, next) => {
            // Additional security headers
            res.header('X-Content-Type-Options', 'nosniff');
            res.header('X-Frame-Options', 'DENY');
            res.header('X-XSS-Protection', '1; mode=block');
            res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
            res.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
            
            // Remove server information
            res.removeHeader('X-Powered-By');
            
            next();
        };
    }

    /**
     * Error handling middleware
     * @returns {Function} - Express middleware function
     */
    errorHandler() {
        return (error, req, res, next) => {
            const clientIP = this.getClientIP(req);

            logError('Unhandled error in security middleware', error, {
                ip: clientIP,
                path: req.path,
                method: req.method,
                userAgent: req.get('User-Agent')
            });

            // Don't expose internal errors to client
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        };
    }

    /**
     * Clean up old logs periodically
     */
    cleanup() {
        setInterval(() => {
            const now = Date.now();
            const maxAge = 60 * 60 * 1000; // 1 hour

            // Clean request logs
            for (const [ip, requests] of this.requestLogs.entries()) {
                const recentRequests = requests.filter(timestamp => now - timestamp < maxAge);
                if (recentRequests.length === 0) {
                    this.requestLogs.delete(ip);
                } else {
                    this.requestLogs.set(ip, recentRequests);
                }
            }

            // Clean suspicious IPs
            for (const [ip, data] of this.suspiciousIPs.entries()) {
                if (now - data.lastRequest > maxAge) {
                    this.suspiciousIPs.delete(ip);
                }
            }
        }, 30 * 60 * 1000); // Run every 30 minutes
    }

    /**
     * Get security statistics
     * @returns {Object} - Security statistics
     */
    getStats() {
        return {
            totalIPs: this.requestLogs.size,
            suspiciousIPs: this.suspiciousIPs.size,
            whitelistedIPs: this.ipWhitelist.length,
            blacklistedIPs: this.ipBlacklist.length,
            suspiciousIPDetails: Array.from(this.suspiciousIPs.entries()).map(([ip, data]) => ({
                ip,
                requestCount: data.requestCount,
                firstSeen: data.firstSeen,
                lastRequest: data.lastRequest
            }))
        };
    }

    /**
     * Add IP to blacklist
     * @param {string} ip - IP address to blacklist
     */
    addToBlacklist(ip) {
        if (!this.ipBlacklist.includes(ip)) {
            this.ipBlacklist.push(ip);
            logInfo('IP added to blacklist', { ip });
        }
    }

    /**
     * Remove IP from blacklist
     * @param {string} ip - IP address to remove from blacklist
     */
    removeFromBlacklist(ip) {
        const index = this.ipBlacklist.indexOf(ip);
        if (index > -1) {
            this.ipBlacklist.splice(index, 1);
            logInfo('IP removed from blacklist', { ip });
        }
    }

    /**
     * Add IP to whitelist
     * @param {string} ip - IP address to whitelist
     */
    addToWhitelist(ip) {
        if (!this.ipWhitelist.includes(ip)) {
            this.ipWhitelist.push(ip);
            logInfo('IP added to whitelist', { ip });
        }
    }

    /**
     * Remove IP from whitelist
     * @param {string} ip - IP address to remove from whitelist
     */
    removeFromWhitelist(ip) {
        const index = this.ipWhitelist.indexOf(ip);
        if (index > -1) {
            this.ipWhitelist.splice(index, 1);
            logInfo('IP removed from whitelist', { ip });
        }
    }
}

// Create singleton instance
const securityMiddleware = new SecurityMiddleware();

// Start cleanup process
securityMiddleware.cleanup();

module.exports = securityMiddleware; 