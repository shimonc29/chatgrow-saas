# ChatGrow Authentication System

A comprehensive, secure, and scalable authentication system for the ChatGrow WhatsApp messaging platform.

## 🎯 Goals

- **Secure Authentication**: JWT-based authentication with refresh tokens
- **Multi-Plan Support**: Free, Basic, Premium, and Enterprise plans
- **Session Management**: Multi-device session tracking and management
- **API Key Management**: Secure API access for integrations
- **Rate Limiting**: Protection against brute force attacks
- **Security Features**: IP filtering, input validation, and threat detection
- **Comprehensive Logging**: Detailed audit trails for security monitoring

## 🏗️ Architecture

### Core Components

1. **User Model** (`src/models/User.js`)
   - Comprehensive user data management
   - Plan-based features and limits
   - Session and API key tracking
   - Usage statistics and analytics

2. **Authentication Middleware** (`src/middleware/auth.js`)
   - JWT token generation and verification
   - Permission-based authorization
   - Plan-based access control
   - API key authentication

3. **Security Middleware** (`src/middleware/security.js`)
   - IP filtering and threat detection
   - Rate limiting and DDoS protection
   - Input validation and sanitization
   - Security headers and CORS

4. **Encryption Utilities** (`src/utils/encryption.js`)
   - Password hashing and validation
   - Secure token generation
   - Data encryption and decryption
   - Cryptographic utilities

5. **Authentication Routes** (`src/routes/auth.js`)
   - User registration and login
   - Password management
   - Session management
   - Token refresh

## 📦 Installation

### Prerequisites

- Node.js 14.0.0 or higher
- MongoDB database
- Redis (for session storage and rate limiting)

### Dependencies

```bash
npm install bcryptjs jsonwebtoken joi helmet express-rate-limit
```

### Environment Variables

Add these to your `.env` file:

```env
# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN=7d
SESSION_SECRET=your-session-secret-key

# Security
ENCRYPTION_KEY=your-encryption-key-for-sensitive-data
IP_WHITELIST=127.0.0.1,192.168.1.100
IP_BLACKLIST=malicious-ip-1,malicious-ip-2
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# Rate Limiting
AUTH_RATE_LIMIT_WINDOW=900000
AUTH_RATE_LIMIT_MAX=5
API_RATE_LIMIT_WINDOW=900000
API_RATE_LIMIT_MAX=100
```

## 🚀 Quick Start

### 1. Basic Setup

```javascript
const express = require('express');
const authRoutes = require('./routes/auth');
const authMiddleware = require('./middleware/auth');
const securityMiddleware = require('./middleware/security');

const app = express();

// Security middleware
app.use(securityMiddleware.configureHelmet());
app.use(securityMiddleware.ipFilter());
app.use(securityMiddleware.requestLogger());
app.use(securityMiddleware.inputValidation());
app.use(securityMiddleware.configureCORS());
app.use(securityMiddleware.requestSizeLimit());
app.use(securityMiddleware.securityHeaders());

// Authentication routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/protected', authMiddleware.authenticate(), (req, res) => {
    res.json({ message: 'Protected route accessed', user: req.user });
});
```

### 2. User Registration

```javascript
// POST /api/auth/register
const userData = {
    email: 'user@example.com',
    password: 'SecurePass123!',
    firstName: 'John',
    lastName: 'Doe',
    plan: 'premium'
};

const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
});

const result = await response.json();
// Returns: { success: true, data: { user, tokens, sessionId } }
```

### 3. User Login

```javascript
// POST /api/auth/login
const loginData = {
    email: 'user@example.com',
    password: 'SecurePass123!',
    rememberMe: true
};

const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(loginData)
});

const result = await response.json();
// Returns: { success: true, data: { user, tokens, sessionId } }
```

### 4. Protected Route Access

```javascript
// GET /api/auth/me (requires authentication)
const response = await fetch('/api/auth/me', {
    headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
    }
});

const userProfile = await response.json();
```

## 🔐 Authentication Features

### JWT Token Management

```javascript
const authMiddleware = require('./middleware/auth');

// Generate tokens
const tokens = authMiddleware.generateTokens(user, sessionId);

// Verify tokens
const decoded = authMiddleware.verifyToken(token);

// Refresh tokens
const newTokens = authMiddleware.generateTokens(user, sessionId);
```

### Password Management

```javascript
const encryptionUtils = require('./utils/encryption');

// Hash password
const hashedPassword = await encryptionUtils.hashPassword('SecurePass123!');

// Compare password
const isMatch = await encryptionUtils.comparePassword('SecurePass123!', hashedPassword);

// Validate password strength
const strength = encryptionUtils.validatePasswordStrength('SecurePass123!');
```

### Session Management

```javascript
const user = await User.findByEmail('user@example.com');

// Add session
const sessionId = encryptionUtils.generateSessionId();
user.addSession(sessionId, deviceInfo);
await user.save();

// List sessions
const sessions = user.activeSessions;

// Remove session
await user.removeSession(sessionId);

// Clean expired sessions
await user.cleanExpiredSessions();
```

### API Key Management

