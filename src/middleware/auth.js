const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logError, logWarning, logInfo, logDebug } = require('../utils/logger');

class AuthMiddleware {
    constructor() {
        this.jwtSecret = process.env.JWT_SECRET;
        this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
        this.refreshTokenExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
    }

    /**
     * Generate JWT token for user
     * @param {Object} user - User object
     * @param {string} sessionId - Session ID
     * @returns {Object} - Token object
     */
    generateTokens(user, sessionId) {
        try {
            const payload = {
                userId: user._id,
                email: user.email,
                plan: user.plan,
                sessionId: sessionId,
                permissions: this.getUserPermissions(user)
            };

            const accessToken = jwt.sign(payload, this.jwtSecret, {
                expiresIn: this.jwtExpiresIn
            });

            const refreshToken = jwt.sign({
                userId: user._id,
                sessionId: sessionId,
                type: 'refresh'
            }, this.jwtSecret, {
                expiresIn: this.refreshTokenExpiresIn
            });

            logInfo('Tokens generated successfully', {
                userId: user._id,
                email: user.email,
                sessionId
            });

            return {
                accessToken,
                refreshToken,
                expiresIn: this.jwtExpiresIn,
                refreshExpiresIn: this.refreshTokenExpiresIn
            };
        } catch (error) {
            logError('Error generating tokens', error, {
                userId: user._id,
                email: user.email
            });
            throw error;
        }
    }

    /**
     * Get user permissions based on plan and API keys
     * @param {Object} user - User object
     * @returns {Array} - Array of permissions
     */
    getUserPermissions(user) {
        const permissions = ['basic'];

        // Plan-based permissions
        switch (user.plan) {
            case 'enterprise':
                permissions.push('admin', 'analytics', 'bulk_messaging', 'api_access', 'priority_support');
                break;
            case 'premium':
                permissions.push('analytics', 'bulk_messaging', 'api_access');
                break;
            case 'basic':
                permissions.push('bulk_messaging');
                break;
            case 'free':
            default:
                permissions.push('basic_messaging');
                break;
        }

        return permissions;
    }

    /**
     * Verify JWT token and extract user
     * @param {string} token - JWT token
     * @returns {Object} - Decoded token payload
     */
    verifyToken(token) {
        try {
            const decoded = jwt.verify(token, this.jwtSecret);
            logDebug('Token verified successfully', {
                userId: decoded.userId,
                sessionId: decoded.sessionId
            });
            return decoded;
        } catch (error) {
            logWarning('Token verification failed', {
                error: error.message,
                token: token ? 'present' : 'missing'
            });
            throw error;
        }
    }

    /**
     * Main authentication middleware
     * @param {boolean} requireAuth - Whether authentication is required
     * @returns {Function} - Express middleware function
     */
    authenticate(requireAuth = true) {
        return async (req, res, next) => {
            try {
                const token = this.extractToken(req);
                
                if (!token) {
                    if (requireAuth) {
                        logWarning('Authentication required but no token provided', {
                            ip: req.ip,
                            userAgent: req.get('User-Agent'),
                            path: req.path
                        });
                        return res.status(401).json({
                            success: false,
                            message: 'Authentication token required'
                        });
                    }
                    return next();
                }

                const decoded = this.verifyToken(token);
                const user = await User.findById(decoded.userId);

                if (!user) {
                    logWarning('Token valid but user not found', {
                        userId: decoded.userId,
                        sessionId: decoded.sessionId
                    });
                    return res.status(401).json({
                        success: false,
                        message: 'User not found'
                    });
                }

                if (!user.isActive) {
                    logWarning('Inactive user attempted to access protected route', {
                        userId: user._id,
                        email: user.email
                    });
                    return res.status(403).json({
                        success: false,
                        message: 'Account is deactivated'
                    });
                }

                // Verify session is still active
                const session = user.activeSessions.find(s => s.sessionId === decoded.sessionId);
                if (!session || session.expiresAt < new Date()) {
                    logWarning('Session expired or invalid', {
                        userId: user._id,
                        sessionId: decoded.sessionId
                    });
                    return res.status(401).json({
                        success: false,
                        message: 'Session expired'
                    });
                }

                // Update session last activity
                session.lastActivity = new Date();

                // Attach user and token info to request
                req.user = user;
                req.token = decoded;
                req.permissions = decoded.permissions;

                logDebug('Authentication successful', {
                    userId: user._id,
                    email: user.email,
                    sessionId: decoded.sessionId,
                    path: req.path
                });

                next();
            } catch (error) {
                if (error.name === 'JsonWebTokenError') {
                    logWarning('Invalid JWT token', {
                        error: error.message,
                        ip: req.ip,
                        path: req.path
                    });
                    return res.status(401).json({
                        success: false,
                        message: 'Invalid token'
                    });
                }

                if (error.name === 'TokenExpiredError') {
                    logWarning('Expired JWT token', {
                        error: error.message,
                        ip: req.ip,
                        path: req.path
                    });
                    return res.status(401).json({
                        success: false,
                        message: 'Token expired'
                    });
                }

                logError('Authentication middleware error', error, {
                    ip: req.ip,
                    path: req.path
                });
                return res.status(500).json({
                    success: false,
                    message: 'Authentication error'
                });
            }
        };
    }

