const express = require('express');
const router = express.Router();
const Joi = require('joi');
const crypto = require('crypto');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const { logInfo, logError, logWarning, logApiRequest } = require('../utils/logger');

// Validation schemas
const registerSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
    }),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required().messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'Password is required'
    }),
    firstName: Joi.string().max(50).optional(),
    lastName: Joi.string().max(50).optional(),
    plan: Joi.string().valid('free', 'basic', 'premium', 'enterprise').default('free')
});

const loginSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
    }),
    password: Joi.string().required().messages({
        'any.required': 'Password is required'
    }),
    rememberMe: Joi.boolean().default(false)
});

const updateProfileSchema = Joi.object({
    firstName: Joi.string().max(50).optional(),
    lastName: Joi.string().max(50).optional(),
    preferences: Joi.object({
        timezone: Joi.string().optional(),
        language: Joi.string().optional(),
        notifications: Joi.object({
            email: Joi.boolean().optional(),
            push: Joi.boolean().optional(),
            sms: Joi.boolean().optional()
        }).optional()
    }).optional()
});

const changePasswordSchema = Joi.object({
    currentPassword: Joi.string().required().messages({
        'any.required': 'Current password is required'
    }),
    newPassword: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required().messages({
        'string.min': 'New password must be at least 8 characters long',
        'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'New password is required'
    })
});

const forgotPasswordSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
    })
});

const resetPasswordSchema = Joi.object({
    token: Joi.string().required().messages({
        'any.required': 'Reset token is required'
    }),
    newPassword: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required().messages({
        'string.min': 'New password must be at least 8 characters long',
        'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'New password is required'
    })
});

// Helper function to get device info
const getDeviceInfo = (req) => {
    return {
        userAgent: req.get('User-Agent') || 'Unknown',
        ip: req.ip || req.connection.remoteAddress,
        location: req.get('CF-IPCountry') || 'Unknown'
    };
};