```javascript
const user = await User.findByEmail('user@example.com');

// Generate API key
const apiKey = user.generateApiKey('Production API Key');
await user.save();

// Find user by API key
const foundUser = await User.findByApiKey(apiKey);

// Revoke API key
await user.revokeApiKey(apiKey);
```

## 🛡️ Security Features

### Rate Limiting

```javascript
const securityMiddleware = require('./middleware/security');

// API rate limiting
app.use('/api/', securityMiddleware.apiRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
}));

// Authentication rate limiting
app.use('/api/auth/', securityMiddleware.authRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5 // limit each IP to 5 auth attempts per windowMs
}));
```

### IP Filtering

```javascript
// Add IP to blacklist
securityMiddleware.addToBlacklist('malicious-ip');

// Add IP to whitelist
securityMiddleware.addToWhitelist('trusted-ip');

// Get security statistics
const stats = securityMiddleware.getStats();
```

### Input Validation

```javascript
// Automatic validation in routes
// Checks for XSS, SQL injection, and other malicious patterns

// Manual validation
const encryptionUtils = require('./utils/encryption');
const strength = encryptionUtils.validatePasswordStrength(password);
```

## 📊 User Plans and Features

### Plan Structure

| Plan | Max Connections | Daily Messages | Features |
|------|----------------|----------------|----------|
| Free | 1 | 100 | Basic messaging |
| Basic | 3 | 1,000 | Bulk messaging |
| Premium | 10 | 10,000 | Analytics, API access |
| Enterprise | 50 | 100,000 | Priority support, Custom integrations |

### Plan-Based Authorization

```javascript
// Require specific plan
app.use('/api/analytics', 
    authMiddleware.authenticate(),
    authMiddleware.requirePlan(['premium', 'enterprise'])
);

// Require specific permissions
app.use('/api/admin', 
    authMiddleware.authenticate(),
    authMiddleware.requirePermissions(['admin'])
);

// Require enterprise plan
app.use('/api/enterprise', 
    authMiddleware.requireEnterprise()
);
```

## 🔄 API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | User login | Public |
| POST | `/api/auth/logout` | User logout | Private |
| GET | `/api/auth/me` | Get user profile | Private |
| PUT | `/api/auth/profile` | Update user profile | Private |
| POST | `/api/auth/change-password` | Change password | Private |
| POST | `/api/auth/forgot-password` | Request password reset | Public |
| POST | `/api/auth/reset-password` | Reset password | Public |
| POST | `/api/auth/refresh` | Refresh access token | Public |
| GET | `/api/auth/sessions` | Get active sessions | Private |
| DELETE | `/api/auth/sessions/:sessionId` | Revoke session | Private |

### Request/Response Examples

#### Registration

```javascript
// Request
POST /api/auth/register
{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe",
    "plan": "premium"
}

// Response
{
    "success": true,
    "message": "User registered successfully",
    "data": {
        "user": {
            "id": "user_id",
            "email": "user@example.com",
            "firstName": "John",
            "lastName": "Doe",
            "plan": "premium",
            "isEmailVerified": false
        },
        "tokens": {
            "accessToken": "jwt_token",
            "refreshToken": "refresh_token",
            "expiresIn": "24h",
            "refreshExpiresIn": "7d"
        },
        "sessionId": "session_id"
    }
}
```

#### Login

```javascript
// Request
POST /api/auth/login
{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "rememberMe": true
}

// Response
{
    "success": true,
    "message": "Login successful",
    "data": {
        "user": {
            "id": "user_id",
            "email": "user@example.com",
            "firstName": "John",
            "lastName": "Doe",
            "plan": "premium",
            "isEmailVerified": false
        },
        "tokens": {
            "accessToken": "jwt_token",
            "refreshToken": "refresh_token",
            "expiresIn": "24h",
            "refreshExpiresIn": "7d"
        },
        "sessionId": "session_id"
    }
}
```

#### User Profile

```javascript
// Request
GET /api/auth/me
Authorization: Bearer jwt_token

// Response
{
    "success": true,
    "data": {
        "user": {
            "id": "user_id",
            "email": "user@example.com",
            "firstName": "John",
            "lastName": "Doe",
            "fullName": "John Doe",
            "plan": "premium",
            "planDetails": {
                "maxConnections": 10,
                "maxMessagesPerDay": 10000,
                "features": ["basic_messaging", "bulk_messaging", "analytics", "api_access"]
            },
            "isEmailVerified": false,
            "isActive": true,
            "isPlanActive": true,
            "lastLogin": "2024-01-01T00:00:00.000Z",
            "lastActivity": "2024-01-01T00:00:00.000Z",
            "connectionIds": [],
            "usageStats": {
                "totalMessagesSent": 0,
                "totalMessagesDelivered": 0,
                "totalMessagesFailed": 0,
                "dailyMessageCount": 0
            },
            "preferences": {
                "timezone": "UTC",
                "language": "en",
                "notifications": {
                    "email": true,
                    "push": true,
                    "sms": false
                }
            },
            "createdAt": "2024-01-01T00:00:00.000Z"
        }
    }
}
```

## 🔧 Configuration