    /**
     * Extract token from request headers or cookies
     * @param {Object} req - Express request object
     * @returns {string|null} - Token or null
     */
    extractToken(req) {
        // Check Authorization header
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }

        // Check cookies
        if (req.cookies && req.cookies.accessToken) {
            return req.cookies.accessToken;
        }

        // Check query parameter (for API key access)
        if (req.query.token) {
            return req.query.token;
        }

        return null;
    }

    /**
     * Permission-based authorization middleware
     * @param {string|Array} requiredPermissions - Required permissions
     * @returns {Function} - Express middleware function
     */
    requirePermissions(requiredPermissions) {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const userPermissions = req.permissions || [];
            const required = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];

            const hasPermission = required.some(permission => 
                userPermissions.includes(permission) || userPermissions.includes('admin')
            );

            if (!hasPermission) {
                logWarning('Permission denied', {
                    userId: req.user._id,
                    email: req.user.email,
                    requiredPermissions: required,
                    userPermissions: userPermissions,
                    path: req.path
                });
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions'
                });
            }

            logDebug('Permission check passed', {
                userId: req.user._id,
                requiredPermissions: required,
                path: req.path
            });

            next();
        };
    }

    /**
     * Plan-based authorization middleware
     * @param {string|Array} requiredPlans - Required plans
     * @returns {Function} - Express middleware function
     */
    requirePlan(requiredPlans) {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const userPlan = req.user.plan;
            const required = Array.isArray(requiredPlans) ? requiredPlans : [requiredPlans];

            if (!required.includes(userPlan)) {
                logWarning('Plan requirement not met', {
                    userId: req.user._id,
                    email: req.user.email,
                    userPlan: userPlan,
                    requiredPlans: required,
                    path: req.path
                });
                return res.status(403).json({
                    success: false,
                    message: 'Plan upgrade required'
                });
            }

            // Check if plan is still active
            if (!req.user.isPlanActive) {
                logWarning('Plan expired', {
                    userId: req.user._id,
                    email: req.user.email,
                    plan: userPlan,
                    path: req.path
                });
                return res.status(403).json({
                    success: false,
                    message: 'Plan has expired'
                });
            }

            logDebug('Plan check passed', {
                userId: req.user._id,
                userPlan: userPlan,
                path: req.path
            });

            next();
        };
    }

    /**
     * API key authentication middleware
     * @param {boolean} requireAuth - Whether authentication is required
     * @returns {Function} - Express middleware function
     */
    authenticateApiKey(requireAuth = true) {
        return async (req, res, next) => {
            try {
                const apiKey = this.extractApiKey(req);
                
                if (!apiKey) {
                    if (requireAuth) {
                        logWarning('API key required but not provided', {
                            ip: req.ip,
                            path: req.path
                        });
                        return res.status(401).json({
                            success: false,
                            message: 'API key required'
                        });
                    }
                    return next();
                }

                const user = await User.findByApiKey(apiKey);

                if (!user) {
                    logWarning('Invalid API key provided', {
                        apiKey: apiKey.substring(0, 8) + '...',
                        ip: req.ip,
                        path: req.path
                    });
                    return res.status(401).json({
                        success: false,
                        message: 'Invalid API key'
                    });
                }

                if (!user.isActive) {
                    logWarning('Inactive user attempted API access', {
                        userId: user._id,
                        email: user.email,
                        apiKey: apiKey.substring(0, 8) + '...'
                    });
                    return res.status(403).json({
                        success: false,
                        message: 'Account is deactivated'
                    });
                }

                // Update API key last used
                const apiKeyObj = user.apiKeys.find(key => key.key === apiKey);
                if (apiKeyObj) {
                    apiKeyObj.lastUsed = new Date();
                    await user.save();
                }

                // Attach user and API key info to request
                req.user = user;
                req.apiKey = apiKey;
                req.permissions = this.getApiKeyPermissions(apiKeyObj);

                logDebug('API key authentication successful', {
                    userId: user._id,
                    email: user.email,
                    apiKey: apiKey.substring(0, 8) + '...',
                    path: req.path
                });

                next();
            } catch (error) {
                logError('API key authentication error', error, {
                    ip: req.ip,
                    path: req.path
                });
                return res.status(500).json({
                    success: false,
                    message: 'Authentication error'
                });
            }
        };
    }

    /**
     * Extract API key from request
     * @param {Object} req - Express request object
     * @returns {string|null} - API key or null
     */
    extractApiKey(req) {
        // Check X-API-Key header
        if (req.headers['x-api-key']) {
            return req.headers['x-api-key'];
        }

        // Check Authorization header with Bearer
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }

        // Check query parameter
        if (req.query.apiKey) {
            return req.query.apiKey;
        }

        return null;
    }

    /**
     * Get permissions for API key
     * @param {Object} apiKeyObj - API key object
     * @returns {Array} - Array of permissions
     */
    getApiKeyPermissions(apiKeyObj) {
        if (!apiKeyObj) return ['read'];
        return apiKeyObj.permissions || ['read'];
    }

    /**
     * Rate limiting middleware for authentication attempts
     * @param {number} maxAttempts - Maximum attempts per window
     * @param {number} windowMs - Time window in milliseconds
     * @returns {Function} - Express middleware function
     */
    rateLimitAuth(maxAttempts = 5, windowMs = 15 * 60 * 1000) {
        const attempts = new Map();

        return (req, res, next) => {
            const key = req.ip;
            const now = Date.now();
            const windowStart = now - windowMs;

            // Clean old attempts
            if (attempts.has(key)) {
                attempts.set(key, attempts.get(key).filter(timestamp => timestamp > windowStart));
            }

            const currentAttempts = attempts.get(key) || [];
            
            if (currentAttempts.length >= maxAttempts) {
                logWarning('Authentication rate limit exceeded', {
                    ip: req.ip,
                    attempts: currentAttempts.length,
                    windowMs: windowMs
                });
                return res.status(429).json({
                    success: false,
                    message: 'Too many authentication attempts. Please try again later.',
                    retryAfter: Math.ceil(windowMs / 1000)
                });
            }

            // Add current attempt
            currentAttempts.push(now);
            attempts.set(key, currentAttempts);

            next();
        };
    }

    /**
     * Optional authentication middleware
     * @returns {Function} - Express middleware function
     */
    optionalAuth() {
        return this.authenticate(false);
    }

    /**
     * Admin-only middleware
     * @returns {Function} - Express middleware function
     */
    requireAdmin() {
        return [
            this.authenticate(),
            this.requirePermissions(['admin'])
        ];
    }

    /**
     * Premium plan middleware
     * @returns {Function} - Express middleware function
     */
    requirePremium() {
        return [
            this.authenticate(),
            this.requirePlan(['premium', 'enterprise'])
        ];
    }

    /**
     * Enterprise plan middleware
     * @returns {Function} - Express middleware function
     */
    requireEnterprise() {
        return [
            this.authenticate(),
            this.requirePlan(['enterprise'])
        ];
    }
}

// Create singleton instance
const authMiddleware = new AuthMiddleware();

module.exports = authMiddleware; 
const jwt = require('jsonwebtoken');

// Mock authentication middleware for development
const authMiddleware = (req, res, next) => {
    try {
        // In development, create a mock user
        req.user = {
            id: 'business-owner-1',
            name: 'בעל עסק לדוגמה',
            email: 'owner@example.com',
            businessType: 'beauty_salon'
        };
        
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'אין הרשאה לגשת למידע זה'
        });
    }
};

module.exports = authMiddleware;
