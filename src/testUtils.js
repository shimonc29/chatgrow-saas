const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

/**
 * Generate test JWT token
 */
function generateTestToken(userId, sessionId = 'test-session') {
  return jwt.sign(
    { userId, sessionId },
    process.env.JWT_SECRET || 'test-jwt-secret-for-testing-only-minimum-32-chars',
    { expiresIn: '1h' }
  );
}

/**
 * Generate test API key
 */
function generateTestApiKey() {
  return 'test-api-key-' + Math.random().toString(36).substring(7);
}

/**
 * Create mock user object
 */
function createMockUser(overrides = {}) {
  return {
    _id: new mongoose.Types.ObjectId(),
    name: 'Test User',
    email: 'test@example.com',
    role: 'provider',
    sessions: [
      {
        sessionId: 'test-session',
        createdAt: new Date(),
        lastActivity: new Date(),
        active: true,
      },
    ],
    ...overrides,
  };
}

/**
 * Create mock customer object
 */
function createMockCustomer(providerId, overrides = {}) {
  return {
    _id: new mongoose.Types.ObjectId(),
    name: 'Test Customer',
    email: 'customer@example.com',
    phone: '050-1234567',
    providerId,
    source: 'manual',
    tags: [],
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Create mock appointment object
 */
function createMockAppointment(providerId, customerId, overrides = {}) {
  return {
    _id: new mongoose.Types.ObjectId(),
    customer: customerId,
    providerId,
    date: new Date('2025-12-25'),
    time: '10:00',
    serviceType: 'consultation',
    duration: 60,
    status: 'confirmed',
    source: 'manual',
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Mock mongoose connection
 */
function mockMongooseConnection() {
  // Override mongoose.connect to prevent actual connection during tests
  jest.spyOn(mongoose, 'connect').mockResolvedValue(mongoose);
}

/**
 * Clean up all mocks
 */
function cleanupMocks() {
  jest.clearAllMocks();
  jest.restoreAllMocks();
}

module.exports = {
  generateTestToken,
  generateTestApiKey,
  createMockUser,
  createMockCustomer,
  createMockAppointment,
  mockMongooseConnection,
  cleanupMocks,
};
