const User = require('./models/User');
const authMiddleware = require('./middleware/auth');
const encryptionUtils = require('./utils/encryption');
const { logInfo, logError, logWarning } = require('./utils/logger');

/**
 * Example usage of the comprehensive authentication system
 */
async function demonstrateAuthSystem() {
    try {
        logInfo('Starting authentication system demonstration');

        // 1. User Registration
        await demonstrateUserRegistration();

        // 2. User Login
        await demonstrateUserLogin();

        // 3. Password Management
        await demonstratePasswordManagement();

        // 4. Session Management
        await demonstrateSessionManagement();

        // 5. API Key Management
        await demonstrateApiKeyManagement();

        // 6. Token Management
        await demonstrateTokenManagement();

        // 7. Security Features
        await demonstrateSecurityFeatures();

        logInfo('Authentication system demonstration completed successfully');

    } catch (error) {
        logError('Error in authentication system demonstration', error);
    }
}

/**
 * Demonstrate user registration
 */
async function demonstrateUserRegistration() {
    logInfo('=== User Registration Demo ===');

    try {
        // Create a new user
        const userData = {
            email: 'demo@example.com',
            password: 'SecurePass123!',
            firstName: 'John',
            lastName: 'Doe',
            plan: 'premium'
        };

        // Check if user already exists
        const existingUser = await User.findByEmail(userData.email);
        if (existingUser) {
            logInfo('User already exists, skipping registration');
            return existingUser;
        }

        // Create new user
        const user = new User(userData);
        await user.save();

        logInfo('User registered successfully', {
            userId: user._id,
            email: user.email,
            plan: user.plan
        });

        return user;

    } catch (error) {
        logError('Registration demo error', error);
        throw error;
    }
}

/**
 * Demonstrate user login
 */
async function demonstrateUserLogin() {
    logInfo('=== User Login Demo ===');

    try {
        // Find user
        const user = await User.findByEmail('demo@example.com');
        if (!user) {
            logWarning('User not found for login demo');
            return;
        }

        // Simulate login process
        const password = 'SecurePass123!';
        const isPasswordValid = await user.comparePassword(password);

        if (isPasswordValid) {
            // Reset login attempts and update last login
            await user.resetLoginAttempts();
            await user.updateLastLogin();

            // Generate session and tokens
            const sessionId = encryptionUtils.generateSessionId();
            const deviceInfo = {
                userAgent: 'Demo Browser/1.0',
                ip: '127.0.0.1',
                location: 'Demo Location'
            };

            user.addSession(sessionId, deviceInfo);
            await user.save();

            const tokens = authMiddleware.generateTokens(user, sessionId);

            logInfo('User logged in successfully', {
                userId: user._id,
                email: user.email,
                sessionId,
                accessToken: tokens.accessToken.substring(0, 20) + '...'
            });

            return { user, tokens, sessionId };
        } else {
            logWarning('Invalid password for login demo');
        }

    } catch (error) {
        logError('Login demo error', error);
        throw error;
    }
}

/**
 * Demonstrate password management
 */
async function demonstratePasswordManagement() {
    logInfo('=== Password Management Demo ===');

    try {
        const user = await User.findByEmail('demo@example.com');
        if (!user) {
            logWarning('User not found for password management demo');
            return;
        }

        // Validate password strength
        const passwordStrength = encryptionUtils.validatePasswordStrength('NewSecurePass456!');
        logInfo('Password strength validation', {
            isValid: passwordStrength.isValid,
            score: passwordStrength.score,
            feedback: passwordStrength.feedback
        });

        // Generate password reset token
        const resetToken = encryptionUtils.generatePasswordResetToken(user._id);
        logInfo('Password reset token generated', {
            token: resetToken.substring(0, 20) + '...'
        });

        // Verify reset token
        const decodedToken = encryptionUtils.verifyPasswordResetToken(resetToken);
        logInfo('Password reset token verified', {
            userId: decodedToken.userId,
            type: decodedToken.type
        });

        // Change password
        const newPassword = 'NewSecurePass456!';
        user.password = newPassword;
        await user.save();

        logInfo('Password changed successfully');

    } catch (error) {
        logError('Password management demo error', error);
        throw error;
    }
}

/**
 * Demonstrate session management
 */
