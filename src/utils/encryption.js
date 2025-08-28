const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { logError, logInfo, logDebug } = require('./logger');

class EncryptionUtils {
    constructor() {
        this.saltRounds = 12;
        this.jwtSecret = process.env.JWT_SECRET;
        this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
        this.refreshTokenExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
        this.sessionSecret = process.env.SESSION_SECRET || this.jwtSecret;
        this.encryptionKey = process.env.ENCRYPTION_KEY || this.jwtSecret;
    }

    /**
     * Hash password using bcrypt
     * @param {string} password - Plain text password
     * @param {number} saltRounds - Number of salt rounds (default: 12)
     * @returns {Promise<string>} - Hashed password
     */
    async hashPassword(password, saltRounds = this.saltRounds) {
        try {
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            logDebug('Password hashed successfully', {
                saltRounds,
                passwordLength: password.length
            });
            return hashedPassword;
        } catch (error) {
            logError('Error hashing password', error);
            throw new Error('Password hashing failed');
        }
    }

    /**
     * Compare password with hash
     * @param {string} password - Plain text password
     * @param {string} hash - Hashed password
     * @returns {Promise<boolean>} - True if passwords match
     */
    async comparePassword(password, hash) {
        try {
            const isMatch = await bcrypt.compare(password, hash);
            logDebug('Password comparison completed', {
                isMatch,
                passwordLength: password.length
            });
            return isMatch;
        } catch (error) {
            logError('Error comparing passwords', error);
            throw new Error('Password comparison failed');
        }
    }

    /**
     * Generate secure random string
     * @param {number} length - Length of the string (default: 32)
     * @param {string} encoding - Encoding type (default: 'hex')
     * @returns {string} - Random string
     */
    generateRandomString(length = 32, encoding = 'hex') {
        try {
            const randomBytes = crypto.randomBytes(length);
            const randomString = randomBytes.toString(encoding);
            logDebug('Random string generated', {
                length,
                encoding
            });
            return randomString;
        } catch (error) {
            logError('Error generating random string', error);
            throw new Error('Random string generation failed');
        }
    }

    /**
     * Generate API key
     * @param {string} prefix - Prefix for the API key (default: 'cg_')
     * @param {number} length - Length of the key (default: 64)
     * @returns {string} - Generated API key
     */
    generateApiKey(prefix = 'cg_', length = 64) {
        try {
            const randomPart = this.generateRandomString(length - prefix.length, 'hex');
            const apiKey = prefix + randomPart;
            logInfo('API key generated', {
                prefix,
                length: apiKey.length
            });
            return apiKey;
        } catch (error) {
            logError('Error generating API key', error);
            throw new Error('API key generation failed');
        }
    }

    /**
     * Generate session ID
     * @param {number} length - Length of session ID (default: 64)
     * @returns {string} - Generated session ID
     */
    generateSessionId(length = 64) {
        try {
            const sessionId = this.generateRandomString(length, 'hex');
            logDebug('Session ID generated', {
                length: sessionId.length
            });
            return sessionId;
        } catch (error) {
            logError('Error generating session ID', error);
            throw new Error('Session ID generation failed');
        }
    }

    /**
     * Generate JWT token
     * @param {Object} payload - Token payload
     * @param {string} expiresIn - Token expiration time
     * @param {string} secret - JWT secret (optional)
     * @returns {string} - Generated JWT token
     */
    generateJWT(payload, expiresIn = this.jwtExpiresIn, secret = this.jwtSecret) {
        try {
            const token = jwt.sign(payload, secret, {
                expiresIn,
                issuer: 'chatgrow',
                audience: 'chatgrow-users'
            });
            logDebug('JWT token generated', {
                payloadKeys: Object.keys(payload),
                expiresIn
            });
            return token;
        } catch (error) {
            logError('Error generating JWT token', error);
            throw new Error('JWT token generation failed');
        }
    }

    /**
     * Verify JWT token
     * @param {string} token - JWT token to verify
     * @param {string} secret - JWT secret (optional)
     * @returns {Object} - Decoded token payload
     */
    verifyJWT(token, secret = this.jwtSecret) {
        try {
            const decoded = jwt.verify(token, secret, {
                issuer: 'chatgrow',
                audience: 'chatgrow-users'
            });
            logDebug('JWT token verified', {
                payloadKeys: Object.keys(decoded)
            });
            return decoded;
        } catch (error) {
            logError('Error verifying JWT token', error);
            throw error;
        }
    }

    /**
     * Decode JWT token without verification
     * @param {string} token - JWT token to decode
     * @returns {Object} - Decoded token payload
     */
    decodeJWT(token) {
        try {
            const decoded = jwt.decode(token);
            logDebug('JWT token decoded', {
                payloadKeys: decoded ? Object.keys(decoded) : []
            });
            return decoded;
        } catch (error) {
            logError('Error decoding JWT token', error);
            throw new Error('JWT token decoding failed');
        }
    }