### Environment Variables

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/chatgrow

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN=7d
SESSION_SECRET=your-session-secret-key

# Security
ENCRYPTION_KEY=your-encryption-key-for-sensitive-data
IP_WHITELIST=127.0.0.1,192.168.1.100
IP_BLACKLIST=malicious-ip-1,malicious-ip-2
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# Rate Limiting
AUTH_RATE_LIMIT_WINDOW=900000
AUTH_RATE_LIMIT_MAX=5
API_RATE_LIMIT_WINDOW=900000
API_RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=info
```

### Custom Configuration

```javascript
// Custom rate limiting
const customRateLimit = securityMiddleware.apiRateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 50, // 50 requests per 5 minutes
    message: 'Too many requests, please slow down'
});

// Custom CORS
const customCORS = securityMiddleware.configureCORS({
    origin: ['https://app.example.com', 'https://admin.example.com'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Custom-Header']
});
```

## 📈 Monitoring and Analytics

### Security Monitoring

```javascript
// Get security statistics
const securityStats = securityMiddleware.getStats();
console.log('Security Stats:', securityStats);

// Monitor suspicious activity
const suspiciousIPs = securityStats.suspiciousIPDetails;
suspiciousIPs.forEach(ip => {
    console.log(`Suspicious IP: ${ip.ip}, Requests: ${ip.requestCount}`);
});
```

### User Analytics

```javascript
// Get usage statistics
const startDate = new Date();
startDate.setDate(startDate.getDate() - 30);
const endDate = new Date();

const usageStats = await User.getUsageStats(startDate, endDate);
console.log('Usage Statistics:', usageStats);

// Get users by plan
const premiumUsers = await User.findByPlan('premium');
console.log('Premium Users:', premiumUsers.length);

// Get locked accounts
const lockedAccounts = await User.getLockedAccounts();
console.log('Locked Accounts:', lockedAccounts.length);
```

### Logging

```javascript
const { logInfo, logError, logWarning } = require('./utils/logger');

// Log authentication events
logInfo('User logged in successfully', {
    userId: user._id,
    email: user.email,
    ip: req.ip
});

// Log security events
logWarning('Suspicious login attempt', {
    email: req.body.email,
    ip: req.ip,
    userAgent: req.get('User-Agent')
});

// Log errors
logError('Authentication failed', error, {
    userId: user._id,
    ip: req.ip
});
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- auth.test.js

# Run with coverage
npm run test:coverage
```

### Test Examples

```javascript
// Test user registration
describe('User Registration', () => {
    it('should register a new user successfully', async () => {
        const userData = {
            email: 'test@example.com',
            password: 'SecurePass123!',
            firstName: 'Test',
            lastName: 'User',
            plan: 'free'
        };

        const response = await request(app)
            .post('/api/auth/register')
            .send(userData)
            .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.user.email).toBe(userData.email);
    });
});

// Test authentication
describe('Authentication', () => {
    it('should authenticate user with valid credentials', async () => {
        const loginData = {
            email: 'test@example.com',
            password: 'SecurePass123!'
        };

        const response = await request(app)
            .post('/api/auth/login')
            .send(loginData)
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.tokens.accessToken).toBeDefined();
    });
});
```

## 🚀 Production Deployment

### Security Checklist

- [ ] Change all default secrets and keys
- [ ] Configure proper CORS origins
- [ ] Set up IP whitelisting/blacklisting
- [ ] Configure rate limiting
- [ ] Enable HTTPS
- [ ] Set up monitoring and alerting
- [ ] Configure backup and recovery
- [ ] Set up log aggregation
- [ ] Configure firewall rules
- [ ] Set up SSL/TLS certificates

### Performance Optimization

```javascript
// Enable compression
const compression = require('compression');
app.use(compression());

// Configure caching
const cache = require('memory-cache');
app.use((req, res, next) => {
    const key = `__express__${req.originalUrl}`;
    const cachedBody = cache.get(key);
    if (cachedBody) {
        res.send(cachedBody);
        return;
    }
    res.sendResponse = res.send;
    res.send = (body) => {
        cache.put(key, body, 300000); // 5 minutes
        res.sendResponse(body);
    };
    next();
});

// Database indexing
// Ensure proper indexes on frequently queried fields
```

### Monitoring Setup

```javascript
// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        // Check database connection
        await mongoose.connection.db.admin().ping();
        
        // Check Redis connection
        await redis.ping();
        
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage()
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});
```

## 🤝 Contributing

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Code Style

- Use ESLint and Prettier
- Follow JSDoc documentation standards
- Write comprehensive tests
- Use meaningful commit messages

### Testing Guidelines

- Write unit tests for all functions
- Write integration tests for API endpoints
- Test error scenarios and edge cases
- Maintain good test coverage

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the documentation
- Review the example files
- Contact the development team

## 🔄 Changelog

### Version 1.0.0
- Initial release
- Complete authentication system
- JWT token management
- Session management
- API key management
- Security features
- Comprehensive logging
- Rate limiting
- Input validation
- Multi-plan support

---

**Note**: This authentication system is designed for production use but should be thoroughly tested and customized for your specific requirements. Always follow security best practices and keep dependencies updated. 