async function demonstrateSessionManagement() {
    logInfo('=== Session Management Demo ===');

    try {
        const user = await User.findByEmail('demo@example.com');
        if (!user) {
            logWarning('User not found for session management demo');
            return;
        }

        // Add multiple sessions
        const session1 = encryptionUtils.generateSessionId();
        const session2 = encryptionUtils.generateSessionId();

        user.addSession(session1, {
            userAgent: 'Mobile App/1.0',
            ip: '192.168.1.100',
            location: 'Mobile Location'
        });

        user.addSession(session2, {
            userAgent: 'Desktop Browser/2.0',
            ip: '192.168.1.101',
            location: 'Desktop Location'
        });

        await user.save();

        logInfo('Multiple sessions added', {
            totalSessions: user.activeSessions.length
        });

        // List active sessions
        const sessions = user.activeSessions.map(session => ({
            sessionId: session.sessionId.substring(0, 16) + '...',
            deviceInfo: session.deviceInfo,
            createdAt: session.createdAt,
            expiresAt: session.expiresAt
        }));

        logInfo('Active sessions', { sessions });

        // Remove a session
        await user.removeSession(session1);
        logInfo('Session removed', {
            remainingSessions: user.activeSessions.length
        });

        // Clean expired sessions
        await user.cleanExpiredSessions();
        logInfo('Expired sessions cleaned');

    } catch (error) {
        logError('Session management demo error', error);
        throw error;
    }
}

/**
 * Demonstrate API key management
 */
async function demonstrateApiKeyManagement() {
    logInfo('=== API Key Management Demo ===');

    try {
        const user = await User.findByEmail('demo@example.com');
        if (!user) {
            logWarning('User not found for API key management demo');
            return;
        }

        // Generate API keys
        const apiKey1 = user.generateApiKey('Production API Key');
        const apiKey2 = user.generateApiKey('Development API Key');

        await user.save();

        logInfo('API keys generated', {
            apiKey1: apiKey1.substring(0, 20) + '...',
            apiKey2: apiKey2.substring(0, 20) + '...',
            totalKeys: user.apiKeys.length
        });

        // List API keys
        const apiKeys = user.apiKeys.map(key => ({
            name: key.name,
            key: key.key.substring(0, 16) + '...',
            permissions: key.permissions,
            isActive: key.isActive,
            createdAt: key.createdAt
        }));

        logInfo('User API keys', { apiKeys });

        // Find user by API key
        const foundUser = await User.findByApiKey(apiKey1);
        if (foundUser) {
            logInfo('User found by API key', {
                userId: foundUser._id,
                email: foundUser.email
            });
        }

        // Revoke an API key
        await user.revokeApiKey(apiKey2);
        logInfo('API key revoked', {
            remainingKeys: user.apiKeys.length
        });

    } catch (error) {
        logError('API key management demo error', error);
        throw error;
    }
}

/**
 * Demonstrate token management
 */
async function demonstrateTokenManagement() {
    logInfo('=== Token Management Demo ===');

    try {
        const user = await User.findByEmail('demo@example.com');
        if (!user) {
            logWarning('User not found for token management demo');
            return;
        }

        // Generate different types of tokens
        const sessionId = encryptionUtils.generateSessionId();
        const accessToken = authMiddleware.generateTokens(user, sessionId);
        const refreshToken = encryptionUtils.generateRefreshToken(user._id, sessionId);
        const emailVerificationToken = encryptionUtils.generateEmailVerificationToken(user._id, user.email);

        logInfo('Tokens generated', {
            accessToken: accessToken.accessToken.substring(0, 20) + '...',
            refreshToken: refreshToken.substring(0, 20) + '...',
            emailVerificationToken: emailVerificationToken.substring(0, 20) + '...'
        });

        // Verify tokens
        const decodedAccessToken = authMiddleware.verifyToken(accessToken.accessToken);
        const decodedRefreshToken = encryptionUtils.verifyRefreshToken(refreshToken);
        const decodedEmailToken = encryptionUtils.verifyEmailVerificationToken(emailVerificationToken);

        logInfo('Tokens verified successfully', {
            accessTokenUserId: decodedAccessToken.userId,
            refreshTokenUserId: decodedRefreshToken.userId,
            emailTokenUserId: decodedEmailToken.userId
        });

        // Demonstrate token refresh
        const newAccessToken = authMiddleware.generateTokens(user, sessionId);
        logInfo('Token refreshed', {
            newToken: newAccessToken.accessToken.substring(0, 20) + '...'
        });

    } catch (error) {
        logError('Token management demo error', error);
        throw error;
    }
}

/**
 * Demonstrate security features
 */