// Helper function to generate session ID
const generateSessionId = () => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', authMiddleware.rateLimitAuth(3, 15 * 60 * 1000), async (req, res) => {
    const startTime = Date.now();
    
    try {
        // Validate input
        const { error, value } = registerSchema.validate(req.body);
        if (error) {
            logWarning('Registration validation failed', {
                errors: error.details.map(d => d.message),
                ip: req.ip
            });
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details.map(d => d.message)
            });
        }

        const { email, password, firstName, lastName, plan } = value;

        // Check if user already exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            logWarning('Registration attempt with existing email', {
                email,
                ip: req.ip
            });
            return res.status(409).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Create new user
        const user = new User({
            email,
            password,
            firstName,
            lastName,
            plan,
            planDetails: {
                maxConnections: plan === 'free' ? 1 : plan === 'basic' ? 3 : plan === 'premium' ? 10 : 50,
                maxMessagesPerDay: plan === 'free' ? 100 : plan === 'basic' ? 1000 : plan === 'premium' ? 10000 : 100000,
                features: plan === 'free' ? ['basic_messaging'] : 
                         plan === 'basic' ? ['basic_messaging', 'bulk_messaging'] :
                         plan === 'premium' ? ['basic_messaging', 'bulk_messaging', 'analytics', 'api_access'] :
                         ['basic_messaging', 'bulk_messaging', 'analytics', 'api_access', 'priority_support', 'custom_integrations']
            }
        });

        await user.save();

        // Generate session and tokens
        const sessionId = generateSessionId();
        const deviceInfo = getDeviceInfo(req);
        user.addSession(sessionId, deviceInfo);
        await user.save();

        const tokens = authMiddleware.generateTokens(user, sessionId);

        logInfo('User registered successfully', {
            userId: user._id,
            email: user.email,
            plan: user.plan,
            ip: req.ip
        });

        const responseTime = Date.now() - startTime;
        logApiRequest('POST', '/api/auth/register', 201, responseTime, {
            userId: user._id,
            email: user.email
        });

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    plan: user.plan,
                    isEmailVerified: user.isEmailVerified
                },
                tokens,
                sessionId
            }
        });

    } catch (error) {
        logError('Registration error', error, {
            email: req.body.email,
            ip: req.ip
        });

        const responseTime = Date.now() - startTime;
        logApiRequest('POST', '/api/auth/register', 500, responseTime, {
            error: error.message
        });

        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

/**
 * @route POST /api/auth/login
 * @desc Login user
 * @access Public
 */
router.post('/login', authMiddleware.rateLimitAuth(5, 15 * 60 * 1000), async (req, res) => {
    const startTime = Date.now();
    
    try {
        // Validate input
        const { error, value } = loginSchema.validate(req.body);
        if (error) {
            logWarning('Login validation failed', {
                errors: error.details.map(d => d.message),
                ip: req.ip
            });
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details.map(d => d.message)
            });
        }

        const { email, password, rememberMe } = value;

        // Find user
        const user = await User.findByEmail(email);
        if (!user) {
            logWarning('Login attempt with non-existent email', {
                email,
                ip: req.ip
            });
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if account is locked
        if (user.isLocked) {
            logWarning('Login attempt on locked account', {
                userId: user._id,
                email: user.email,
                ip: req.ip
            });
            return res.status(423).json({
                success: false,
                message: 'Account is temporarily locked due to too many failed attempts'
            });
        }

        // Check if account is active
        if (!user.isActive) {
            logWarning('Login attempt on inactive account', {
                userId: user._id,
                email: user.email,
                ip: req.ip
            });
            return res.status(403).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            await user.incrementLoginAttempts();
            logWarning('Invalid password login attempt', {
                userId: user._id,
                email: user.email,
                ip: req.ip
            });
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Reset login attempts on successful login
        await user.resetLoginAttempts();
        await user.updateLastLogin();

        // Generate session and tokens
        const sessionId = generateSessionId();
        const deviceInfo = getDeviceInfo(req);
        user.addSession(sessionId, deviceInfo);
        await user.save();

        const tokens = authMiddleware.generateTokens(user, sessionId);

        logInfo('User logged in successfully', {
            userId: user._id,
            email: user.email,
            ip: req.ip
        });

        const responseTime = Date.now() - startTime;
        logApiRequest('POST', '/api/auth/login', 200, responseTime, {
            userId: user._id,
            email: user.email
        });

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    plan: user.plan,
                    isEmailVerified: user.isEmailVerified
                },
                tokens,
                sessionId
            }
        });

    } catch (error) {
        logError('Login error', error, {
            email: req.body.email,
            ip: req.ip
        });

        const responseTime = Date.now() - startTime;
        logApiRequest('POST', '/api/auth/login', 500, responseTime, {
            error: error.message
        });

        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

/**
 * @route POST /api/auth/logout
 * @desc Logout user
 * @access Private
 */
router.post('/logout', authMiddleware.authenticate(), async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { sessionId } = req.token;
        const user = req.user;

        // Remove session
        await user.removeSession(sessionId);

        logInfo('User logged out successfully', {
            userId: user._id,
            email: user.email,
            sessionId,
            ip: req.ip
        });

        const responseTime = Date.now() - startTime;
        logApiRequest('POST', '/api/auth/logout', 200, responseTime, {
            userId: user._id,
            email: user.email
        });

        res.json({
            success: true,
            message: 'Logout successful'
        });

    } catch (error) {
        logError('Logout error', error, {
            userId: req.user?._id,
            ip: req.ip
        });

        const responseTime = Date.now() - startTime;
        logApiRequest('POST', '/api/auth/logout', 500, responseTime, {
            error: error.message
        });

        res.status(500).json({
            success: false,
            message: 'Logout failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

/**
 * @route GET /api/auth/me
 * @desc Get current user profile
 * @access Private
 */
router.get('/me', authMiddleware.authenticate(), async (req, res) => {
    const startTime = Date.now();
    
    try {
        const user = req.user;

        const responseTime = Date.now() - startTime;
        logApiRequest('GET', '/api/auth/me', 200, responseTime, {
            userId: user._id,
            email: user.email
        });

        res.json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    fullName: user.fullName,
                    plan: user.plan,
                    planDetails: user.planDetails,
                    isEmailVerified: user.isEmailVerified,
                    isActive: user.isActive,
                    isPlanActive: user.isPlanActive,
                    lastLogin: user.lastLogin,
                    lastActivity: user.lastActivity,
                    connectionIds: user.connectionIds,
                    usageStats: user.usageStats,
                    preferences: user.preferences,
                    createdAt: user.createdAt
                }
            }
        });

    } catch (error) {
        logError('Get profile error', error, {
            userId: req.user?._id,
            ip: req.ip
        });

        const responseTime = Date.now() - startTime;
        logApiRequest('GET', '/api/auth/me', 500, responseTime, {
            error: error.message
        });

        res.status(500).json({
            success: false,
            message: 'Failed to get profile',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

/**
 * @route PUT /api/auth/profile
 * @desc Update user profile
 * @access Private
 */
router.put('/profile', authMiddleware.authenticate(), async (req, res) => {
    const startTime = Date.now();
    
    try {
        // Validate input
        const { error, value } = updateProfileSchema.validate(req.body);
        if (error) {
            logWarning('Profile update validation failed', {
                errors: error.details.map(d => d.message),
                userId: req.user._id,
                ip: req.ip
            });
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details.map(d => d.message)
            });
        }

        const user = req.user;
        const { firstName, lastName, preferences } = value;

        // Update fields
        if (firstName !== undefined) user.firstName = firstName;
        if (lastName !== undefined) user.lastName = lastName;
        if (preferences) {
            user.preferences = { ...user.preferences, ...preferences };
        }

        await user.save();

        logInfo('Profile updated successfully', {
            userId: user._id,
            email: user.email,
            ip: req.ip
        });

        const responseTime = Date.now() - startTime;
        logApiRequest('PUT', '/api/auth/profile', 200, responseTime, {
            userId: user._id,
            email: user.email
        });

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    fullName: user.fullName,
                    preferences: user.preferences
                }
            }
        });

    } catch (error) {
        logError('Profile update error', error, {
            userId: req.user?._id,
            ip: req.ip
        });

        const responseTime = Date.now() - startTime;
        logApiRequest('PUT', '/api/auth/profile', 500, responseTime, {
            error: error.message
        });

        res.status(500).json({
            success: false,
            message: 'Profile update failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

/**
 * @route POST /api/auth/change-password
 * @desc Change user password
 * @access Private
 */
router.post('/change-password', authMiddleware.authenticate(), async (req, res) => {
    const startTime = Date.now();
    
    try {
        // Validate input
        const { error, value } = changePasswordSchema.validate(req.body);
        if (error) {
            logWarning('Change password validation failed', {
                errors: error.details.map(d => d.message),
                userId: req.user._id,
                ip: req.ip
            });
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details.map(d => d.message)
            });
        }

        const { currentPassword, newPassword } = value;
        const user = req.user;

        // Verify current password
        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
            logWarning('Invalid current password for change password', {
                userId: user._id,
                email: user.email,
                ip: req.ip
            });
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        logInfo('Password changed successfully', {
            userId: user._id,
            email: user.email,
            ip: req.ip
        });

        const responseTime = Date.now() - startTime;
        logApiRequest('POST', '/api/auth/change-password', 200, responseTime, {
            userId: user._id,
            email: user.email
        });

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        logError('Change password error', error, {
            userId: req.user?._id,
            ip: req.ip
        });

        const responseTime = Date.now() - startTime;
        logApiRequest('POST', '/api/auth/change-password', 500, responseTime, {
            error: error.message
        });

        res.status(500).json({
            success: false,
            message: 'Password change failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

/**
 * @route POST /api/auth/forgot-password
 * @desc Send password reset email
 * @access Public
 */
router.post('/forgot-password', authMiddleware.rateLimitAuth(3, 15 * 60 * 1000), async (req, res) => {
    const startTime = Date.now();
    
    try {
        // Validate input
        const { error, value } = forgotPasswordSchema.validate(req.body);
        if (error) {
            logWarning('Forgot password validation failed', {
                errors: error.details.map(d => d.message),
                ip: req.ip
            });
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details.map(d => d.message)
            });
        }

        const { email } = value;

        // Find user
        const user = await User.findByEmail(email);
        if (!user) {
            // Don't reveal if user exists or not
            logInfo('Forgot password request for non-existent email', {
                email,
                ip: req.ip
            });
            return res.json({
                success: true,
                message: 'If an account with this email exists, a password reset link has been sent'
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.passwordResetToken = resetToken;
        user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await user.save();

        // TODO: Send email with reset link
        // For now, just log the token
        logInfo('Password reset token generated', {
            userId: user._id,
            email: user.email,
            resetToken,
            ip: req.ip
        });

        const responseTime = Date.now() - startTime;
        logApiRequest('POST', '/api/auth/forgot-password', 200, responseTime, {
            email
        });

        res.json({
            success: true,
            message: 'If an account with this email exists, a password reset link has been sent'
        });

    } catch (error) {
        logError('Forgot password error', error, {
            email: req.body.email,
            ip: req.ip
        });

        const responseTime = Date.now() - startTime;
        logApiRequest('POST', '/api/auth/forgot-password', 500, responseTime, {
            error: error.message
        });

        res.status(500).json({
            success: false,
            message: 'Password reset request failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

/**
 * @route POST /api/auth/reset-password
 * @desc Reset password with token
 * @access Public
 */
router.post('/reset-password', authMiddleware.rateLimitAuth(3, 15 * 60 * 1000), async (req, res) => {
    const startTime = Date.now();
    
    try {
        // Validate input
        const { error, value } = resetPasswordSchema.validate(req.body);
        if (error) {
            logWarning('Reset password validation failed', {
                errors: error.details.map(d => d.message),
                ip: req.ip
            });
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details.map(d => d.message)
            });
        }

        const { token, newPassword } = value;

        // Find user with valid reset token
        const user = await User.findOne({
            passwordResetToken: token,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            logWarning('Invalid or expired password reset token', {
                token: token.substring(0, 8) + '...',
                ip: req.ip
            });
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        // Update password and clear reset token
        user.password = newPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        logInfo('Password reset successfully', {
            userId: user._id,
            email: user.email,
            ip: req.ip
        });

        const responseTime = Date.now() - startTime;
        logApiRequest('POST', '/api/auth/reset-password', 200, responseTime, {
            userId: user._id,
            email: user.email
        });

        res.json({
            success: true,
            message: 'Password reset successfully'
        });

    } catch (error) {
        logError('Reset password error', error, {
            ip: req.ip
        });

        const responseTime = Date.now() - startTime;
        logApiRequest('POST', '/api/auth/reset-password', 500, responseTime, {
            error: error.message
        });

        res.status(500).json({
            success: false,
            message: 'Password reset failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

/**
 * @route POST /api/auth/refresh
 * @desc Refresh access token
 * @access Public
 */
router.post('/refresh', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required'
            });
        }

        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        
        if (decoded.type !== 'refresh') {
            return res.status(400).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }

        // Find user
        const user = await User.findById(decoded.userId);
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'User not found or inactive'
            });
        }

        // Verify session exists
        const session = user.activeSessions.find(s => s.sessionId === decoded.sessionId);
        if (!session || session.expiresAt < new Date()) {
            return res.status(401).json({
                success: false,
                message: 'Session expired'
            });
        }

        // Generate new access token
        const newAccessToken = jwt.sign({
            userId: user._id,
            email: user.email,
            plan: user.plan,
            sessionId: decoded.sessionId,
            permissions: authMiddleware.getUserPermissions(user)
        }, process.env.JWT_SECRET, {
            expiresIn: authMiddleware.jwtExpiresIn
        });

        logInfo('Token refreshed successfully', {
            userId: user._id,
            email: user.email,
            sessionId: decoded.sessionId
        });

        const responseTime = Date.now() - startTime;
        logApiRequest('POST', '/api/auth/refresh', 200, responseTime, {
            userId: user._id,
            email: user.email
        });

        res.json({
            success: true,
            data: {
                accessToken: newAccessToken,
                expiresIn: authMiddleware.jwtExpiresIn
            }
        });

    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }

        logError('Token refresh error', error, {
            ip: req.ip
        });

        const responseTime = Date.now() - startTime;
        logApiRequest('POST', '/api/auth/refresh', 500, responseTime, {
            error: error.message
        });

        res.status(500).json({
            success: false,
            message: 'Token refresh failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

/**
 * @route GET /api/auth/sessions
 * @desc Get user active sessions
 * @access Private
 */
router.get('/sessions', authMiddleware.authenticate(), async (req, res) => {
    const startTime = Date.now();
    
    try {
        const user = req.user;
        const currentSessionId = req.token.sessionId;

        const sessions = user.activeSessions.map(session => ({
            sessionId: session.sessionId,
            deviceInfo: session.deviceInfo,
            createdAt: session.createdAt,
            lastActivity: session.lastActivity,
            expiresAt: session.expiresAt,
            isCurrent: session.sessionId === currentSessionId
        }));

        const responseTime = Date.now() - startTime;
        logApiRequest('GET', '/api/auth/sessions', 200, responseTime, {
            userId: user._id,
            email: user.email
        });

        res.json({
            success: true,
            data: { sessions }
        });

    } catch (error) {
        logError('Get sessions error', error, {
            userId: req.user?._id,
            ip: req.ip
        });

        const responseTime = Date.now() - startTime;
        logApiRequest('GET', '/api/auth/sessions', 500, responseTime, {
            error: error.message
        });

        res.status(500).json({
            success: false,
            message: 'Failed to get sessions',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

/**
 * @route DELETE /api/auth/sessions/:sessionId
 * @desc Revoke specific session
 * @access Private
 */
router.delete('/sessions/:sessionId', authMiddleware.authenticate(), async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { sessionId } = req.params;
        const user = req.user;

        // Check if session exists
        const session = user.activeSessions.find(s => s.sessionId === sessionId);
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }

        // Remove session
        await user.removeSession(sessionId);

        logInfo('Session revoked successfully', {
            userId: user._id,
            email: user.email,
            sessionId,
            ip: req.ip
        });

        const responseTime = Date.now() - startTime;
        logApiRequest('DELETE', `/api/auth/sessions/${sessionId}`, 200, responseTime, {
            userId: user._id,
            email: user.email
        });

        res.json({
            success: true,
            message: 'Session revoked successfully'
        });

    } catch (error) {
        logError('Revoke session error', error, {
            userId: req.user?._id,
            sessionId: req.params.sessionId,
            ip: req.ip
        });

        const responseTime = Date.now() - startTime;
        logApiRequest('DELETE', `/api/auth/sessions/${req.params.sessionId}`, 500, responseTime, {
            error: error.message
        });

        res.status(500).json({
            success: false,
            message: 'Failed to revoke session',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

module.exports = router; 