    /**
     * Encrypt sensitive data
     * @param {string} data - Data to encrypt
     * @param {string} key - Encryption key (optional)
     * @returns {string} - Encrypted data
     */
    encryptData(data, key = this.encryptionKey) {
        try {
            const algorithm = 'aes-256-gcm';
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipher(algorithm, key);
            
            let encrypted = cipher.update(data, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            const authTag = cipher.getAuthTag();
            
            // Combine IV, encrypted data, and auth tag
            const result = iv.toString('hex') + ':' + encrypted + ':' + authTag.toString('hex');
            
            logDebug('Data encrypted successfully', {
                dataLength: data.length,
                algorithm
            });
            
            return result;
        } catch (error) {
            logError('Error encrypting data', error);
            throw new Error('Data encryption failed');
        }
    }

    /**
     * Decrypt sensitive data
     * @param {string} encryptedData - Encrypted data
     * @param {string} key - Encryption key (optional)
     * @returns {string} - Decrypted data
     */
    decryptData(encryptedData, key = this.encryptionKey) {
        try {
            const algorithm = 'aes-256-gcm';
            const parts = encryptedData.split(':');
            
            if (parts.length !== 3) {
                throw new Error('Invalid encrypted data format');
            }
            
            const iv = Buffer.from(parts[0], 'hex');
            const encrypted = parts[1];
            const authTag = Buffer.from(parts[2], 'hex');
            
            const decipher = crypto.createDecipher(algorithm, key);
            decipher.setAuthTag(authTag);
            
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            logDebug('Data decrypted successfully', {
                dataLength: decrypted.length,
                algorithm
            });
            
            return decrypted;
        } catch (error) {
            logError('Error decrypting data', error);
            throw new Error('Data decryption failed');
        }
    }

    /**
     * Generate password reset token
     * @param {string} userId - User ID
     * @param {number} expiresIn - Expiration time in seconds (default: 3600)
     * @returns {string} - Generated reset token
     */
    generatePasswordResetToken(userId, expiresIn = 3600) {
        try {
            const payload = {
                userId,
                type: 'password_reset',
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + expiresIn
            };
            
            const token = this.generateJWT(payload, expiresIn + 's');
            logInfo('Password reset token generated', {
                userId,
                expiresIn
            });
            
            return token;
        } catch (error) {
            logError('Error generating password reset token', error);
            throw new Error('Password reset token generation failed');
        }
    }

    /**
     * Verify password reset token
     * @param {string} token - Reset token to verify
     * @returns {Object} - Decoded token payload
     */
    verifyPasswordResetToken(token) {
        try {
            const decoded = this.verifyJWT(token);
            
            if (decoded.type !== 'password_reset') {
                throw new Error('Invalid token type');
            }
            
            logDebug('Password reset token verified', {
                userId: decoded.userId
            });
            
            return decoded;
        } catch (error) {
            logError('Error verifying password reset token', error);
            throw error;
        }
    }

    /**
     * Generate email verification token
     * @param {string} userId - User ID
     * @param {string} email - User email
     * @param {number} expiresIn - Expiration time in seconds (default: 86400)
     * @returns {string} - Generated verification token
     */
    generateEmailVerificationToken(userId, email, expiresIn = 86400) {
        try {
            const payload = {
                userId,
                email,
                type: 'email_verification',
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + expiresIn
            };
            
            const token = this.generateJWT(payload, expiresIn + 's');
            logInfo('Email verification token generated', {
                userId,
                email,
                expiresIn
            });
            
            return token;
        } catch (error) {
            logError('Error generating email verification token', error);
            throw new Error('Email verification token generation failed');
        }
    }

    /**
     * Verify email verification token
     * @param {string} token - Verification token to verify
     * @returns {Object} - Decoded token payload
     */
    verifyEmailVerificationToken(token) {
        try {
            const decoded = this.verifyJWT(token);
            
            if (decoded.type !== 'email_verification') {
                throw new Error('Invalid token type');
            }
            
            logDebug('Email verification token verified', {
                userId: decoded.userId,
                email: decoded.email
            });
            
            return decoded;
        } catch (error) {
            logError('Error verifying email verification token', error);
            throw error;
        }
    }

    /**
     * Generate refresh token
     * @param {string} userId - User ID
     * @param {string} sessionId - Session ID
     * @returns {string} - Generated refresh token
     */
    generateRefreshToken(userId, sessionId) {
        try {
            const payload = {
                userId,
                sessionId,
                type: 'refresh',
                iat: Math.floor(Date.now() / 1000)
            };
            
            const token = this.generateJWT(payload, this.refreshTokenExpiresIn);
            logDebug('Refresh token generated', {
                userId,
                sessionId
            });
            
            return token;
        } catch (error) {
            logError('Error generating refresh token', error);
            throw new Error('Refresh token generation failed');
        }
    }

    /**
     * Verify refresh token
     * @param {string} token - Refresh token to verify
     * @returns {Object} - Decoded token payload
     */
    verifyRefreshToken(token) {
        try {
            const decoded = this.verifyJWT(token);
            
            if (decoded.type !== 'refresh') {
                throw new Error('Invalid token type');
            }
            
            logDebug('Refresh token verified', {
                userId: decoded.userId,
                sessionId: decoded.sessionId
            });
            
            return decoded;
        } catch (error) {
            logError('Error verifying refresh token', error);
            throw error;
        }
    }

    /**
     * Generate secure hash for data integrity
     * @param {string} data - Data to hash
     * @param {string} algorithm - Hash algorithm (default: 'sha256')
     * @returns {string} - Generated hash
     */
    generateHash(data, algorithm = 'sha256') {
        try {
            const hash = crypto.createHash(algorithm);
            hash.update(data);
            const result = hash.digest('hex');
            
            logDebug('Hash generated', {
                algorithm,
                dataLength: data.length
            });
            
            return result;
        } catch (error) {
            logError('Error generating hash', error);
            throw new Error('Hash generation failed');
        }
    }

    /**
     * Generate HMAC for data authentication
     * @param {string} data - Data to sign
     * @param {string} secret - Secret key
     * @param {string} algorithm - HMAC algorithm (default: 'sha256')
     * @returns {string} - Generated HMAC
     */
    generateHMAC(data, secret, algorithm = 'sha256') {
        try {
            const hmac = crypto.createHmac(algorithm, secret);
            hmac.update(data);
            const result = hmac.digest('hex');
            
            logDebug('HMAC generated', {
                algorithm,
                dataLength: data.length
            });
            
            return result;
        } catch (error) {
            logError('Error generating HMAC', error);
            throw new Error('HMAC generation failed');
        }
    }

    /**
     * Verify HMAC
     * @param {string} data - Original data
     * @param {string} hmac - HMAC to verify
     * @param {string} secret - Secret key
     * @param {string} algorithm - HMAC algorithm (default: 'sha256')
     * @returns {boolean} - True if HMAC is valid
     */
    verifyHMAC(data, hmac, secret, algorithm = 'sha256') {
        try {
            const expectedHmac = this.generateHMAC(data, secret, algorithm);
            const isValid = crypto.timingSafeEqual(
                Buffer.from(hmac, 'hex'),
                Buffer.from(expectedHmac, 'hex')
            );
            
            logDebug('HMAC verification completed', {
                algorithm,
                isValid
            });
            
            return isValid;
        } catch (error) {
            logError('Error verifying HMAC', error);
            return false;
        }
    }

    /**
     * Generate secure random number
     * @param {number} min - Minimum value (default: 0)
     * @param {number} max - Maximum value (default: 1000000)
     * @returns {number} - Random number
     */
    generateRandomNumber(min = 0, max = 1000000) {
        try {
            const range = max - min;
            const randomBytes = crypto.randomBytes(4);
            const randomValue = randomBytes.readUInt32BE(0);
            const result = min + (randomValue % range);
            
            logDebug('Random number generated', {
                min,
                max,
                result
            });
            
            return result;
        } catch (error) {
            logError('Error generating random number', error);
            throw new Error('Random number generation failed');
        }
    }

    /**
     * Generate secure UUID v4
     * @returns {string} - Generated UUID
     */
    generateUUID() {
        try {
            const uuid = crypto.randomUUID();
            logDebug('UUID generated', { uuid });
            return uuid;
        } catch (error) {
            logError('Error generating UUID', error);
            throw new Error('UUID generation failed');
        }
    }

    /**
     * Validate password strength
     * @param {string} password - Password to validate
     * @returns {Object} - Validation result
     */
    validatePasswordStrength(password) {
        const result = {
            isValid: true,
            score: 0,
            feedback: []
        };

        // Check minimum length
        if (password.length < 8) {
            result.isValid = false;
            result.feedback.push('Password must be at least 8 characters long');
        } else {
            result.score += 1;
        }

        // Check for uppercase letters
        if (!/[A-Z]/.test(password)) {
            result.feedback.push('Password must contain at least one uppercase letter');
        } else {
            result.score += 1;
        }

        // Check for lowercase letters
        if (!/[a-z]/.test(password)) {
            result.feedback.push('Password must contain at least one lowercase letter');
        } else {
            result.score += 1;
        }

        // Check for numbers
        if (!/\d/.test(password)) {
            result.feedback.push('Password must contain at least one number');
        } else {
            result.score += 1;
        }

        // Check for special characters
        if (!/[@$!%*?&]/.test(password)) {
            result.feedback.push('Password must contain at least one special character (@$!%*?&)');
        } else {
            result.score += 1;
        }

        // Check for common patterns
        const commonPatterns = [
            'password', '123456', 'qwerty', 'admin', 'user',
            'letmein', 'welcome', 'monkey', 'dragon', 'master'
        ];

        const lowerPassword = password.toLowerCase();
        for (const pattern of commonPatterns) {
            if (lowerPassword.includes(pattern)) {
                result.feedback.push('Password contains common patterns');
                result.score -= 1;
                break;
            }
        }

        // Determine if password is valid
        result.isValid = result.score >= 4 && result.feedback.length === 0;

        logDebug('Password strength validation completed', {
            isValid: result.isValid,
            score: result.score,
            feedbackCount: result.feedback.length
        });

        return result;
    }
}

// Create singleton instance
const encryptionUtils = new EncryptionUtils();

module.exports = encryptionUtils; 