async function demonstrateSecurityFeatures() {
    logInfo('=== Security Features Demo ===');

    try {
        const user = await User.findByEmail('demo@example.com');
        if (!user) {
            logWarning('User not found for security features demo');
            return;
        }

        // Demonstrate login attempt tracking
        logInfo('Simulating failed login attempts');
        for (let i = 0; i < 3; i++) {
            await user.incrementLoginAttempts();
            logInfo(`Login attempt ${i + 1}`, {
                attempts: user.loginAttempts,
                isLocked: user.isLocked
            });
        }

        // Reset login attempts
        await user.resetLoginAttempts();
        logInfo('Login attempts reset', {
            attempts: user.loginAttempts,
            isLocked: user.isLocked
        });

        // Demonstrate message sending limits
        const canSendResult = user.canSendMessage();
        logInfo('Message sending check', {
            canSend: canSendResult.canSend,
            reason: canSendResult.reason
        });

        // Increment message count
        await user.incrementMessageCount('sent');
        await user.incrementMessageCount('delivered');
        await user.incrementMessageCount('failed');

        logInfo('Message counts updated', {
            totalSent: user.usageStats.totalMessagesSent,
            totalDelivered: user.usageStats.totalMessagesDelivered,
            totalFailed: user.usageStats.totalMessagesFailed,
            dailyCount: user.usageStats.dailyMessageCount
        });

        // Add WhatsApp connection
        await user.addConnection('whatsapp_connection_1');
        logInfo('WhatsApp connection added', {
            connections: user.connectionIds
        });

        // Remove connection
        await user.removeConnection('whatsapp_connection_1');
        logInfo('WhatsApp connection removed', {
            connections: user.connectionIds
        });

    } catch (error) {
        logError('Security features demo error', error);
        throw error;
    }
}

/**
 * Demonstrate user statistics and analytics
 */
async function demonstrateUserAnalytics() {
    logInfo('=== User Analytics Demo ===');

    try {
        // Get usage statistics
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30); // Last 30 days
        const endDate = new Date();

        const usageStats = await User.getUsageStats(startDate, endDate);
        logInfo('Usage statistics', { usageStats });

        // Get users by plan
        const premiumUsers = await User.findByPlan('premium');
        logInfo('Premium users count', { count: premiumUsers.length });

        // Get users with expired plans
        const expiredPlanUsers = await User.getUsersWithExpiredPlans();
        logInfo('Users with expired plans', { count: expiredPlanUsers.length });

        // Get locked accounts
        const lockedAccounts = await User.getLockedAccounts();
        logInfo('Locked accounts', { count: lockedAccounts.length });

        // Clean inactive sessions
        const cleanupResult = await User.cleanInactiveSessions();
        logInfo('Inactive sessions cleaned', { result: cleanupResult });

    } catch (error) {
        logError('User analytics demo error', error);
        throw error;
    }
}

/**
 * Demonstrate error handling
 */
async function demonstrateErrorHandling() {
    logInfo('=== Error Handling Demo ===');

    try {
        // Try to verify invalid token
        try {
            authMiddleware.verifyToken('invalid_token');
        } catch (error) {
            logWarning('Expected error: Invalid token', { error: error.message });
        }

        // Try to verify expired token
        try {
            const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid_signature';
            authMiddleware.verifyToken(expiredToken);
        } catch (error) {
            logWarning('Expected error: Expired token', { error: error.message });
        }

        // Try to find user with invalid email
        const invalidUser = await User.findByEmail('nonexistent@example.com');
        if (!invalidUser) {
            logInfo('Expected result: User not found');
        }

        // Try to compare invalid password
        const user = await User.findByEmail('demo@example.com');
        if (user) {
            const isInvalidPassword = await user.comparePassword('wrongpassword');
            logInfo('Invalid password comparison', { isMatch: isInvalidPassword });
        }

    } catch (error) {
        logError('Error handling demo error', error);
        throw error;
    }
}

/**
 * Main demonstration function
 */
async function runAuthDemonstration() {
    try {
        logInfo('Starting comprehensive authentication system demonstration');

        // Run all demonstrations
        await demonstrateAuthSystem();
        await demonstrateUserAnalytics();
        await demonstrateErrorHandling();

        logInfo('All demonstrations completed successfully');

    } catch (error) {
        logError('Error in authentication demonstration', error);
    }
}

// Export functions for use in other files
module.exports = {
    demonstrateAuthSystem,
    demonstrateUserRegistration,
    demonstrateUserLogin,
    demonstratePasswordManagement,
    demonstrateSessionManagement,
    demonstrateApiKeyManagement,
    demonstrateTokenManagement,
    demonstrateSecurityFeatures,
    demonstrateUserAnalytics,
    demonstrateErrorHandling,
    runAuthDemonstration
};

// Run demonstration if this file is executed directly
if (require.main === module) {
    runAuthDemonstration().catch(console.error);
} 